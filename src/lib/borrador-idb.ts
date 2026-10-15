/**
 * El IndexedDB de los borradores del editor. Leer, escribir y borrar.
 *
 * Lo que se decide —qué guardar, cuándo ofrecerlo— está en `borrador.ts`, que
 * tiene test; esto no se puede probar en Node. Abrir la base y sobrevivir a
 * que falle está en `idb.ts`.
 */

import type { Borrador } from '@/lib/borrador'
import { enTransaccion, type Almacen } from '@/lib/idb'

// Uno por nota: guardar de nuevo el de la misma nota lo pisa.
const BORRADORES: Almacen = { base: 'delfos-editor', almacen: 'borradores', clave: 'id' }

/**
 * Guarda o pisa el borrador. `true` si quedó escrito.
 *
 * **Si no entra con la foto, se guarda sin ella.** Un archivo de 8 MB contra
 * un disco casi lleno, o un navegador que no deja guardar archivos en
 * IndexedDB, no pueden costar el texto: la foto se vuelve a elegir en un
 * segundo, la crónica no.
 */
export async function guardarBorrador(borrador: Borrador): Promise<boolean> {
  const escribir = (b: Borrador) =>
    enTransaccion(BORRADORES, 'readwrite', (almacen) => almacen.put(b))

  if ((await escribir(borrador)) !== null) return true
  if (!borrador.archivo) return false
  return (await escribir({ ...borrador, archivo: null })) !== null
}

export async function leerBorrador(id: string): Promise<Borrador | null> {
  return (await enTransaccion<Borrador | undefined>(BORRADORES, 'readonly', (a) => a.get(id))) ?? null
}

export async function leerBorradores(): Promise<Borrador[]> {
  return (await enTransaccion<Borrador[]>(BORRADORES, 'readonly', (a) => a.getAll())) ?? []
}

export async function borrarBorrador(id: string): Promise<void> {
  await enTransaccion(BORRADORES, 'readwrite', (almacen) => almacen.delete(id))
}
