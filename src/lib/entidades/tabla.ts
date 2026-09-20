/**
 * La carga manual de la tabla de posiciones.
 *
 * **Es la única excepción del proyecto a "ningún dato deportivo se escribe a
 * mano"** (blueprint § 4.4), y la excepción está razonada: el medio cubre a
 * Aldosivi y no al campeonato entero, así que calcular la tabla desde
 * `partidos` exigiría cargar los partidos de los otros diez equipos. Se carga
 * a mano por fecha, y está acotada a esta tabla: nunca al texto de una nota.
 *
 * Por eso este archivo es el que más chequeos tiene de los seis. Los tres CHECK
 * de `0004_tabla_posiciones.sql` existen justamente porque la carga es manual,
 * y acá están repetidos para que el error salga al lado del campo mientras se
 * tipea y no como un 400 después de cargar once filas.
 */

import { z } from 'zod'
import { enteroRequerido } from '@/lib/entidades/campos'
import type { FilaTabla } from '@/types'

/** Ni el campeonato más grande de la zona tiene treinta equipos. */
export const EQUIPOS_MAXIMOS = 30

const cuenta = (campo: string) => enteroRequerido(campo, 0, 99)

export const esquemaFilaTabla = z
  .object({
    temporada_id: z.uuid('Elegí la temporada'),
    fecha_numero: enteroRequerido('La fecha', 1, 40),
    equipo_id: z.uuid('Elegí el equipo'),
    posicion: enteroRequerido('La posición', 1, EQUIPOS_MAXIMOS),
    puntos: cuenta('Los puntos'),
    jugados: cuenta('Los jugados'),
    ganados: cuenta('Los ganados'),
    empatados: cuenta('Los empatados'),
    perdidos: cuenta('Los perdidos'),
    goles_favor: cuenta('Los goles a favor'),
    goles_contra: cuenta('Los goles en contra'),
  })
  // `partidos_cuadran`: jugados = ganados + empatados + perdidos.
  .refine((f) => f.jugados === f.ganados + f.empatados + f.perdidos, {
    path: ['jugados'],
    message: 'Los jugados tienen que ser la suma de ganados, empatados y perdidos',
  })
  // `puntos_cuadran`: puntos = ganados * 3 + empatados.
  .refine((f) => f.puntos === f.ganados * 3 + f.empatados, {
    path: ['puntos'],
    message: 'Los puntos no coinciden con los partidos ganados y empatados',
  })

export type EntradaFilaTabla = z.infer<typeof esquemaFilaTabla>

/**
 * Los puntos que corresponden. La pantalla los calcula en vez de pedirlos.
 *
 * Tres por ganado y uno por empatado es el reglamento, y pedirle a alguien que
 * los sume a mano —once veces, una por equipo— es pedirle que se equivoque.
 * Por eso `puntos` y `jugados` son campos derivados en el editor: se
 * escriben ganados, empatados y perdidos, y estos dos salen solos.
 *
 * El costo de esa decisión es real y conviene tenerlo escrito: **una quita de
 * puntos no se puede cargar**, porque `puntos_cuadran` —el CHECK de `0004` que
 * este esquema repite— la rechazaría igual. El día que pase hay que tocar las
 * dos cosas, el CHECK y este refine, no sólo la pantalla.
 */
export function puntosQueCorresponden(
  fila: Pick<EntradaFilaTabla, 'ganados' | 'empatados'>,
): number {
  return fila.ganados * 3 + fila.empatados
}

/** Los jugados que corresponden. Misma idea: la suma la hace la máquina. */
export function jugadosQueCorresponden(
  fila: Pick<EntradaFilaTabla, 'ganados' | 'empatados' | 'perdidos'>,
): number {
  return fila.ganados + fila.empatados + fila.perdidos
}

/**
 * Lo que no cierra en una fila, en palabras y todo junto.
 *
 * Devuelve **todos** los motivos porque una fila mal tipeada suele tener dos:
 * si se cargó un ganado de más, no cuadran ni los jugados ni los puntos.
 */
export function motivosQueNoCuadran(fila: EntradaFilaTabla): string[] {
  const motivos: string[] = []

  const jugados = jugadosQueCorresponden(fila)
  if (fila.jugados !== jugados) {
    motivos.push(`Los jugados dicen ${fila.jugados} y la suma da ${jugados}`)
  }

  const puntos = puntosQueCorresponden(fila)
  if (fila.puntos !== puntos) {
    motivos.push(`Los puntos dicen ${fila.puntos} y la cuenta da ${puntos}`)
  }

  return motivos
}

/**
 * Lo que le falta a la fecha entera para estar bien cargada.
 *
 * Una fila puede cerrar sola y la fecha estar mal igual: dos equipos en el
 * cuarto puesto, o el séptimo sin cargar. `tabla_posiciones_posicion_unica_idx`
 * atrapa el duplicado, pero el hueco no lo atrapa nadie —una tabla con diez de
 * once equipos es una tabla válida para Postgres— y termina publicada en la
 * portada con un equipo de menos.
 */
export function huecosDeLaFecha(
  filas: readonly Pick<FilaTabla, 'posicion'>[],
  equiposEsperados: number,
): string[] {
  const motivos: string[] = []
  const posiciones = filas.map((f) => f.posicion)

  const repetidas = [...new Set(posiciones.filter((p, i) => posiciones.indexOf(p) !== i))]
  if (repetidas.length > 0) {
    motivos.push(`Hay dos equipos en la posición ${repetidas.join(' y ')}`)
  }

  const faltantes = Array.from({ length: equiposEsperados }, (_, i) => i + 1).filter(
    (p) => !posiciones.includes(p),
  )
  if (filas.length > 0 && faltantes.length > 0) {
    motivos.push(`Faltan las posiciones ${faltantes.join(', ')}`)
  }

  return motivos
}

/**
 * La fecha con la que abre la pantalla: la última cargada más uno.
 *
 * La tabla se carga una fecha por semana, la siguiente siempre. Abrir en la
 * última ya cargada haría que el primer click de todas las semanas sea
 * corregir el número.
 */
export function fechaSugerida(filas: readonly Pick<FilaTabla, 'fecha_numero'>[]): number {
  if (filas.length === 0) return 1
  return Math.max(...filas.map((f) => f.fecha_numero)) + 1
}

/** Una fila en blanco, ya ubicada en la fecha y la temporada que se está cargando. */
export function filaEnBlanco(
  temporadaId: string,
  fechaNumero: number,
  posicion: number,
): EntradaFilaTabla {
  return {
    temporada_id: temporadaId,
    fecha_numero: fechaNumero,
    equipo_id: '',
    posicion,
    puntos: 0,
    jugados: 0,
    ganados: 0,
    empatados: 0,
    perdidos: 0,
    goles_favor: 0,
    goles_contra: 0,
  }
}
