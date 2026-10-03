import { HUSO_ARGENTINA } from '@/lib/entidades/campos'
import type { Sponsor, UbicacionSponsor } from '@/types'

/**
 * La lógica de los espacios de publicidad propia.
 *
 * Sin React y sin Supabase: decide **qué sponsor se ve y cuál no**, que es lo
 * único que de verdad hay que acertar. Un banner que sigue apareciendo después
 * de vencido es plata que el medio regala, y uno que no aparece estando pago es
 * una llamada incómoda.
 *
 * **La vigencia se compara acá además de en RLS**, y no es redundante por
 * casualidad: la política de la `0016` filtra lo que el sitio puede leer —ésa es
 * la que evita que el contrato de un sponsor que todavía no arrancó quede a la
 * vista—, y esto filtra lo que se dibuja. El panel, que sí puede leer todo
 * porque entra como editor, necesita este segundo filtro para mostrar un
 * listado con los vencidos adentro sin publicarlos.
 */

/**
 * Hoy en Mar del Plata, como `YYYY-MM-DD`.
 *
 * **No usa el reloj de la máquina.** El mismo cálculo corre en el servidor
 * —Vercel, en UTC— y en el navegador de quien mira, y una campaña que vence
 * "el domingo" no puede apagarse a las nueve de la noche del sábado para la
 * mitad del mundo. Es el mismo criterio que `HUSO_ARGENTINA` ya fija para la
 * hora de los partidos.
 */
export function hoyEnArgentina(ahora: Date = new Date()): string {
  const corrido = new Date(ahora.getTime() + offsetEnMs(HUSO_ARGENTINA))
  return corrido.toISOString().slice(0, 10)
}

/** `-03:00` → −10.800.000 ms. Vive acá porque es el único lugar que lo necesita. */
function offsetEnMs(huso: string): number {
  const [horas, minutos] = huso.slice(1).split(':').map(Number)
  const signo = huso.startsWith('-') ? -1 : 1
  return signo * ((horas ?? 0) * 60 + (minutos ?? 0)) * 60 * 1000
}

/**
 * `true` si el sponsor se tiene que estar viendo hoy.
 *
 * Las fechas se comparan como texto `YYYY-MM-DD` a propósito: en ese formato el
 * orden alfabético **es** el orden cronológico, así que no hay que construir un
 * `Date` por fila ni preocuparse por el huso dos veces. `hasta` es inclusivo —el
 * último día que se muestra— porque es lo que entiende cualquiera que vendió un
 * espacio "hasta el 31".
 */
export function estaVigente(sponsor: Sponsor, hoy: string): boolean {
  if (!sponsor.activo) return false
  if (sponsor.desde > hoy) return false
  return sponsor.hasta === null || sponsor.hasta >= hoy
}

/**
 * Los sponsors que van en un hueco, ya ordenados y listos para dibujar.
 *
 * El orden lo decide `orden` y, a igualdad, el nombre: dos sponsors con el
 * mismo número tienen que salir siempre en la misma posición y no en la que
 * devuelva la base esa vez, o el que paga más no sabe nunca dónde quedó.
 */
export function sponsorsDeHueco(
  sponsors: readonly Sponsor[],
  ubicacion: UbicacionSponsor,
  hoy: string = hoyEnArgentina(),
): Sponsor[] {
  return sponsors
    .filter((sponsor) => sponsor.ubicacion === ubicacion && estaVigente(sponsor, hoy))
    .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es'))
}

/**
 * Cómo se describe la vigencia de un sponsor en el panel.
 *
 * Es la columna que mira quien vendió el espacio, así que dice el estado y no
 * las fechas crudas: "vencido" se entiende de un vistazo y "2026-09-30" hay que
 * compararlo con el calendario mental de cada uno.
 */
export type EstadoSponsor = 'activo' | 'programado' | 'vencido' | 'apagado'

export function estadoDeSponsor(sponsor: Sponsor, hoy: string = hoyEnArgentina()): EstadoSponsor {
  if (!sponsor.activo) return 'apagado'
  if (sponsor.desde > hoy) return 'programado'
  if (sponsor.hasta !== null && sponsor.hasta < hoy) return 'vencido'
  return 'activo'
}

/** Lo que se lee en la pantalla para cada estado. */
export const ETIQUETA_ESTADO_SPONSOR: Record<EstadoSponsor, string> = {
  activo: 'En pantalla',
  programado: 'Programado',
  vencido: 'Vencido',
  apagado: 'Apagado',
}

/** Dónde va cada hueco, dicho para quien carga y no para quien programa. */
export const ETIQUETA_UBICACION: Record<UbicacionSponsor, string> = {
  portada_arriba: 'Portada, arriba de todo',
  portada_entre_notas: 'Portada, entre las crónicas y los análisis',
  nota_lateral: 'Notas, en la columna de la derecha',
}
