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

  // El equipo de cada una se resuelve **antes** de borrar nada: si esa consulta
  // falla, el partido se queda con la formación que ya tenía en vez de quedarse
  // sin ninguna.
  const equipos = await equiposDeLasJugadoras(supabase, filas)
  if ('error' in equipos) return equipos

  const { error: errorBorrado } = await supabase
    .from('formaciones')
    .delete()
    .eq('partido_id', partidoId)

  if (errorBorrado) return { error: 'No se pudo guardar la formación' }

  if (filas.length > 0) {
    const { error } = await supabase.from('formaciones').insert(
      filas.map((fila) => ({
        ...fila,
        partido_id: partidoId,
        equipo_id: equipos.porJugadora.get(fila.jugadora_id),
      })),
    )

    // `formaciones_dorsal_unico_idx`: dos jugadoras del mismo equipo no usan el
    // mismo número en el mismo partido. La pantalla ya lo avisa mientras se
    // carga; esto es la red.
    if (error) return { error: errorDeBase(error, 'Dos jugadoras tienen el mismo dorsal') }
  }

  revalidarPartidos()

  return { id: partidoId }
}

/**
 * Con qué equipo entra cada jugadora a la formación.
 *
 * **Sin esto no se podía guardar ninguna formación**, y es el síntoma que trajo
 * Carlos al crear la fecha 6. La migración `0020` agregó `formaciones.equipo_id`
 * con `not null` —hacía falta para poder cargar también la del rival— pero el
 * insert de acá siguió mandando las cuatro columnas de antes, así que Postgres
 * contestaba `23502: null value in column "equipo_id"`. Como `errorDeBase()` no
 * conoce ese código, a la pantalla le llegaba "No se pudo guardar" y no había
 * manera de saber qué faltaba. El partido quedaba además sin formación, porque
 * el delete ya había pasado.
 *
 * El equipo sale de `jugadoras.equipo_id` —el club en el que está hoy—, que es
 * exactamente lo que hizo la `0020` para rellenar las filas viejas. Queda
 * guardado en la formación: si mañana se va a otro club, los partidos que ya
 * jugó siguen diciendo con quién los jugó.
 */
async function equiposDeLasJugadoras(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filas: readonly FilaFormacion[],
): Promise<{ porJugadora: Map<string, string> } | { error: string }> {
  if (filas.length === 0) return { porJugadora: new Map() }

  const { data, error } = await supabase
    .from('jugadoras')
    .select('id, equipo_id')
    .in('id', [...new Set(filas.map((fila) => fila.jugadora_id))])

  if (error) return { error: 'No se pudo guardar la formación' }

  const porJugadora = new Map((data ?? []).map((j) => [j.id, j.equipo_id]))

  // Una jugadora que ya no está en la base no se puede convocar, y mandarla
  // igual haría fallar el insert entero cuando el delete ya pasó.
  const perdida = filas.find((fila) => !porJugadora.get(fila.jugadora_id))
  if (perdida) return { error: 'Hay una jugadora que ya no existe: volvé a abrir la formación' }

  return { porJugadora }
}
