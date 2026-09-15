/**
 * Lógica pura de la página de temporada: qué pestaña se pidió, qué partidos ya
 * se jugaron y las cuentas de la tabla.
 *
 * Sin JSX y sin base, como `partido.ts`: lo que decide qué se muestra se
 * testea solo.
 */

import { resultadoParaAldosivi } from '@/lib/formato'
import type { FilaTabla, PartidoConEquipos } from '@/types'

// ============================================
// Pestañas
// ============================================

/**
 * Las tres vistas de la temporada (blueprint 7.5).
 *
 * **Son links con `?ver=`, no pestañas de JavaScript.** Un `role="tablist"` de
 * verdad necesita manejo de foco con flechas y estado en el cliente, y la
 * página entera es un Server Component. Con la vista en la URL cada pestaña se
 * puede compartir, queda en el historial y anda sin JS; el costo es una
 * navegación por click, que con ISR es un fetch del HTML ya armado.
 */
export const PESTANAS = [
  { clave: 'fixture', titulo: 'Fixture' },
  { clave: 'tabla', titulo: 'Tabla' },
  { clave: 'goleadoras', titulo: 'Goleadoras' },
] as const

export type Pestana = (typeof PESTANAS)[number]['clave']

export const PESTANA_POR_OMISION: Pestana = 'fixture'

/**
 * Qué pestaña pidió la URL. `?ver=` es entrada de usuario: cualquier cosa que
 * no sea una de las tres cae en el fixture en lugar de romper la página.
 */
export function pestanaPedida(valor: string | string[] | undefined): Pestana {
  const crudo = Array.isArray(valor) ? valor[0] : valor
  const encontrada = PESTANAS.find((pestana) => pestana.clave === crudo)
  return encontrada?.clave ?? PESTANA_POR_OMISION
}

// ============================================
// Fixture
// ============================================

/**
 * Si el partido ya se jugó.
 *
 * No alcanza con `estado === 'finalizado'`: un partido suspendido a los 70
 * minutos con el marcador cargado ya se jugó —aunque no entero— y ponerlo
 * entre los que vienen es mentira. El marcador cargado manda sobre el estado.
 */
export function yaSeJugo(partido: PartidoConEquipos): boolean {
  if (partido.estado === 'finalizado' || partido.estado === 'en_curso') return true
  return partido.goles_local !== null && partido.goles_visitante !== null
}

export interface Fixture {
  jugados: PartidoConEquipos[]
  porJugar: PartidoConEquipos[]
}

/**
 * Parte el fixture en dos: lo jugado y lo que viene.
 *
 * Las dos mitades van en orden cronológico ascendente, que es como se lee un
 * fixture —fecha 1 arriba— y no como se lee un listado de notas. El orden no
 * se da por supuesto aunque la query ya ordene: acá entra también la demo.
 */
export function dividirFixture(partidos: readonly PartidoConEquipos[]): Fixture {
  const porFecha = [...partidos].sort(
    (a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime(),
  )

  return {
    jugados: porFecha.filter(yaSeJugo),
    porJugar: porFecha.filter((partido) => !yaSeJugo(partido)),
  }
}

export interface BalanceTemporada {
  jugados: number
  ganados: number
  empatados: number
  perdidos: number
  golesFavor: number
  golesContra: number
}

/**
 * El balance de Aldosivi contado desde los partidos cargados.
 *
 * **No es la tabla de posiciones**: la tabla se carga a mano y cubre el
 * campeonato entero (ver `0004_tabla_posiciones.sql`), y esto cuenta sólo los
 * partidos que el medio tiene cargados. Pueden no coincidir, y por eso se
 * titula "Lo cargado hasta acá" y no "Campaña".
 */
export function balanceAldosivi(
  partidos: readonly PartidoConEquipos[],
): BalanceTemporada {
  const balance: BalanceTemporada = {
    jugados: 0,
    ganados: 0,
    empatados: 0,
    perdidos: 0,
    golesFavor: 0,
    golesContra: 0,
  }

  for (const partido of partidos) {
    const resultado = resultadoParaAldosivi(partido)
    // null es un partido sin resultado, o uno que no es de Aldosivi: ninguno
    // de los dos suma a la campaña.
    if (resultado === null) continue

    const esLocal = partido.equipo_local.es_aldosivi
    balance.jugados += 1
    balance.golesFavor += (esLocal ? partido.goles_local : partido.goles_visitante) ?? 0
    balance.golesContra += (esLocal ? partido.goles_visitante : partido.goles_local) ?? 0

    if (resultado === 'ganado') balance.ganados += 1
    else if (resultado === 'empatado') balance.empatados += 1
    else balance.perdidos += 1
  }

  return balance
}

// ============================================
// Tabla de posiciones
// ============================================

export function diferenciaGol(fila: Pick<FilaTabla, 'goles_favor' | 'goles_contra'>): number {
  return fila.goles_favor - fila.goles_contra
}

/** "+7", "−3", "0". El signo menos es U+2212, no un guion: alinea con los dígitos. */
export function etiquetaDiferencia(diferencia: number): string {
  if (diferencia > 0) return `+${diferencia}`
  if (diferencia < 0) return `\u2212${Math.abs(diferencia)}`
  return '0'
}
