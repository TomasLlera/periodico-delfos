/**
 * El borrador local del editor de notas: lo que se escribió y todavía no
 * confirmó el servidor.
 *
 * Existe porque **un corte de señal al guardar borraba la nota entera**. El
 * action tiraba, el formulario no lo atajaba y la pantalla quedaba en el error
 * genérico de Next; lo escrito se perdía con ella. Se probó con Playwright
 * cortando la red: pasaba igual si el servidor no recibió nada que si guardó y
 * sólo se perdió la respuesta.
 *
 * Es la misma idea que la cola de la planilla (`cola.ts`): **primero al
 * dispositivo y después al servidor**. Acá está lo que se decide sin tocar
 * IndexedDB, que es lo que se puede probar; la escritura está en
 * `borrador-idb.ts` y el estado de React en `usarBorrador.ts`.
 */

import type { EntradaNota } from '@/lib/nota'

export interface Borrador {
  /** El id de la nota. El mismo con el que se va a crear: ver `escribirNota()`. */
  id: string
  /** `true` si la nota todavía no existía al empezar a escribirlo. */
  nueva: boolean
  entrada: EntradaNota
  /** La foto elegida y sin subir. IndexedDB guarda archivos tal cual. */
  archivo: File | null
  /** ISO. Para decir hace cuánto y para compararlo con la versión guardada. */
  guardado: string
}

/**
 * Lo que quedó sin confirmar cuando se cortó la señal.
 *
 * Se distinguen porque **no se reanudan igual**: guardar un borrador se
 * reintenta solo al volver la conexión, pero publicar dispara el posteo a las
 * redes, que no tiene vuelta atrás, y no puede pasar sin que nadie lo mire —
 * quizás diez minutos después, con el teléfono en el bolsillo—.
 */
export type Pendiente =
  | { tipo: 'guardar' }
  | { tipo: 'publicar'; publicadaEn: string | null }
  | { tipo: 'programar'; publicarEn: string }

/**
 * JSON con las claves ordenadas.
 *
 * El cuerpo vuelve de la base como `jsonb`, que **reordena las claves**: el
 * mismo documento de TipTap no da el mismo `JSON.stringify` antes y después de
 * guardarlo, y sin esto todo borrador parecería distinto de la nota.
 */
function canonico(valor: unknown): string {
  return JSON.stringify(valor, (_clave, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  )
}

export function mismoContenido(a: EntradaNota, b: EntradaNota): boolean {
  return canonico(a) === canonico(b)
}

/**
 * Si vale la pena guardar un borrador.
 *
 * Abrir una nota y mirarla no tiene que dejar nada en el dispositivo: si lo
 * hiciera, cada nota abierta ofrecería después "recuperar" un borrador que es
 * idéntico a lo guardado.
 */
export function hayAlgoSinGuardar(
  entrada: EntradaNota,
  guardada: EntradaNota,
  archivo: File | null,
): boolean {
  return archivo !== null || !mismoContenido(entrada, guardada)
}

/**
 * Si el borrador tiene algo que la versión guardada no.
 *
 * Uno idéntico es el rastro de un guardado que salió bien pero cuya respuesta
 * se perdió: no hay nada que recuperar y se borra sin preguntar.
 */
export function hayQueOfrecer(borrador: Borrador | null, guardada: EntradaNota): boolean {
  return borrador !== null && hayAlgoSinGuardar(borrador.entrada, guardada, borrador.archivo)
}

/**
 * Si la nota se guardó en el servidor **después** de este borrador.
 *
 * Pasa si se siguió editando desde otro dispositivo. Recuperar el borrador
 * pisaría esos cambios, y eso hay que decirlo antes de que se apriete el botón.
 */
export function quedoViejo(borrador: Borrador, actualizadaEn: string | null): boolean {
  return actualizadaEn !== null && Date.parse(actualizadaEn) > Date.parse(borrador.guardado)
}

/** El borrador de nota nueva más reciente, si quedó alguno sin crear. */
export function ultimoDeNotaNueva(borradores: readonly Borrador[]): Borrador | null {
  const nuevos = borradores.filter((b) => b.nueva)
  nuevos.sort((a, b) => b.guardado.localeCompare(a.guardado))
  return nuevos[0] ?? null
}

/** "hace 12 minutos". Gruesa a propósito: alcanza para reconocer el borrador. */
export function haceCuanto(desde: string, ahora: Date): string {
  const minutos = Math.floor((ahora.getTime() - Date.parse(desde)) / 60_000)

  if (minutos < 1) return 'recién'
  if (minutos < 60) return minutos === 1 ? 'hace 1 minuto' : `hace ${minutos} minutos`

  const horas = Math.floor(minutos / 60)
  if (horas < 24) return horas === 1 ? 'hace 1 hora' : `hace ${horas} horas`

  const dias = Math.floor(horas / 24)
  return dias === 1 ? 'hace 1 día' : `hace ${dias} días`
}

const VERBO: Record<Pendiente['tipo'], { participio: string; infinitivo: string }> = {
  guardar: { participio: 'guardado', infinitivo: 'guardar' },
  publicar: { participio: 'publicado', infinitivo: 'publicar' },
  programar: { participio: 'programado', infinitivo: 'programar' },
}

/**
 * El aviso cuando el envío no tuvo respuesta.
 *
 * **"No pudimos confirmar", no "no se guardó".** Sin respuesta no hay forma de
 * saber si el pedido llegó: el corte pudo ser a la ida o a la vuelta. Decir
 * que no se guardó cuando sí se guardó lleva a reescribir la nota.
 *
 * `respaldado` es si el borrador quedó en el dispositivo. Si no —modo privado,
 * almacenamiento bloqueado—, la única copia es la pestaña abierta, y eso es lo
 * que hay que decir.
 */
export function avisoSinRed(pendiente: Pendiente, respaldado: boolean): string {
  const { participio } = VERBO[pendiente.tipo]
  const inicio = `Sin conexión: no pudimos confirmar que la nota se haya ${participio}.`

  if (!respaldado) return `${inicio} No cierres esta pestaña hasta que vuelva la señal.`

  return pendiente.tipo === 'guardar'
    ? `${inicio} El texto quedó a salvo en este dispositivo y se va a guardar solo cuando vuelva la señal.`
    : `${inicio} El texto quedó a salvo en este dispositivo. Cuando vuelva la señal te vamos a preguntar si ${VERBO[pendiente.tipo].infinitivo}la.`
}

/** El botón que reanuda lo que quedó a medias. */
export function botonParaReanudar(pendiente: Pendiente): string {
  return pendiente.tipo === 'programar' ? 'Programar ahora' : pendiente.tipo === 'publicar' ? 'Publicar ahora' : 'Guardar ahora'
}
