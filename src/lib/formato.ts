import { format, formatDistanceToNowStrict } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Evento, PartidoConEquipos } from '@/types'

/** "2 de agosto de 2026" */
export function fechaLarga(iso: string): string {
  return format(new Date(iso), "d 'de' MMMM 'de' yyyy", { locale: es })
}

/** "2 ago" — para chips y listados donde el espacio manda. */
export function fechaCorta(iso: string): string {
  return format(new Date(iso), 'd MMM', { locale: es })
}

/** "sábado 2/8, 15:30" — para el próximo partido. */
export function fechaHoraPartido(iso: string): string {
  return format(new Date(iso), "EEEE d/M', ' HH:mm", { locale: es })
}

/** "hace 3 días" */
export function hace(iso: string): string {
  return `hace ${formatDistanceToNowStrict(new Date(iso), { locale: es })}`
}

/** "23'" o "45+2'" */
export function minutoEvento(evento: Pick<Evento, 'minuto' | 'adicionado'>): string {
  return evento.adicionado > 0
    ? `${evento.minuto}+${evento.adicionado}'`
    : `${evento.minuto}'`
}

/**
 * Tiempo de lectura estimado. 200 palabras por minuto es el estándar para
 * texto corrido en español.
 */
export function tiempoLectura(palabras: number): string {
  return `${Math.max(1, Math.round(palabras / 200))} min de lectura`
}

/** Cuenta las palabras de un documento TipTap sin renderizarlo. */
export function contarPalabras(nodo: unknown): number {
  if (!nodo || typeof nodo !== 'object') return 0
  const n = nodo as { text?: string; content?: unknown[] }
  if (typeof n.text === 'string') {
    return n.text.trim().split(/\s+/).filter(Boolean).length
  }
  if (Array.isArray(n.content)) {
    return n.content.reduce<number>((total, hijo) => total + contarPalabras(hijo), 0)
  }
  return 0
}

/** "Aldosivi 0 - 1 All Boys". Devuelve null si todavía no hay resultado. */
export function marcador(partido: PartidoConEquipos): string | null {
  if (partido.goles_local === null || partido.goles_visitante === null) return null
  return `${partido.equipo_local.nombre_corto} ${partido.goles_local} - ${partido.goles_visitante} ${partido.equipo_visitante.nombre_corto}`
}

export type ResultadoAldosivi = 'ganado' | 'empatado' | 'perdido' | null

/** Resultado desde el punto de vista de Aldosivi, sea local o visitante. */
export function resultadoParaAldosivi(partido: PartidoConEquipos): ResultadoAldosivi {
  const { goles_local: gl, goles_visitante: gv } = partido
  if (gl === null || gv === null) return null

  const aldosiviEsLocal = partido.equipo_local.es_aldosivi
  const aldosiviEsVisitante = partido.equipo_visitante.es_aldosivi
  if (!aldosiviEsLocal && !aldosiviEsVisitante) return null

  const propios = aldosiviEsLocal ? gl : gv
  const ajenos = aldosiviEsLocal ? gv : gl

  if (propios > ajenos) return 'ganado'
  if (propios < ajenos) return 'perdido'
  return 'empatado'
}

/** El rival de Aldosivi en un partido dado. */
export function rival(partido: PartidoConEquipos) {
  return partido.equipo_local.es_aldosivi
    ? partido.equipo_visitante
    : partido.equipo_local
}

/** "Fecha 11 · Primera B 2026" */
export function etiquetaFecha(partido: PartidoConEquipos): string {
  const fecha = partido.fecha_numero ? `Fecha ${partido.fecha_numero}` : null
  return [fecha, partido.temporada.nombre].filter(Boolean).join(' · ')
}
