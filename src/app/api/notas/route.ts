import { ERRORES, mapearErrorSupabase, respuestaDeError } from '@/lib/api/errores'
import { LARGO_MINIMO, terminoBuscado } from '@/lib/busqueda'
import { esquemaNota, filaDesde, firmaDe } from '@/lib/nota'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'
import { buscarNotas, insertarNota } from '@/lib/supabase/queries/notas'
import { createClient } from '@/lib/supabase/server'

/**
 * El listado de notas publicadas que coinciden con una búsqueda, y la creación
 * de borradores.
 *
 * Las dos mitades comparten archivo porque comparten recurso: `/api/notas` es
 * la colección, `GET` la lee y `POST` le agrega uno.
 */

/** Cuántos segundos pedirle a quien llama que espere cuando la base no está. */
const ESPERA_SUGERIDA = '30'

/** El 503 no se entiende sin decir cuándo volver. */
function con503(error: ReturnType<typeof mapearErrorSupabase>): Response {
  return respuestaDeError(
    error,
    error.estado === 503 ? { 'Retry-After': ESPERA_SUGERIDA } : undefined,
  )
}

/**
 * Buscar notas publicadas.
 *
 * **Una búsqueda sin resultados es 200 con `[]`, y es el caso que esta ruta
 * existe para fijar.** No es un error y no es un 404: el recurso `/api/notas`
 * existe, la consulta fue válida y la respuesta informa que no hay
 * coincidencias. Contestar 404 ahí sería decir que la búsqueda no existe. Es
 * justo el caso que alguien "arregla" por error al leer los 404 de al lado,
 * así que está escrito como test en los dos niveles.
 *
 * El 400 es otra cosa: `q` ausente o de menos de `LARGO_MINIMO` caracteres no
 * es una búsqueda vacía, es un pedido mal armado. El corte lo decide
 * `terminoBuscado()`, el mismo que usa la página `/buscar`, para que la API y
 * la pantalla no puedan discrepar.
 */
export async function GET(request: Request): Promise<Response> {
  const q = new URL(request.url).searchParams.get('q')
  const termino = terminoBuscado(q ?? undefined)

  if (termino.estado !== 'listo') {
    return respuestaDeError(
      ERRORES.datosInvalidos(
        termino.estado === 'vacio'
          ? 'Falta el parámetro q con el texto a buscar.'
          : `La búsqueda tiene que tener al menos ${LARGO_MINIMO} caracteres.`,
      ),
    )
  }

  try {
    return Response.json(await buscarNotas(termino.termino), { status: 200 })
  } catch (falla) {
    // Lo que esta ruta lee es público: un rechazo de RLS acá no es falta de
    // permiso, es que no hay sesión.
    return con503(mapearErrorSupabase(falla, { haySesion: false }))
  }
}

/**
 * Crear una nota, siempre como borrador.
 *
 * **Esta ruta no publica.** Publicar emite `nota/publicada` a Inngest y eso
 * dispara el fan-out a Facebook, Instagram y X: un efecto hacia afuera que no
 * puede salir de un POST. Para eso está el Server Action del panel, que lo
 * hace con confirmación y revalidando las rutas.
 *
 * **El 401 y el 403 son dos hechos distintos y por eso se preguntan por
 * separado.** Sin sesión de Supabase Auth es 401: no sabemos quién sos.
 * Con sesión pero sin fila en `autores` es 403: sabemos quién sos y no te
 * alcanza. Es el mismo criterio que `es_autor()` en RLS y el mismo que aplica
 * el layout del panel; acá se chequea antes para poder devolver el código
 * correcto en vez de dejar que la política de la base conteste `42501` y
 * tener que adivinar cuál de los dos era.
 */
export async function POST(request: Request): Promise<Response> {
  let autorDeLaSesion

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return respuestaDeError(ERRORES.sinSesion())

    autorDeLaSesion = await getAutorDeLaSesion()
  } catch (falla) {
    // Auth o la base sin responder mientras se averigua quién llama. Sin esto
    // sería un 500, y el pedido no tenía nada de malo.
    return con503(mapearErrorSupabase(falla, { haySesion: false }))
  }

  if (!autorDeLaSesion) return respuestaDeError(ERRORES.sinPermiso())

  let recibido: unknown

  try {
    recibido = await request.json()
  } catch {
    return respuestaDeError(ERRORES.datosInvalidos('El cuerpo tiene que ser un JSON válido.'))
  }

  // El mismo esquema que valida el formulario del panel. Duplicar las reglas
  // acá sería la forma segura de que un día digan cosas distintas.
  const parseo = esquemaNota.safeParse(recibido)
  if (!parseo.success) {
    const primero = parseo.error.issues[0]
    return respuestaDeError(
      ERRORES.datosInvalidos(primero?.message ?? 'Los datos de la nota no son válidos.'),
    )
  }

  try {
    const { data, error } = await insertarNota({
      ...filaDesde(parseo.data),
      autor_id: firmaDe(autorDeLaSesion),
      estado: 'borrador',
    })

    if (error) {
      // El caso frecuente, y por eso lleva su propio mensaje: dos notas del
      // mismo partido terminan con el mismo título y por lo tanto con el mismo
      // slug. Decir cuál es el campo evita que parezca una falla del sistema.
      if (error.code === '23505') {
        return respuestaDeError(ERRORES.conflicto('Ya existe una nota con ese slug.'))
      }

      return con503(mapearErrorSupabase(error, { haySesion: true }))
    }

    return Response.json(data, { status: 201 })
  } catch (falla) {
    return con503(mapearErrorSupabase(falla, { haySesion: true }))
  }
}
