'use server'

import { errorDeBase, type ResultadoEntidad } from '@/lib/entidades/campos'
import { esquemaEquipo } from '@/lib/entidades/equipo'
import { revalidarEquipos } from '@/lib/revalidar'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'
import { createClient } from '@/lib/supabase/server'

/**
 * Alta, edición y baja de equipos.
 *
 * **Con la sesión del autor, nunca con la service role**: lo que habilita estas
 * escrituras es `escritura_autor` sobre `equipos` en `0008_rls.sql`, que pide
 * `es_autor()`. Es la misma regla que sigue todo el panel.
 *
 * Todo se vuelve a validar acá. El formulario ya corrió `esquemaEquipo`, pero
 * eso es comodidad para quien carga: un Server Action es una ruta HTTP y se
 * puede llamar sin haber pasado por la pantalla.
 */

/**
 * Deja a este equipo como el único con `es_aldosivi`.
 *
 * `equipos_un_aldosivi_idx` es un índice único parcial: si no se desmarca el
 * anterior **antes**, el update choca con un 23505 y el mensaje que ve quien
 * carga es "ya existe", que no explica nada. Las vistas de goleadoras y
 * estadísticas filtran por este campo, así que dos filas romperían los
 * conteos: el índice está bien, lo que falta es hacer el trabajo en orden.
 *
 * El `neq` evita desmarcar al que estamos por marcar, que dejaría la base un
 * instante sin equipo propio.
 */
async function desmarcarAlAnterior(
  supabase: Awaited<ReturnType<typeof createClient>>,
  idNuevo: string | null,
): Promise<void> {
  let query = supabase.from('equipos').update({ es_aldosivi: false }).eq('es_aldosivi', true)
  if (idNuevo) query = query.neq('id', idNuevo)
  await query
}

export async function guardarEquipo(datos: unknown, id: string | null): Promise<ResultadoEntidad> {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.' }

  const parseo = esquemaEquipo.safeParse(datos)
  if (!parseo.success) {
    return { error: 'Faltan datos', motivos: parseo.error.issues.map((i) => i.message) }
  }

  const supabase = await createClient()
  const fila = parseo.data

  if (fila.es_aldosivi) await desmarcarAlAnterior(supabase, id)

  const { data, error } = id
    ? await supabase.from('equipos').update(fila).eq('id', id).select('id').single()
    : await supabase.from('equipos').insert(fila).select('id').single()

  if (error) return { error: errorDeBase(error, 'Ya hay un equipo con ese slug') }

  revalidarEquipos()

  return { id: data.id }
}

/**
 * Borra un equipo.
 *
 * Las foreign keys de `partidos` y `tabla_posiciones` son `on delete restrict`,
 * así que un equipo que ya jugó no se puede borrar y Postgres devuelve 23503.
 * **Eso es lo correcto y no se fuerza**: borrarlo se llevaría puesto el
 * historial de los partidos que jugó. El mensaje lo dice con esas palabras en
 * vez de con el código.
 */
export async function borrarEquipo(id: string): Promise<ResultadoEntidad> {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.' }

  const supabase = await createClient()
  const { error } = await supabase.from('equipos').delete().eq('id', id)

  if (error) {
    return {
      error:
        error.code === '23503'
          ? 'No se puede borrar: el equipo ya juega partidos o está en la tabla de posiciones'
          : 'No se pudo borrar el equipo',
    }
  }

  revalidarEquipos()

  return { id }
}
