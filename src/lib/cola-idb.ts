/**
 * El IndexedDB de la cola. Nada más que abrir, leer, escribir y borrar.
 *
 * Es lo más chico posible **a propósito**: es el único archivo del proyecto que
 * no se puede probar con vitest —no hay IndexedDB en Node— así que todo lo que
 * se pueda decidir sin tocarlo vive en `cola.ts`, que sí tiene test.
 *
 * **Por qué IndexedDB y no `localStorage`.** `localStorage` es síncrono y
 * bloquea el hilo principal: escribir ahí en el momento de tocar una jugadora
 * es un tirón justo en el gesto que hay que hacer treinta veces en tres
 * minutos. Y es lo que pide el blueprint § 7.6.
 *
 * **Todo puede fallar y nada puede romper la planilla.** El modo privado de
 * Safari, un navegador con el almacenamiento bloqueado o un disco lleno hacen
 * que `open()` falle. En ese caso la cola se comporta como si estuviera vacía:
 * la planilla sigue funcionando como antes de que esto existiera —guardando
 * contra el servidor y avisando cuando falla—, que es peor pero no es estar
 * rota.
 */

import type { EventoPendiente } from '@/lib/cola'

const BASE = 'delfos-planilla'
const ALMACEN = 'pendientes'
const VERSION = 1

function abrir(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    // En el servidor no hay `indexedDB`, y este módulo lo importa un componente
    // que igual se renderiza del lado del servidor.
    if (typeof indexedDB === 'undefined') {
      resolve(null)
      return
    }

    let pedido: IDBOpenDBRequest
    try {
      pedido = indexedDB.open(BASE, VERSION)
    } catch {
      resolve(null)
      return
    }

    pedido.onupgradeneeded = () => {
      const db = pedido.result
      if (!db.objectStoreNames.contains(ALMACEN)) {
        // La clave es el id del evento, que es el mismo con el que se va a
        // insertar: guardar dos veces el mismo pendiente lo pisa en vez de
        // duplicarlo.
        db.createObjectStore(ALMACEN, { keyPath: 'id' })
      }
    }

    pedido.onsuccess = () => resolve(pedido.result)
    pedido.onerror = () => resolve(null)
    pedido.onblocked = () => resolve(null)
  })
}

function enTransaccion<T>(
  modo: IDBTransactionMode,
  trabajo: (almacen: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> {
  return abrir().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) {
          resolve(null)
          return
        }

        try {
          const tx = db.transaction(ALMACEN, modo)
          const pedido = trabajo(tx.objectStore(ALMACEN))
          pedido.onsuccess = () => resolve(pedido.result)
          pedido.onerror = () => resolve(null)
          tx.oncomplete = () => db.close()
        } catch {
          resolve(null)
        }
      }),
  )
}

/** Guarda o pisa un pendiente. */
export async function guardarPendiente(pendiente: EventoPendiente): Promise<void> {
  await enTransaccion('readwrite', (almacen) => almacen.put(pendiente))
}

/**
 * Todos los pendientes, de todos los partidos.
 *
 * Sin filtrar por partido a propósito: si quedó algo sin subir de la fecha
 * pasada, la planilla de hoy lo encuentra y lo sube. Quien lo filtra para
 * mostrarlo es el hook.
 */
export async function leerPendientes(): Promise<EventoPendiente[]> {
  const todos = await enTransaccion<EventoPendiente[]>('readonly', (almacen) =>
    almacen.getAll(),
  )
  return todos ?? []
}

export async function borrarPendiente(id: string): Promise<void> {
  await enTransaccion('readwrite', (almacen) => almacen.delete(id))
}
