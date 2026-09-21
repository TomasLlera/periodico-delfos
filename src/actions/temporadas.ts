'use server'

import { errorDeBase, type ResultadoEntidad } from '@/lib/entidades/campos'
import { esquemaTemporada } from '@/lib/entidades/temporada'
import { revalidarTemporadas } from '@/lib/revalidar'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'
import { createClient } from '@/lib/supabase/server'

/**
 * Alta, edición y baja de temporadas.
 *
 * La temporada activa es la que mira la portada, y hay una sola: el índice
 * `temporadas_una_activa_idx` lo garantiza. Como con el equipo propio, activar
 * una exige desactivar la otra **antes** del update, o el índice devuelve un
 * 23505 que no explica nada.
 */

async function desactivarALaAnterior(
  supabase: Awaited<ReturnType<typeof createClient>>,
  idNueva: string | null,
): Promise<void> {
  let query = supabase.from('temporadas').update({ activa: false }).eq('activa', true)
  if (idNueva) query = query.neq('id', idNueva)
  await query
}

export async function guardarTemporada(
  datos: unknown,
  id: string | null,
): Promise<ResultadoEntidad> {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.' }

  const parseo = esquemaTemporada.safeParse(datos)
  if (!parseo.success) {
    return { error: 'Faltan datos', motivos: parseo.error.issues.map((i) => i.message) }
  }

  const supabase = await createClient()
  const fila = parseo.data

  if (fila.activa) await desactivarALaAnterior(supabase, id)

  const { data, error } = id
    ? await supabase.from('temporadas').update(fila).eq('id', id).select('id').single()
    : await supabase.from('temporadas').insert(fila).select('id').single()

  if (error) return { error: errorDeBase(error, 'Ya hay una temporada con ese slug') }

  revalidarTemporadas()

  return { id: data.id }
}

/**
 * Borra una temporada.
 *
 * `partidos.temporada_id` es `on delete restrict`: una temporada con fixture
 * cargado no se borra. `plantel` y `tabla_posiciones`, en cambio, son
 * `on delete cascade` —cuelgan de la temporada y no tienen sentido sin ella—,
 * así que borrar una temporada recién creada se lleva su plantel si lo tenía.
 * La pantalla lo avisa antes de preguntar.
 */
export async function borrarTemporada(id: string): Promise<ResultadoEntidad> {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.' }

  const supabase = await createClient()
  const { error } = await supabase.from('temporadas').delete().eq('id', id)

  if (error) {
    return {
      error:
        error.code === '23503'
          ? 'No se puede borrar: la temporada ya tiene partidos cargados'
          : 'No se pudo borrar la temporada',
    }
  }

  revalidarTemporadas()

  return { id }
}
