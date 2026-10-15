/**
 * Lo común a los dos IndexedDB del panel: abrir y correr una transacción.
 *
 * Lo usan la cola de la planilla (`cola-idb.ts`) y los borradores del editor
 * (`borrador-idb.ts`). Cada uno tiene **su propia base** y no un almacén más
 * en una compartida: agregar un almacén obliga a subir la versión, y una
 * pestaña vieja abierta con la versión anterior bloquea la actualización —
 * justo con el partido en juego—.
 *
 * **Todo puede fallar y nada puede romper la pantalla.** El modo privado de
 * Safari, un navegador con el almacenamiento bloqueado o un disco lleno hacen
 * que `open()` falle. En ese caso todo devuelve `null` y quien llama sigue
 * como si no hubiera nada guardado: es peor, pero no es estar roto.
 *
 * No se puede probar con vitest —no hay IndexedDB en Node—, así que esto es lo
 * más chico posible y lo que se decide va en los módulos puros.
 */

export interface Almacen {
  base: string
  almacen: string
  /** El campo que identifica cada registro. Guardar dos veces el mismo, pisa. */
  clave: string
}

function abrir({ base, almacen, clave }: Almacen): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    // En el servidor no hay `indexedDB`, y estos módulos los importan
    // componentes que igual se renderizan del lado del servidor.
    if (typeof indexedDB === 'undefined') {
      resolve(null)
      return
    }

    let pedido: IDBOpenDBRequest
    try {
      pedido = indexedDB.open(base, 1)
    } catch {
      resolve(null)
      return
    }

    pedido.onupgradeneeded = () => {
      const db = pedido.result
      if (!db.objectStoreNames.contains(almacen)) {
        db.createObjectStore(almacen, { keyPath: clave })
      }
    }

    pedido.onsuccess = () => resolve(pedido.result)
    pedido.onerror = () => resolve(null)
    pedido.onblocked = () => resolve(null)
  })
}

/**
 * Corre un pedido y devuelve su resultado, o `null` si algo falló.
 *
 * `null` también es lo que devuelve un `put` que no se pudo escribir: quien
 * necesita saber si quedó guardado mira eso.
 */
export function enTransaccion<T>(
  donde: Almacen,
  modo: IDBTransactionMode,
  trabajo: (almacen: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> {
  return abrir(donde).then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) {
          resolve(null)
          return
        }

        try {
          const tx = db.transaction(donde.almacen, modo)
          const pedido = trabajo(tx.objectStore(donde.almacen))
          pedido.onsuccess = () => resolve(pedido.result)
          pedido.onerror = () => resolve(null)
          tx.oncomplete = () => db.close()
          tx.onabort = () => {
            db.close()
            resolve(null)
          }
        } catch {
          db.close()
          resolve(null)
        }
      }),
  )
}
