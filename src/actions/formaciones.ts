'use server'

import { errorDeBase, type ResultadoEntidad } from '@/lib/entidades/campos'
import { revalidarPartidos } from '@/lib/revalidar'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'
import { createClient } from '@/lib/supabase/server'
import type { Posicion } from '@/types'

/**
 * Quiénes juegan un partido: titulares y suplentes.
 *
 * Es el eslabón que faltaba entre el plantel y la planilla de carga.
 * `PlanillaCarga` filtra la grilla con `enCancha()`, que arranca de las
 * titulares de `formaciones`: sin esta pantalla, un partido creado desde el
 * panel abre la planilla con la grilla vacía y no se puede cargar un gol.
 *
 * La formación se copia del plantel de la temporada y después se ajusta, en
 * lugar de escribirse de cero: el dorsal y la posición del partido salen de
 * ahí, y lo que cambia de un partido a otro es quién entra y quién no.
 */

export interface FilaFormacion {
  jugadora_id: string
  es_titular: boolean
  dorsal: number | null
  posicion: Posicion | null
}

/**
 * Reemplaza la formación entera del partido.
 *
 * Borra y vuelve a insertar en lugar de hacer un diff: son quince filas sin
 * nada colgando —a `formaciones` no la referencia nadie— y un diff de quince
 * filas tiene más superficie de error que una escritura completa.
 *
 * **No es atómico**: si el insert falla después del delete, el partido queda
 * sin formación. Es un riesgo acotado —la pantalla sigue teniendo la lista y
 * se vuelve a guardar— y la alternativa sería escribir una función en Postgres
 * para una operación que hace una sola persona a la vez.
 */
export async function guardarFormacion(
  partidoId: string,
  filas: readonly FilaFormacion[],
): Promise<ResultadoEntidad> {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.' }

  const supabase = await createClient()

  const { error: errorBorrado } = await supabase
    .from('formaciones')
    .delete()
    .eq('partido_id', partidoId)

  if (errorBorrado) return { error: 'No se pudo guardar la formación' }

  if (filas.length > 0) {
    const { error } = await supabase
      .from('formaciones')
      .insert(filas.map((fila) => ({ ...fila, partido_id: partidoId })))

    if (error) return { error: errorDeBase(error, 'Una jugadora está repetida en la formación') }
  }

  revalidarPartidos()

  return { id: partidoId }
}
