/**
 * Quién está en el plantel de una temporada, y con qué número.
 *
 * Es la tabla que hace que la planilla de carga sirva: `PlanillaCarga` dibuja
 * la grilla con las jugadoras del partido, y esas salen de las formaciones, que
 * se arman con el plantel. Un plantel vacío es una planilla con la grilla
 * vacía, y ahí se corta la cadena entera del dato deportivo.
 *
 * La posición vive acá y no en `jugadoras` porque cambia entre temporadas
 * (blueprint § 4.2). **El dorsal ya no**: la migración `0020` lo movió a
 * `formaciones`, donde es el de cada partido. La lógica de **lectura** del
 * plantel —agrupar por puesto, ordenar, iniciales— está en
 * `src/lib/plantel.ts`.
 */

import { z } from 'zod'
import type { FilaPlantel, Jugadora, JugadoraEnPlantel, Posicion } from '@/types'

const POSICIONES = [
  'arquera',
  'defensora',
  'mediocampista',
  'delantera',
  'dt',
  'ayudante',
] as const satisfies readonly Posicion[]

/**
 * **Sin `dorsal`, y no es un olvido.** La migración `0020` borró
 * `plantel.dorsal`: el número pasó a ser el de cada partido, en `formaciones`.
 * Mientras siguió acá, guardar una fila del plantel mandaba una columna que no
 * existe y Postgres contestaba `42703`, así que la pantalla del plantel no
 * podía guardar nada.
 *
 * El dorsal ahora se carga en la planilla de cada partido, que es además donde
 * se sabe de verdad con qué número salió a la cancha.
 */
export const esquemaFilaPlantel = z.object({
  temporada_id: z.uuid('Elegí la temporada'),
  jugadora_id: z.uuid('Elegí la jugadora'),
  /** `null` = la posición de la ficha. Es lo que ya resuelve `puestoEnTemporada()`. */
  posicion: z.enum(POSICIONES).nullable(),
  capitana: z.boolean(),
})

export type EntradaFilaPlantel = z.infer<typeof esquemaFilaPlantel>

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
    posicion: entrada.posicion,
    capitana: entrada.capitana,
  }
}
