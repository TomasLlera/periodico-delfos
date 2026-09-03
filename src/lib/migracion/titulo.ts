/**
 * El sufijo del título, que es el motivo de que hoy se trunquen todos.
 *
 * Los títulos de WordPress terminan así:
 *
 *     Defensa y Justicia 2-1 Tiburonas: Fecha N°12 – Aldosivi Femenino en la Primera B 2026
 *
 * Ochenta y siete caracteres para decir "Defensa y Justicia 2-1 Tiburonas". El
 * sufijo repite en cada nota la misma información —que es de Aldosivi, que es
 * fútbol femenino, en qué torneo— y empuja lo único que distingue a la nota
 * fuera de los 60 caracteres que muestra Google y de cualquier tarjeta del
 * sitio. Acá se corta y lo que dice se guarda donde va: la temporada en
 * `notas.temporada_id`, la fecha en el partido.
 *
 * Las siete formas que aparecen en las 70 notas del sitio viejo, todas
 * contempladas por los tests:
 *
 *     : Fecha N°12 – Aldosivi Femenino en la Primera B 2026     la común
 *     : Fecha N° 4 – Aldosivi Femenino en la Primera C 2024     con espacio
 *     : Fecha N°5 Aldosivi Femenino en la Primera C 2023        sin la raya
 *     : Aldosivi Femenino en la Primera C 2023                  sin la fecha
 *     : Postergado Fecha N°22 – Aldosivi Femenino…              con etapa
 *     : Semifinales – Aldosivi Femenino en la Primera B 2023    de playoffs
 *     ! – Primera C 2024                                        sin la marca
 */

import { decodificarEntidades, normalizarEspacios } from '@/lib/migracion/texto'
import type { ReferenciaTemporada } from '@/lib/migracion/tipos'

export interface TituloLimpio {
  /** El título sin el sufijo, listo para `notas.titulo`. */
  titulo: string
  /** Tal como venía de WordPress, ya con las entidades resueltas. */
  original: string
  /** El número de fecha que decía el sufijo. */
  fechaNumero: number | null
  /** "Semifinales", "Cuartos de Final", "Postergado". `null` en una fecha común. */
  etapa: string | null
  temporada: ReferenciaTemporada | null
}

/**
 * El sufijo completo, con la marca "Aldosivi Femenino en la".
 *
 * `[^:]` en la etapa impide que el match arranque antes del último `:` del
 * título, que es lo que pasaría con un marcador escrito "Defensores de Belgrano
 * 2 – 1 Tiburonas": la raya del resultado es candidata a separador y sin esa
 * restricción se comería medio título.
 *
 * La raya antes de "Aldosivi" es opcional porque hay una nota de 2023 que no la
 * tiene.
 *
 * Los grupos van numerados y no nombrados porque el `target` del proyecto es
 * ES2017 y los nombrados piden ES2018.
 */
// 1 etapa · 2 división · 3 año
const SUFIJO_CON_MARCA =
  /\s*:\s*([^:]*?)\s*(?:[–—-]\s*)?Aldosivi\s+Femenino\s+en\s+la\s+Primera\s+([A-Z])\s+(\d{4})\s*$/iu

/**
 * El sufijo corto, sólo torneo y año: `¡Campaña histórica! – Primera C 2024`.
 *
 * Exige un separador explícito antes de "Primera" para no comerse el final de
 * un título que hable del torneo en la oración ("…el ascenso a la Primera B 2026").
 */
// 1 división · 2 año
const SUFIJO_SIN_MARCA = /\s*[:–—-]\s*Primera\s+([A-Z])\s+(\d{4})\s*$/iu

/** "Fecha N°12", "Fecha N° 4", "Fecha 12", "Fecha Nº 3". */
const NUMERO_DE_FECHA = /\bfecha\s*n?[°º]?\s*(\d{1,3})\b/iu

export function slugDeTemporada(division: string, anio: number): string {
  return `${division.toLowerCase().replace(/\s+/g, '-')}-${anio}`
}

function temporadaDesde(division: string, anio: string): ReferenciaTemporada {
  const nombreDivision = `Primera ${division.toUpperCase()}`
  const anioNumero = Number(anio)
  return {
    nombre: `${nombreDivision} ${anioNumero}`,
    slug: slugDeTemporada(nombreDivision, anioNumero),
    division: nombreDivision,
    anio: anioNumero,
  }
}

/**
 * Separa el número de fecha del resto de la etapa.
 *
 * "Postergado Fecha N°22" deja fecha 22 y etapa "Postergado"; "Semifinales" no
 * tiene número y queda entera como etapa.
 */
function partirEtapa(bruta: string): { fechaNumero: number | null; etapa: string | null } {
  const texto = normalizarEspacios(bruta)
  if (texto === '') return { fechaNumero: null, etapa: null }

  const conNumero = NUMERO_DE_FECHA.exec(texto)
  if (!conNumero) return { fechaNumero: null, etapa: texto }

  const resto = normalizarEspacios(texto.replace(NUMERO_DE_FECHA, ' '))
  return {
    fechaNumero: Number(conNumero[1]),
    etapa: resto === '' ? null : resto,
  }
}

/**
 * Saca el sufijo del título y devuelve lo que decía, ya estructurado.
 *
 * Si ningún patrón engancha, el título vuelve como estaba: es preferible una
 * nota con el título largo a un recorte a ciegas que le coma el final a un
 * título que nunca tuvo sufijo.
 */
export function limpiarTitulo(tituloCrudo: string): TituloLimpio {
  const original = normalizarEspacios(decodificarEntidades(tituloCrudo))

  const conMarca = SUFIJO_CON_MARCA.exec(original)
  if (conMarca) {
    const [, etapa = '', division = '', anio = ''] = conMarca
    return {
      titulo: normalizarEspacios(original.slice(0, conMarca.index)),
      original,
      ...partirEtapa(etapa),
      temporada: temporadaDesde(division, anio),
    }
  }

  const sinMarca = SUFIJO_SIN_MARCA.exec(original)
  if (sinMarca) {
    const [, division = '', anio = ''] = sinMarca
    return {
      titulo: normalizarEspacios(original.slice(0, sinMarca.index)),
      original,
      fechaNumero: null,
      etapa: null,
      temporada: temporadaDesde(division, anio),
    }
  }

  return { titulo: original, original, fechaNumero: null, etapa: null, temporada: null }
}
