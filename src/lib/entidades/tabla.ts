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

/**
 * Las fechas que ya se jugaron y todavía no tienen tabla cargada.
 *
 * Es el recordatorio de que la tabla de posiciones **no se calcula sola**
 * (§ 4.4). Cargar el resultado de un partido actualiza las goleadoras, la ficha
 * de la jugadora y la portada, pero no mueve a los otros diez equipos del
 * campeonato: eso hay que copiarlo a mano, y es justo el paso que se olvida
 * porque todo lo demás pasó solo.
 *
 * **Se deriva del dato, no de una marca.** No hay ningún campo "ya avisé": la
 * fecha aparece mientras el partido esté finalizado y la tabla no tenga esa
 * fecha, y desaparece sola al cargarla. Un aviso que se cierra a mano se cierra
 * sin querer y no vuelve nunca.
 *
 * Un partido sin número de fecha —un amistoso— no entra: no tiene una fila de
 * tabla que le corresponda.
 */
export function fechasSinTabla(
  partidos: readonly { fecha_numero: number | null; estado: string }[],
  fechasCargadas: readonly number[],
): number[] {
  const cargadas = new Set(fechasCargadas)

  const pendientes = new Set(
    partidos
      .filter((p) => p.estado === 'finalizado' && p.fecha_numero !== null)
      .map((p) => p.fecha_numero as number)
      .filter((fecha) => !cargadas.has(fecha)),
  )

  return [...pendientes].sort((a, b) => a - b)
}

/**
 * La fecha cargada inmediatamente anterior a la que se está editando.
 *
 * Es contra la que se precarga el formulario, y es **la anterior cargada, no
 * `fecha - 1`**: si la fecha 7 nunca se cargó, la 8 se precarga con la 6. Con
 * `fecha - 1` la pantalla abriría vacía justo cuando hay un hueco, que es
 * cuando más conviene tener de dónde copiar.
 */
export function fechaAnteriorCargada(
  cargadas: readonly number[],
  fecha: number,
): number | null {
  const previas = cargadas.filter((cargada) => cargada < fecha)
  return previas.length > 0 ? Math.max(...previas) : null
}

/**
 * De dónde salieron las filas que muestra el formulario. Lo dice la pantalla:
 * editar lo que ya estaba guardado y editar una copia de la fecha anterior se
 * parecen demasiado como para no avisar cuál de las dos es.
 */
export type OrigenDePrecarga = 'guardada' | 'fecha-anterior' | 'equipos' | 'vacia'

export interface Precarga {
  filas: EntradaFilaTabla[]
  origen: OrigenDePrecarga
  /** De qué fecha se copió, cuando el origen es `fecha-anterior`. */
  copiadaDe: number | null
}

/**
 * Con qué filas abre el formulario de una fecha.
 *
 * **Una fecha nueva se precarga con la tabla de la fecha anterior**, porque es
 * lo que pasa de verdad: entre dos fechas se mueven tres o cuatro equipos y el
 * resto repite los mismos nueve números. Cargar once filas desde cero todas las
 * semanas es escribir a mano cien números que ya estaban escritos, y cada uno
 * es una oportunidad de tipear mal.
 *
 * **Lo guardado manda sobre la copia.** Si la fecha ya tiene tabla —se está
 * corrigiendo una fecha pasada— se abre con lo suyo y no con la anterior:
 * pisarlo con una copia sería perder la corrección que alguien vino a hacer.
 * Y como `guardarTabla()` reemplaza sólo `(temporada_id, fecha_numero)`,
 * editar una fecha vieja no toca las otras.
 *
 * **Sin fecha anterior se precarga con los equipos en cero**, en orden
 * alfabético. El orden importa menos que el hecho de que estén: así la primera
 * carga de la temporada es elegir puestos y tipear resultados, no agregar once
 * filas de a una. Alfabético y no el de `getEquipos()` —que pone a Aldosivi
 * primero— para no dejar al club en el puesto 1 de una tabla que nadie cargó
 * todavía.
 */
export function precargaDeLaFecha({
  temporadaId,
  fechaNumero,
  guardadas,
  anteriores,
  equipos,
}: {
  temporadaId: string
  fechaNumero: number
  guardadas: readonly EntradaFilaTabla[]
  anteriores: readonly EntradaFilaTabla[]
  equipos: readonly { id: string; nombre_corto: string }[]
}): Precarga {
  if (guardadas.length > 0) {
    return { filas: [...guardadas], origen: 'guardada', copiadaDe: null }
  }

  if (anteriores.length > 0) {
    return {
      filas: anteriores.map((fila) => ({ ...fila, fecha_numero: fechaNumero })),
      origen: 'fecha-anterior',
      copiadaDe: anteriores[0].fecha_numero,
    }
  }

  if (equipos.length > 0) {
    const alfabetico = [...equipos].sort((a, b) =>
      a.nombre_corto.localeCompare(b.nombre_corto, 'es'),
    )

    return {
      filas: alfabetico.map((equipo, indice) => ({
        ...filaEnBlanco(temporadaId, fechaNumero, indice + 1),
        equipo_id: equipo.id,
      })),
      origen: 'equipos',
      copiadaDe: null,
    }
  }

  return { filas: [], origen: 'vacia', copiadaDe: null }
}
