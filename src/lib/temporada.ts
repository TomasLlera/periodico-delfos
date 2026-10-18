/**
 * Lógica pura de la página de temporada: qué pestaña se pidió, qué partidos ya
 * se jugaron y las cuentas de la tabla.
 *
 * Sin JSX y sin base, como `partido.ts`: lo que decide qué se muestra se
 * testea solo.
 */

import { resultadoParaAldosivi } from '@/lib/formato'
import type { FilaTabla, FilaTablaConEquipo, PartidoConEquipos } from '@/types'

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

export interface EstadoTemporada {
  ultimo: PartidoConEquipos | null
  proximo: PartidoConEquipos | null
}

/**
 * El último partido jugado y el que viene: los dos datos de `<BarraEstado />`.
 *
 * **"Próximo" es el primero sin jugar, no el primero posterior a hoy.** Sale de
 * la misma división que el fixture (`dividirFixture`), así que la barra y la
 * página de temporada no se pueden contradecir. Un partido con la fecha pasada
 * y sin resultado cargado aparece como próximo: es exactamente la señal de que
 * falta cargarlo, y esconderlo detrás de un filtro por fecha la taparía.
 */
export function estadoTemporada(
  partidos: readonly PartidoConEquipos[],
): EstadoTemporada {
  const { jugados, porJugar } = dividirFixture(partidos)

  return {
    ultimo: jugados[jugados.length - 1] ?? null,
    proximo: porJugar[0] ?? null,
  }
}

/**
 * Los partidos que entran en la franja `<FechaAFecha />` de la portada: los
 * últimos jugados y los que vienen, en orden cronológico.
 *
 * **La franja no muestra la temporada entera.** Con catorce fechas, una tira
 * que empieza en la 1 deja el próximo partido fuera de la pantalla, y sin
 * JavaScript no hay forma de arrancarla scrolleada. La ventana la deja
 * terminando donde está la temporada hoy; el fixture completo está a un link.
 */
