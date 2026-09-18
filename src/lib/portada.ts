/**
 * Lógica pura de los tres widgets deportivos de la portada: la barra de
 * estado, la cinta de fecha a fecha y el ranking corto de goleadoras
 * (blueprint 7.2, puntos 1, 4 y 5).
 *
 * Sin JSX y sin base, como `partido.ts` y `temporada.ts`: lo que decide qué
 * chip entra en la cinta y cuál es "el próximo" se testea solo.
 */

import { resultadoParaAldosivi } from '@/lib/formato'
import type { ResultadoAldosivi } from '@/lib/formato'
import { dividirFixture } from '@/lib/temporada'
import type { FilaTabla, PartidoConEquipos } from '@/types'

// ============================================
// Barra de estado
// ============================================

/** "3°" — el ordinal femenino no aplica: es "la 3ª posición" pero "3° puesto". */
export function ordinalPosicion(posicion: number): string {
  return `${posicion}°`
}

/**
 * "3° · 24 puntos".
 *
 * Los puntos van con la palabra entera y no como "pts": la barra la lee
 * también un lector de pantalla, y "24 pts" se pronuncia "24 pe te ese".
 */
export function textoPosicion(fila: Pick<FilaTabla, 'posicion' | 'puntos'>): string {
  const puntos = `${fila.puntos} ${fila.puntos === 1 ? 'punto' : 'puntos'}`
  return `${ordinalPosicion(fila.posicion)} · ${puntos}`
}

// ============================================
// Fecha a fecha
// ============================================

export const ETIQUETA_RESULTADO: Record<
  Exclude<ResultadoAldosivi, null>,
  string
> = {
  ganado: 'Ganó',
  empatado: 'Empató',
  perdido: 'Perdió',
}

/**
 * La letra del chip. Es redundante con el color a propósito: el resultado no
 * puede depender sólo de verde, gris y rojo (WCAG 1.4.1, "el color no es el
 * único medio").
 */
export const LETRA_RESULTADO: Record<Exclude<ResultadoAldosivi, null>, string> = {
  ganado: 'G',
  empatado: 'E',
  perdido: 'P',
}

export interface ChipTemporada {
  partido: PartidoConEquipos
  /** null cuando el partido todavía no se jugó. */
  resultado: ResultadoAldosivi
  jugado: boolean
  /** El primero de los que vienen. Es el único que va destacado. */
  esProximo: boolean
}

export interface VentanaCinta {
  /** Cuántos partidos jugados entran, de los más recientes. */
  jugados?: number
  /** Cuántos de los que vienen entran, desde el próximo. */
  porJugar?: number
}

/**
 * La cinta de fecha a fecha: unos pocos partidos alrededor de hoy, en orden
 * cronológico.
 *
 * **No entra la temporada entera.** Una cinta de 30 fechas en un contenedor
 * con scroll horizontal arranca siempre en la fecha 1, que es el dato menos
 * interesante de todos, y sin JavaScript no hay forma de posicionar el scroll
 * en el medio. Con una ventana de ocho, lo primero que se ve es lo último que
 * pasó. El fixture completo está a un link de distancia, en la temporada.
 *
 * La ventana se rellena para los dos lados: si la temporada terminó y no queda
 * nada por jugar, los lugares vacíos los ocupan más resultados; si no empezó,
 * más fechas por venir. La cinta nunca queda a la mitad.
 */
export function cintaTemporada(
  partidos: readonly PartidoConEquipos[],
  { jugados = 4, porJugar = 4 }: VentanaCinta = {},
): ChipTemporada[] {
  const fixture = dividirFixture(partidos)
  const total = jugados + porJugar

  // Cada mitad se estira sobre el lugar que la otra no usa: una temporada sin
  // empezar muestra ocho fechas por venir, y una terminada, los ocho últimos
  // resultados. La cinta mide siempre lo mismo.
  const queVienen = fixture.porJugar.slice(
    0,
    Math.max(porJugar, total - fixture.jugados.length),
  )

  // `slice(-0)` devuelve el array entero, no ninguno: sin este corte una
  // ventana sin lugar para jugados dibuja la temporada completa.
  const lugares = Math.max(0, total - queVienen.length)
  const yaJugados = lugares === 0 ? [] : fixture.jugados.slice(-lugares)

  return [
    ...yaJugados.map((partido) => ({
      partido,
      resultado: resultadoParaAldosivi(partido),
      jugado: true,
      esProximo: false,
    })),
    ...queVienen.map((partido, indice) => ({
      partido,
      resultado: null,
      jugado: false,
      esProximo: indice === 0,
    })),
  ]
}
