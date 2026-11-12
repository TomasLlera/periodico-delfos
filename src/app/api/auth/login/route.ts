import { z } from 'zod'
import { ERRORES, mapearErrorDeAuth, respuestaDeError } from '@/lib/api/errores'
import { createClient } from '@/lib/supabase/server'

/**
 * Entrar al panel, con el código de estado puesto por el servidor.
 *
 * **Es el motivo por el que existe toda esta carpeta.** El login de la interfaz
 * es un Server Action: responde 200 con el error adentro del cuerpo, así que
 * desde Network, desde Postman o desde un test no se distingue un ingreso
 * correcto de uno fallido. Acá sí: 200 entró, 401 no entró, 400 el pedido venía
 * mal armado, 429 probaste demasiado seguido, 503 Auth no contesta.
 *
 * **No reemplaza al Server Action.** `src/actions/sesion.ts` sigue siendo lo
 * que usa el formulario del panel, y no cambia. Las dos puertas terminan en la
 * misma sesión de Supabase y en las mismas políticas de RLS.
 *
 * **La cookie la deja `createClient()`**, el mismo cliente de `@supabase/ssr`
 * que ya usa todo el proyecto. En un Route Handler el `cookieStore.set()` de
 * ese cliente sí tiene efecto —al revés que en un Server Component, donde el
 * `try/catch` lo descarta porque el middleware ya refrescó la sesión—, así que
 * no hace falta nada propio: un login correcto por esta ruta deja la misma
 * cookie `sb-…-auth-token` que el formulario.
 */

/**
 * Lo que la ruta acepta.
 *
 * El mail se valida de forma: un `400` por un mail sin arroba es distinto de un
 * `401` por un mail que no tiene cuenta, y confundirlos es lo que hace que un
 * cliente reintente lo que nunca va a andar. La contraseña sólo se exige
 * presente: su contenido lo juzga Auth, y acá no se mira.
 */
const esquemaLogin = z.object({
  email: z.email('El mail no tiene un formato válido'),
  password: z.string().min(1, 'Falta la contraseña'),
})

export async function POST(request: Request): Promise<Response> {
  let recibido: unknown

  try {
    recibido = await request.json()
  } catch {
    return respuestaDeError(ERRORES.datosInvalidos('El cuerpo tiene que ser un JSON válido.'))
  }

  const parseo = esquemaLogin.safeParse(recibido)
  if (!parseo.success) {
    // El primer problema y no todos: la lista entera de Zod es para un
    // formulario que marca campo por campo, y acá quien llama es un cliente.
    const primero = parseo.error.issues[0]
    return respuestaDeError(
      ERRORES.datosInvalidos(primero?.message ?? 'Faltan el mail o la contraseña.'),
    )
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase.auth.signInWithPassword(parseo.data)

    if (error) return respuestaDeError(mapearErrorDeAuth(error))

    return Response.json(
      { usuario: { id: data.user.id, email: data.user.email } },
      { status: 200 },
    )
  } catch (falla) {
    // `signInWithPassword` devuelve el error en `error` casi siempre, pero un
    // fetch que ni sale tira. Sin esto, Auth caído sería un 500.
    return respuestaDeError(mapearErrorDeAuth(falla))
  }
}
