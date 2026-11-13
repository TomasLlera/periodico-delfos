import { borrarNota, guardarNota } from '@/actions/notas'
import { ERRORES, mapearErrorSupabase, respuestaDeError, type ErrorApi } from '@/lib/api/errores'
import { errorDeResultado } from '@/lib/api/resultado-nota'
import { getNotaPorSlug } from '@/lib/supabase/queries/notas'

/**
 * Una nota: leerla, editarla y borrarla.
 *
 * **El segmento se llama `[nota]` y no `[slug]` porque carga dos cosas.** Para
 * el `GET`, que es público, es el slug: la URL de la nota es lo que conoce
 * quien la lee. Para `PUT` y `DELETE`, que son del panel, es el id: el slug es
 * editable en el formulario y usarlo para identificar lo que se está por
 * renombrar sería ambiguo. Next obliga a un solo nombre de parámetro por
 * posición, así que el nombre dice "la nota" y cada método aclara cómo la
 * encuentra.
 *
 * **Los códigos, y por qué son éstos.**
 *
 * - `GET` → 200, o **404** si no existe o está en borrador.
 * - `PUT` → **200**. Editar no crea nada: cambia lo que ya estaba. Lo que crea
 *   es `POST /api/notas` (201) y lo que hace nacer la nota pública es
 *   `POST /api/publicaciones` (201).
 * - `DELETE` → **200** con la nota borrada en el cuerpo. 204 también sería
 *   correcto, pero deja a quien llama sin confirmación de qué se borró.
 *
 * Y en los tres, cualquier error previsible es un 4xx o un 503: sin sesión 401,
 * datos mal formados 400, nota ajena o inexistente 404, slug repetido 409,
 * base caída 503. Un 500 no es un resultado esperado.
 */

/** El 503 no se entiende sin decir cuándo volver. */
function con503(error: ErrorApi): Response {
  return respuestaDeError(error, error.estado === 503 ? { 'Retry-After': '30' } : undefined)
}

type Contexto = { params: Promise<{ nota: string }> }

/**
 * Leer una nota publicada, por su slug.
 *
 * Un slug que no existe y una nota en borrador devuelven lo mismo, y no son el
 * mismo hecho: en un caso no hay fila, en el otro la hay pero no es pública.
 * Contestar distinto diría desde afuera qué borradores se están escribiendo.
 * `getNotaPorSlug()` filtra por `estado = 'publicada'`, así que las dos
 * situaciones llegan acá como `null`.
 */
export async function GET(_request: Request, { params }: Contexto): Promise<Response> {
  const { nota: slug } = await params

  try {
    const nota = await getNotaPorSlug(slug)

    if (!nota) {
      return respuestaDeError(
        ERRORES.noEncontrada('No encontramos una nota publicada con ese slug.'),
      )
    }

    return Response.json(nota, { status: 200 })
  } catch (falla) {
    // Lo que esta ruta lee es público: un rechazo de RLS acá no es falta de
    // permiso, es que no hay sesión.
    return con503(mapearErrorSupabase(falla, { haySesion: false }))
  }
}

/**
 * Editar una nota que ya existe. **200, no 201.**
 *
 * Llama al mismo `guardarNota()` que usaba el panel, que valida con el esquema
 * de Zod y deja que los CHECK de la base tengan la última palabra. Lo único
 * que agrega la ruta es traducir el resultado a un código.
 */
export async function PUT(request: Request, { params }: Contexto): Promise<Response> {
  const { nota: id } = await params

  let recibido: unknown

  try {
    recibido = await request.json()
  } catch {
    return respuestaDeError(ERRORES.datosInvalidos('El cuerpo tiene que ser un JSON válido.'))
  }

  try {
    const resultado = await guardarNota(recibido, id)

    if (resultado.codigo) return con503(errorDeResultado(resultado))

    return Response.json({ id: resultado.id, slug: resultado.slug }, { status: 200 })
  } catch (falla) {
    return con503(mapearErrorSupabase(falla, { haySesion: true }))
  }
}

/**
 * Borrar una nota. **200**, con lo que se borró en el cuerpo.
 *
 * El 404 de acá cubre dos cosas a propósito —la nota no existe, o existe y no
 * es tuya— porque RLS no las distingue: una política que rechaza no tira
 * error, devuelve cero filas. Distinguirlas además le confirmaría a cualquiera
 * que esa nota existe y de quién es.
 */
export async function DELETE(_request: Request, { params }: Contexto): Promise<Response> {
  const { nota: id } = await params

  try {
    const resultado = await borrarNota(id)

    if (resultado.codigo) return con503(errorDeResultado(resultado))

    return Response.json({ id }, { status: 200 })
  } catch (falla) {
    return con503(mapearErrorSupabase(falla, { haySesion: true }))
  }
}
