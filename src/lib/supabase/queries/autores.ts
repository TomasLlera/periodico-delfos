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
