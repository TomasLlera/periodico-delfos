/**
 * La cola de eventos que todavía no llegaron al servidor.
 *
 * Es lo que el blueprint § 7.6 pide para la planilla y lo que hace que sirva
 * **en una cancha de ascenso**: la tribuna del Minella no tiene señal, y hasta
 * ahora un gol cargado sin datos se perdía con un aviso rojo. Con esto espera
 * en el teléfono y sube solo cuando vuelve la conexión.
 *
 * Acá está la lógica pura —qué se guarda, cómo se ve lo pendiente y cómo se
 * mezcla con lo que ya está en la base—. El IndexedDB de verdad está en
 * `cola-idb.ts`, que no se puede testear en Node, y por eso es lo más chico
 * posible.
 */

import type { EventoNuevo } from '@/actions/eventos'
import type { EventoConJugadora, FormacionConJugadora, Jugadora } from '@/types'

/** Un evento cargado en la planilla que todavía no se confirmó. */
export interface EventoPendiente {
  /** El mismo id con el que se va a insertar: es la clave de idempotencia. */
  id: string
  evento: EventoNuevo
  /** ISO. Para ordenar la cola y para poder decir hace cuánto espera. */
  creado: string
  /** Cuántas veces se intentó subirlo. Se muestra recién cuando preocupa. */
  intentos: number
}

/** Después de esto, lo que falla deja de ser "no hay señal" y hay que mirarlo. */
export const INTENTOS_PARA_PREOCUPARSE = 3

export function pendienteNuevo(evento: EventoNuevo, ahora: Date): EventoPendiente {
  return { id: evento.id, evento, creado: ahora.toISOString(), intentos: 0 }
}

/**
 * Los pendientes en el orden en que se cargaron.
 *
 * Importa para los cambios: `enCancha()` los aplica en orden de minuto, pero
 * dos eventos del mismo minuto —una roja y el cambio que la sigue— tienen que
 * subir como se cargaron.
 */
export function enOrdenDeCarga(
  pendientes: readonly EventoPendiente[],
): EventoPendiente[] {
  return [...pendientes].sort((a, b) => a.creado.localeCompare(b.creado))
}

/**
 * Un pendiente con la forma que dibuja la pantalla.
 *
 * La planilla tiene que **mostrar lo que está en la cola como si ya estuviera
 * cargado**. Si no, el gol que se acaba de tocar no aparece en la lista, y la
 * reacción natural es volver a cargarlo: la cola sin esto empeora el problema
 * que vino a resolver.
 *
 * La jugadora se resuelve contra la formación del partido, que ya está en
 * memoria: pedirla al servidor sería justo lo que no se puede hacer.
 */
export function pendienteComoEvento(
  pendiente: EventoPendiente,
  formaciones: readonly FormacionConJugadora[],
): EventoConJugadora {
  const { evento } = pendiente
  const buscar = (id: string | null): Jugadora | null =>
    id ? (formaciones.find((f) => f.jugadora_id === id)?.jugadora ?? null) : null

  return {
    id: pendiente.id,
    partido_id: evento.partido_id,
    minuto: evento.minuto,
    adicionado: evento.adicionado,
    tipo: evento.tipo,
    equipo_id: evento.equipo_id,
    jugadora_id: evento.jugadora_id,
    jugadora_nombre: evento.jugadora_nombre,
    jugadora_sale_id: evento.jugadora_sale_id,
    jugadora_sale_nombre: null,
    detalle: null,
    jugadora: buscar(evento.jugadora_id),
    jugadora_sale: buscar(evento.jugadora_sale_id),
  }
}

/**
 * Todo lo que hay que mostrar: lo guardado más lo pendiente, sin repetir.
 *
 * El "sin repetir" no es cosmético. Entre que un evento sube y que
 * `router.refresh()` trae la página nueva, el mismo gol está en los dos lados,
 * y mostrarlo dos veces en la lista es exactamente el error que esta pantalla
 * existe para evitar. Como el id es el mismo de los dos lados —lo generó la
 * pantalla—, alcanza con descartar por id.
 */
export function eventosVisibles(
  guardados: readonly EventoConJugadora[],
  pendientes: readonly EventoPendiente[],
  formaciones: readonly FormacionConJugadora[],
): EventoConJugadora[] {
  const yaEstan = new Set(guardados.map((e) => e.id))

  return [
    ...guardados,
    ...pendientes
      .filter((p) => !yaEstan.has(p.id))
      .map((p) => pendienteComoEvento(p, formaciones)),
  ]
}

/** `true` si un pendiente lleva demasiados intentos y conviene decirlo. */
export function preocupa(pendiente: EventoPendiente): boolean {
  return pendiente.intentos >= INTENTOS_PARA_PREOCUPARSE
}

/**
 * Lo que la pantalla le dice a Charlie sobre la cola, en una línea.
 *
 * Tres estados y no dos: sin cola no se dice nada —una barra que anuncia que
 * todo está bien es ruido—, con cola y conexión se está subiendo, y con cola
 * sin conexión se está esperando. El cuarto caso, el que preocupa, es el que
 * necesita que alguien haga algo.
 */
export function estadoDeLaCola(
  pendientes: readonly EventoPendiente[],
  hayConexion: boolean,
): string | null {
  if (pendientes.length === 0) return null

  const cuantos = pendientes.length
  const plural = cuantos > 1 ? 's' : ''

  if (pendientes.some(preocupa)) {
    return `${cuantos} evento${plural} sin subir después de varios intentos. Quedan guardados en el teléfono: no cierres la planilla.`
  }

  return hayConexion
    ? `Subiendo ${cuantos} evento${plural}…`
    : `Sin conexión. ${cuantos} evento${plural} esperando en el teléfono.`
}
