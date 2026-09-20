'use server'

import { errorDeBase, type ResultadoEntidad } from '@/lib/entidades/campos'
import { esquemaFilaPlantel, filaDePlantel } from '@/lib/entidades/plantel'
import { revalidarJugadoras } from '@/lib/revalidar'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'
import { createClient } from '@/lib/supabase/server'

/**
 * Quién está en el plantel de cada temporada, con su dorsal.
 *
 * Es la tabla de la que depende que la planilla de carga sirva: la grilla de
 * jugadoras del partido sale de las formaciones, y las formaciones se arman
 * con el plantel. Sin plantel, la planilla abre con la grilla vacía.
 *
 * `plantel` tiene clave primaria compuesta `(temporada_id, jugadora_id)`, así
 * que agregar y editar son **la misma operación**: un `upsert`. Separarlas
 * obligaría a la pantalla a saber si la fila ya existe, que es justo lo que la
 * clave primaria ya sabe.
 */
export async function guardarFilaPlantel(datos: unknown): Promise<ResultadoEntidad> {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.' }

  const parseo = esquemaFilaPlantel.safeParse(datos)
  if (!parseo.success) {
    return { error: 'Faltan datos', motivos: parseo.error.issues.map((i) => i.message) }
  }

  const supabase = await createClient()
  const fila = filaDePlantel(parseo.data)

  const { error } = await supabase
    .from('plantel')
    .upsert(fila, { onConflict: 'temporada_id,jugadora_id' })

  // `plantel_dorsal_unico_idx`: dos jugadoras no comparten número en la misma
  // temporada. El formulario ya lo avisa mientras se tipea; esto es la red.
  if (error) return { error: errorDeBase(error, 'Ese dorsal ya lo tiene otra jugadora') }

  revalidarJugadoras()

  return { id: fila.jugadora_id }
}

/**
 * Saca a una jugadora del plantel de una temporada.
 *
 * Esto **sí** se borra, al revés que la jugadora: la fila de `plantel` no la
 * referencia nadie y sacarla no pierde ningún dato deportivo. Los goles que
 * hizo siguen en `eventos`, que apunta a la jugadora y no al plantel.
 *
 * Lo que sí queda es su formación en los partidos que ya jugó: `formaciones`
 * cuelga del partido, no del plantel, y tiene que seguir diciendo quién estuvo
 * en cancha ese día.
 */
export async function sacarDelPlantel(
  temporadaId: string,
  jugadoraId: string,
): Promise<ResultadoEntidad> {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('plantel')
    .delete()
    .eq('temporada_id', temporadaId)
    .eq('jugadora_id', jugadoraId)

  if (error) return { error: 'No se pudo sacar del plantel' }

  revalidarJugadoras()

  return { id: jugadoraId }
}
