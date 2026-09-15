/**
 * Lógica pura de la ficha de jugadora: la edad, los totales de carrera y el
 * rival de cada gol.
 *
 * Las estadísticas **nunca se escriben a mano**: salen de las vistas
 * `estadisticas_jugadora` y `goleadoras` (ver `0006_vistas.sql`). Acá sólo se
 * suman las filas que ya vienen calculadas.
 */

import type { EstadisticasJugadora, GolDeJugadora } from '@/types'

/**
 * La edad en años cumplidos.
 *
 * `hoy` se inyecta en lugar de leer el reloj adentro: una función que devuelve
 * algo distinto cada día no se puede testear. La página le pasa `new Date()`.
 *
 * Devuelve `null` si no hay fecha de nacimiento cargada —que es lo normal en
 * este plantel— o si la fecha no se puede leer.
 */
export function edad(fechaNacimiento: string | null, hoy: Date): number | null {
  if (!fechaNacimiento) return null

  const nacimiento = new Date(fechaNacimiento)
  if (Number.isNaN(nacimiento.getTime())) return null

  let anios = hoy.getUTCFullYear() - nacimiento.getUTCFullYear()

  // Todavía no cumplió este año: el mes, o el día dentro del mismo mes.
  const mes = hoy.getUTCMonth() - nacimiento.getUTCMonth()
  if (mes < 0 || (mes === 0 && hoy.getUTCDate() < nacimiento.getUTCDate())) anios -= 1

  return anios >= 0 && anios < 120 ? anios : null
}

export interface TotalesJugadora {
  partidos: number
  titular: number
  goles: number
  amarillas: number
  rojas: number
}

/**
 * Los totales de carrera: la suma de todas las temporadas.
 *
 * `estadisticas_jugadora` devuelve una fila por temporada, así que sin esto la
 * ficha mostraría sólo el último año y llamaría "goles" a lo que es "goles en
 * 2026".
 */
export function totalesJugadora(
  filas: readonly EstadisticasJugadora[],
): TotalesJugadora {
  return filas.reduce<TotalesJugadora>(
    (total, fila) => ({
      partidos: total.partidos + fila.partidos,
      titular: total.titular + fila.titular,
      goles: total.goles + fila.goles,
      amarillas: total.amarillas + fila.amarillas,
      rojas: total.rojas + fila.rojas,
    }),
    { partidos: 0, titular: 0, goles: 0, amarillas: 0, rojas: 0 },
  )
}

export interface RivalDelGol {
  nombre: string
  /** Si Aldosivi jugaba de local. La ficha lo muestra como "(V)". */
  deLocal: boolean
}

/**
 * Contra quién fue el gol.
 *
 * Es la misma regla que `rival()` en `formato.ts`, pero contra la forma
 * recortada que trae la query de goles: pedir el equipo entero para leerle el
 * nombre corto sería traer el escudo y la ciudad de cada rival por cada gol.
 */
export function rivalDelGol(gol: GolDeJugadora): RivalDelGol {
  const { equipo_local: local, equipo_visitante: visitante } = gol.partido

  return local.es_aldosivi
    ? { nombre: visitante.nombre_corto, deLocal: true }
    : { nombre: local.nombre_corto, deLocal: false }
}

/**
 * Los goles del más nuevo al más viejo.
 *
 * PostgREST no garantiza el orden de una relación embebida, y ordenar por el
 * minuto sería ordenar todos los goles de la carrera por el reloj del partido:
 * el de los 3 minutos de 2024 antes que el de los 90 de 2026.
 */
export function golesOrdenados(goles: readonly GolDeJugadora[]): GolDeJugadora[] {
  return [...goles].sort((a, b) => {
    const fecha =
      new Date(b.partido.fecha_hora).getTime() - new Date(a.partido.fecha_hora).getTime()
    return fecha || b.minuto - a.minuto || b.adicionado - a.adicionado
  })
}
