/**
 * El IndexedDB de la cola. Nada más que leer, escribir y borrar.
 *
 * Es lo más chico posible **a propósito**: no se puede probar con vitest —no
 * hay IndexedDB en Node— así que todo lo que se pueda decidir sin tocarlo vive
 * en `cola.ts`, que sí tiene test. Abrir la base y sobrevivir a que falle está
 * en `idb.ts`, compartido con los borradores del editor.
 *
 * **Por qué IndexedDB y no `localStorage`.** `localStorage` es síncrono y
 * bloquea el hilo principal: escribir ahí en el momento de tocar una jugadora
 * es un tirón justo en el gesto que hay que hacer treinta veces en tres
 * minutos. Y es lo que pide el blueprint § 7.6.
 *
 * Si el almacenamiento no anda, la cola se comporta como si estuviera vacía:
 * la planilla sigue funcionando como antes de que esto existiera —guardando
 * contra el servidor y avisando cuando falla—, que es peor pero no es estar
 * rota.
 */

import type { EventoPendiente } from '@/lib/cola'
import { enTransaccion, type Almacen } from '@/lib/idb'

// La clave es el id del evento, que es el mismo con el que se va a insertar:
// guardar dos veces el mismo pendiente lo pisa en vez de duplicarlo.
const COLA: Almacen = { base: 'delfos-planilla', almacen: 'pendientes', clave: 'id' }

/** Guarda o pisa un pendiente. */
export async function guardarPendiente(pendiente: EventoPendiente): Promise<void> {
  await enTransaccion(COLA, 'readwrite', (almacen) => almacen.put(pendiente))
}

/**
 * Todos los pendientes, de todos los partidos.
 *
 * Sin filtrar por partido a propósito: si quedó algo sin subir de la fecha
 * pasada, la planilla de hoy lo encuentra y lo sube. Quien lo filtra para
 * mostrarlo es el hook.
 */
export async function leerPendientes(): Promise<EventoPendiente[]> {
  const todos = await enTransaccion<EventoPendiente[]>(COLA, 'readonly', (almacen) =>
    almacen.getAll(),
  )
  return todos ?? []
}

export async function borrarPendiente(id: string): Promise<void> {
  await enTransaccion(COLA, 'readwrite', (almacen) => almacen.delete(id))
}
