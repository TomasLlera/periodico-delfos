'use server'

import { errorDeBase, type ResultadoEntidad } from '@/lib/entidades/campos'
import { esquemaJugadora } from '@/lib/entidades/jugadora'
import { revalidarJugadoras } from '@/lib/revalidar'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'
import { createClient } from '@/lib/supabase/server'

/**
 * Alta y edición de jugadoras.
 *
 * **No hay `borrarJugadora` y es a propósito.** `eventos.jugadora_id` y
 * `formaciones.jugadora_id` la referencian: borrarla dejaría la planilla de la
 * fecha 4 con un hueco donde había un gol. Lo que hay es `activa = false`, que
 * la saca de los planteles nuevos y la deja en el archivo, que es lo que
 * corresponde cuando alguien se va del club.
 *
 * La foto se sube con `subirImagen()` antes de llegar acá, igual que la portada
 * de una nota: lo que se guarda es la URL del bucket, nunca un `blob:` local
 * (regla no negociable 6).
 */
export async function guardarJugadora(
  datos: unknown,
  id: string | null,
): Promise<ResultadoEntidad> {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.' }

  const parseo = esquemaJugadora.safeParse(datos)
  if (!parseo.success) {
    return { error: 'Faltan datos', motivos: parseo.error.issues.map((i) => i.message) }
  }

  const supabase = await createClient()
  const fila = parseo.data

  const { data, error } = id
    ? await supabase.from('jugadoras').update(fila).eq('id', id).select('id').single()
    : await supabase.from('jugadoras').insert(fila).select('id').single()

  // El caso frecuente es la homónima: dos "M. González" dan el mismo slug.
  if (error) return { error: errorDeBase(error, 'Ya hay una jugadora con ese slug') }

  revalidarJugadoras()

  return { id: data.id }
}