export function ventanaFechaAFecha(
  partidos: readonly PartidoConEquipos[],
  { jugados = 5, porJugar = 2 }: { jugados?: number; porJugar?: number } = {},
): PartidoConEquipos[] {
  const fixture = dividirFixture(partidos)

  return [
    ...fixture.jugados.slice(-jugados),
    ...fixture.porJugar.slice(0, porJugar),
  ]
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
 * partidos que el medio tiene cargados. Pueden no coincidir, y la salvedad va
 * escrita al pie del bloque que dibuja estos números (`<Balance />`, en
 * `FixtureTemporada.tsx`).
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

/**
 * La fila de Aldosivi en la tabla, que es la única que mira la barra de estado.
 *
 * Se busca por `es_aldosivi` y no por la posición: la tabla se carga a mano y
 * puede venir incompleta, así que el club no está en un índice fijo.
 */
export function filaDeAldosivi(
  filas: readonly FilaTablaConEquipo[],
): FilaTablaConEquipo | null {
  return filas.find((fila) => fila.equipo.es_aldosivi) ?? null
}

export function diferenciaGol(fila: Pick<FilaTabla, 'goles_favor' | 'goles_contra'>): number {
  return fila.goles_favor - fila.goles_contra
}

/** "+7", "−3", "0". El signo menos es U+2212, no un guion: alinea con los dígitos. */
export function etiquetaDiferencia(diferencia: number): string {
  if (diferencia > 0) return `+${diferencia}`
  if (diferencia < 0) return `\u2212${Math.abs(diferencia)}`
  return '0'
}

// ============================================
// La tabla, fecha por fecha
// ============================================

/** Las once filas de una fecha, ya ordenadas por puesto. */
export interface TablaDeFecha {
  fecha: number
  filas: FilaTablaConEquipo[]
}

/**
 * Parte las filas de la temporada entera en una tabla por fecha.
 *
 * **Existe para que el selector de fecha no vuelva al servidor.** La página de
 * temporada trae todas las filas en una consulta —son once por fecha, catorce
 * fechas: menos de lo que pesa una foto— y el cliente cambia de fecha sin
 * navegar. La alternativa era leer `?fecha=` en el servidor, y eso saca a la
 * página del prerender.
 *
 * Las fechas salen de la más vieja a la más nueva, que es el orden en que el
 * selector las ofrece y el que necesita la comparación con la fecha anterior.
 * El orden no se da por supuesto aunque la query ya ordene: acá entra la demo.
 */
export function agruparTablaPorFecha(
  filas: readonly FilaTablaConEquipo[],
): TablaDeFecha[] {
  const porFecha = new Map<number, FilaTablaConEquipo[]>()

  for (const fila of filas) {
    const deLaFecha = porFecha.get(fila.fecha_numero)
    if (deLaFecha) deLaFecha.push(fila)
    else porFecha.set(fila.fecha_numero, [fila])
  }

  return [...porFecha.entries()]
    .sort(([una], [otra]) => una - otra)
    .map(([fecha, deLaFecha]) => ({
      fecha,
      filas: [...deLaFecha].sort((a, b) => a.posicion - b.posicion),
    }))
}

/** Las fechas que el selector puede ofrecer: las que tienen tabla cargada. */
export function fechasDisponibles(tablas: readonly TablaDeFecha[]): number[] {
  return tablas.map((tabla) => tabla.fecha)
}

/**
 * Qué fecha pide la URL, de las que existen.
 *
 * `?fecha=` es entrada de usuario y además puede quedar vieja —un link
 * compartido a la fecha 3 de una temporada que se recargó entera—, así que
 * cualquier cosa que no sea una fecha cargada cae en la última en lugar de
 * dejar la pantalla sin tabla.
 */
export function fechaPedidaDeTabla(
  valor: string | null | undefined,
  fechas: readonly number[],
): number | null {
  const ultima = fechas.length > 0 ? fechas[fechas.length - 1] : null

  if (valor === null || valor === undefined || valor.trim() === '') return ultima

  const pedida = Number(valor)
  if (!Number.isInteger(pedida)) return ultima

  return fechas.includes(pedida) ? pedida : ultima
}

export function tablaDeLaFecha(
  tablas: readonly TablaDeFecha[],
  fecha: number | null,
): TablaDeFecha | null {
  if (fecha === null) return null
  return tablas.find((tabla) => tabla.fecha === fecha) ?? null
}

/**
 * La fecha cargada inmediatamente anterior, que es contra la que se compara.
 *
 * **Es la anterior cargada, no `fecha - 1`.** Si la fecha 7 no se cargó nunca,
 * la 8 se compara con la 6: comparar contra una fecha vacía daría "subió once
 * puestos" para los once equipos.
 */
export function tablaPrevia(
  tablas: readonly TablaDeFecha[],
  fecha: number,
): TablaDeFecha | null {
  const previas = tablas.filter((tabla) => tabla.fecha < fecha)
  return previas[previas.length - 1] ?? null
}

export type Movimiento = 'subio' | 'bajo' | 'mantuvo'

export interface CambioDePuesto {
  movimiento: Movimiento
  /** Cuántos puestos, siempre positivo. El sentido lo dice `movimiento`. */
  puestos: number
}

/**
 * Qué hizo cada equipo respecto de la fecha anterior, por `equipo_id`.
 *
 * **Sin fecha anterior el mapa vuelve vacío**, y la tabla no dibuja ningún
 * indicador: en la primera fecha cargada nadie subió ni bajó, y poner "mantuvo"
 * once veces es afirmar algo que no se sabe.
 *
 * Un equipo que no estaba en la fecha anterior tampoco tiene indicador. Pasa de
 * verdad: la tabla se carga a mano y una fecha puede haberse cargado con diez
 * de los once equipos.
 */
export function cambiosDePuesto(
  actual: readonly Pick<FilaTabla, 'equipo_id' | 'posicion'>[],
  anterior: readonly Pick<FilaTabla, 'equipo_id' | 'posicion'>[] | null,
): Map<string, CambioDePuesto> {
  const cambios = new Map<string, CambioDePuesto>()
  if (anterior === null) return cambios

  const antes = new Map(anterior.map((fila) => [fila.equipo_id, fila.posicion]))

  for (const fila of actual) {
    const puestoAnterior = antes.get(fila.equipo_id)
    if (puestoAnterior === undefined) continue

    // Subir es bajar de número: del 8 al 5 son tres puestos para arriba.
    const diferencia = puestoAnterior - fila.posicion

    cambios.set(fila.equipo_id, {
      movimiento: diferencia > 0 ? 'subio' : diferencia < 0 ? 'bajo' : 'mantuvo',
      puestos: Math.abs(diferencia),
    })
  }

  return cambios
}

/**
 * El indicador en palabras: lo que lee quien no ve la flecha.
 *
 * El color y la flecha no alcanzan —el rojo y el verde son el mismo gris en
 * escala de grises, y una flecha sin texto es un carácter que el lector de
 * pantalla puede leer como "triángulo negro hacia arriba"—, así que cada
 * indicador lleva esta frase en un `sr-only`.
 */
export function textoDeCambio(cambio: CambioDePuesto): string {
  if (cambio.movimiento === 'mantuvo') return 'Mantiene el puesto'

  const verbo = cambio.movimiento === 'subio' ? 'Subió' : 'Bajó'
  return `${verbo} ${cambio.puestos} ${cambio.puestos === 1 ? 'puesto' : 'puestos'}`
}
