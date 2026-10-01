import { createClient } from '@/lib/supabase/server'
import type { Autor } from '@/types'

/**
 * El autor de la sesión actual, o `null` si no hay sesión o si el usuario
 * logueado no tiene fila en `autores`.
 *
 * **Las dos cosas son distintas y las dos importan.** Supabase Auth puede tener
 * usuarios que no son autores del medio —hoy no los hay, pero el día que exista
 * una cuenta de prueba sí—, y `es_autor()` en la base decide por la fila, no
 * por la sesión (ver `0008_rls.sql`). El admin usa el mismo criterio que RLS
 * para no mostrar una pantalla que después no deja escribir nada.
 */
export async function getAutorDeLaSesion(): Promise<Autor | null> {
  const supabase = await createClient()

  // `getUser()` valida el token contra el servidor de Auth. `getSession()` se
  // conforma con la cookie, que en un Server Component no alcanza.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase.from('autores').select('*').eq('id', user.id).maybeSingle()

  return (data as Autor | null) ?? null
}

/**
 * El autor que va a **figurar** en una nota nueva de esta sesión, que no
 * siempre es el de la sesión.
 *
 * Existe para que la vista previa no mienta. Quien escribe desde una cuenta
 * que no es del medio —la técnica, la de la suite— ve la nota como la va a ver
 * el lector: firmada por el titular, que es lo que `firmaDe()` va a grabar en
 * `autor_id` (ver `src/actions/notas.ts` y `0011_firma_autor.sql`).
 *
 * Devuelve el autor de la sesión si `firma_como` está en null, que es el caso
 * normal, y también si la fila apuntada no existe: preferimos una firma de más
 * a una pantalla en blanco.
 */
export async function getAutorQueFirma(): Promise<Autor | null> {
  const autor = await getAutorDeLaSesion()
  if (!autor?.firma_como) return autor

  const supabase = await createClient()
  const { data } = await supabase
    .from('autores')
    .select('*')
    .eq('id', autor.firma_como)
    .maybeSingle()

  return (data as Autor | null) ?? autor
}

/**
 * Todas las cuentas del panel, para la pantalla de autores.
 *
 * Ordenadas por rol y después por nombre: los editores primero, que son pocos y
 * los que mandan. Sin paginar, a propósito — esto es una redacción de tres
 * personas, no un CMS.
 *
 * **No trae el mail de cada uno.** El mail vive en `auth.users` y leerlo pide
 * la service role; la tabla `autores` no lo copia porque sería un dato que
 * queda viejo el día que alguien lo cambia desde Auth. La pantalla muestra el
 * nombre, el slug y el rol, que es con lo que se decide algo.
 */
export async function getAutores(): Promise<Autor[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('autores')
    .select('*')
    .order('rol')
    .order('nombre')

  return (data as Autor[] | null) ?? []
}
