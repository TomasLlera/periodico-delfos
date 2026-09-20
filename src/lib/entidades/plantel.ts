/**
 * Quién está en el plantel de una temporada, y con qué número.
 *
 * Es la tabla que hace que la planilla de carga sirva: `PlanillaCarga` dibuja
 * la grilla con las jugadoras del partido, y esas salen de las formaciones, que
 * se arman con el plantel. Un plantel vacío es una planilla con la grilla
 * vacía, y ahí se corta la cadena entera del dato deportivo.
 *
 * El dorsal y la posición viven acá y no en `jugadoras` porque cambian entre
 * temporadas (blueprint § 4.2). La lógica de **lectura** del plantel —agrupar
 * por puesto, ordenar, iniciales— está en `src/lib/plantel.ts`.
 */

import { z } from 'zod'
import { enteroOpcional } from '@/lib/entidades/campos'
import type { FilaPlantel, Jugadora, JugadoraEnPlantel, Posicion } from '@/types'

const POSICIONES = [
  'arquera',
  'defensora',
  'mediocampista',
  'delantera',
  'dt',
  'ayudante',
] as const satisfies readonly Posicion[]

export const esquemaFilaPlantel = z.object({
  temporada_id: z.uuid('Elegí la temporada'),
  jugadora_id: z.uuid('Elegí la jugadora'),
  // El mismo rango que el CHECK `dorsal_valido` de `0002`.
  dorsal: enteroOpcional('El dorsal', 1, 99),
  /** `null` = la posición de la ficha. Es lo que ya resuelve `puestoEnTemporada()`. */
  posicion: z.enum(POSICIONES).nullable(),
  capitana: z.boolean(),
})

export type EntradaFilaPlantel = z.infer<typeof esquemaFilaPlantel>

/**
 * La jugadora que ya tiene ese dorsal, si hay alguna.
 *
 * `plantel_dorsal_unico_idx` no deja dos, así que sin este chequeo el segundo
 * 10 se rechaza recién en el `insert`, con un error de Postgres y después de
 * haber tipeado. Decirlo mientras se escribe cuesta una comparación.
 */
export function duenaDelDorsal(
  dorsal: number | null,
  plantel: readonly JugadoraEnPlantel[],
  jugadoraId: string | null,
): JugadoraEnPlantel | null {
  if (dorsal === null) return null
  return plantel.find((j) => j.dorsal === dorsal && j.id !== jugadoraId) ?? null
}

/**
 * Las que todavía no están en este plantel.
 *
 * Es lo que ofrece el `<select>` de "agregar": listar las treinta y que
 * agregar una ya agregada falle contra la clave primaria sería hacerle perder
 * el tiempo a quien carga.
 *
 * Las inactivas no aparecen: una jugadora que se fue del club no se suma al
 * plantel de este año. Si hiciera falta, se la reactiva desde su ficha.
 */
export function jugadorasDisponibles(
  todas: readonly Jugadora[],
  plantel: readonly JugadoraEnPlantel[],
): Jugadora[] {
  const dentro = new Set(plantel.map((j) => j.id))
  return todas
    .filter((j) => j.activa && !dentro.has(j.id))
    .sort((a, b) => a.apellido.localeCompare(b.apellido, 'es'))
}

/**
 * Las capitanas de más.
 *
 * La base **no** lo impide: no hay índice único sobre `capitana`, y no lo hay
 * porque un equipo puede tener capitana y vice, y porque a mitad de temporada
 * la cinta cambia de brazo. Pero tres capitanas es un click mal dado, así que
 * la pantalla lo dice sin bloquear.
 */
export function capitanas(plantel: readonly JugadoraEnPlantel[]): JugadoraEnPlantel[] {
  return plantel.filter((j) => j.capitana)
}

/** Lo que va a la base al agregar o editar una fila. */
export function filaDePlantel(entrada: EntradaFilaPlantel): FilaPlantel {
  return {
    temporada_id: entrada.temporada_id,
    jugadora_id: entrada.jugadora_id,
    dorsal: entrada.dorsal,
    posicion: entrada.posicion,
    capitana: entrada.capitana,
  }
}
