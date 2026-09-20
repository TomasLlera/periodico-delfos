/**
 * Las piezas que comparten los seis formularios del CRUD de entidades.
 *
 * Existen porque equipos, temporadas, jugadoras, partidos, plantel y tabla
 * validan las mismas cuatro formas —un texto obligatorio, uno opcional, un
 * entero acotado y un slug— y escribirlas seis veces garantiza que la séptima
 * salga distinta. Sin React y sin Supabase: se testean solas.
 */

import { z } from 'zod'

// ============================================
// Slug
// ============================================

/**
 * El slug de cualquier entidad, con el mismo criterio que usa WordPress y que
 * ya usaba `slugDesdeTitulo()` para las notas: sin diacríticos, minúsculas y
 * guiones.
 *
 * Vive acá y no en `nota.ts` porque ahora lo necesitan seis formularios, y el
 * criterio tiene que ser **uno**: la migración desde WordPress depende de que
 * las URLs se armen igual que antes (regla no negociable 8), y dos funciones
 * parecidas terminan divergiendo en el primer caso raro.
 */
export function slugificar(texto: string): string {
  return texto
    .normalize('NFD')
    // Saca los diacríticos que `NFD` acaba de separar: "crónica" → "cronica".
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    // La ñ sobrevive a `NFD` como "n" + tilde, así que ya quedó en "n". Lo que
    // queda por barrer es todo lo que no sea letra, número o espacio.
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/[\s-]+/g, '-')
}

// ============================================
// Campos de Zod
// ============================================

export const textoRequerido = (campo: string) =>
  z
    .string()
    .trim()
    .min(1, `${campo} no puede quedar vacío`)

/** Un campo de texto opcional: la cadena vacía del formulario entra como `null`. */
export const textoOpcional = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable()

/**
 * Un entero opcional, tal como sale de un `<input type="number">`.
 *
 * El input devuelve `''` cuando está vacío y no `null`, así que el formulario
 * guarda `number | null` y esto acepta los dos. El rango se pide explícito
 * —dorsal 1–99, minuto 0–130— porque un entero sin techo en una planilla es un
 * error de tipeo esperando: el 900 que sale de apoyar la mano en el teclado
 * tiene que morir en el formulario y no en un CHECK de Postgres.
 */
export const enteroOpcional = (campo: string, min: number, max: number) =>
  z
    .number()
    .int(`${campo} tiene que ser un número entero`)
    .min(min, `${campo} no puede ser menor que ${min}`)
    .max(max, `${campo} no puede ser mayor que ${max}`)
    .nullable()

export const enteroRequerido = (campo: string, min: number, max: number) =>
  z
    .number(`${campo} es obligatorio`)
    .int(`${campo} tiene que ser un número entero`)
    .min(min, `${campo} no puede ser menor que ${min}`)
    .max(max, `${campo} no puede ser mayor que ${max}`)

/** Lo que devuelve un `<input type="date">` vacío también es `''`. */
export const fechaOpcional = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), 'La fecha no es válida')
  .transform((v) => (v === '' ? null : v))
  .nullable()

// ============================================
// Fecha y hora del partido
// ============================================

/**
 * El huso de Mar del Plata, fijo.
 *
 * `partidos.fecha_hora` es `timestamptz` y el formulario usa un
 * `datetime-local`, que no tiene huso: hay que elegir uno para traducir entre
 * los dos. **Se elige el de Argentina escrito a mano y no el del navegador.**
 *
 * Por dos razones. La primera es que el formulario es un Client Component y su
 * estado inicial se calcula **también en el servidor**, donde Vercel corre en
 * UTC: convertir con el reloj de la máquina daría un valor en el HTML y otro
 * al hidratar, y el partido de las 15:30 aparecería a las 18:30 por un
 * instante. La segunda es que el dato es un partido en Mar del Plata: la hora
 * que se carga es la del estadio, la cargue quien la cargue y desde donde sea.
 *
 * Argentina no aplica horario de verano desde 2009, así que el offset alcanza
 * y no hace falta una base de husos.
 */
export const HUSO_ARGENTINA = '-03:00'
const TRES_HORAS_MS = 3 * 60 * 60 * 1000

/** ISO de la base → "2026-08-02T15:30", lo que espera un `datetime-local`. */
export function isoALocal(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return ''

  // Se corre el instante y se lee en UTC: así el cálculo no toca el reloj de
  // la máquina y da lo mismo en el servidor que en el navegador.
  return new Date(fecha.getTime() - TRES_HORAS_MS).toISOString().slice(0, 16)
}

/** "2026-08-02T15:30" del formulario → ISO en UTC para la base. */
export function localAIso(local: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(local)) return null

  const fecha = new Date(`${local.slice(0, 16)}:00${HUSO_ARGENTINA}`)
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString()
}

// ============================================
// Resultado de un Server Action
// ============================================

/**
 * Lo que devuelve cualquier action del CRUD.
 *
 * Es la misma forma que ya devolvía `guardarNota()`: un `id` cuando salió
 * bien, un `error` en español cuando no, y `motivos` para los casos en que
 * falta más de una cosa y decirlas de a una obligaría a adivinar de a un
 * intento por vez.
 */
export interface ResultadoEntidad {
  id?: string
  error?: string
  motivos?: string[]
}

/**
 * Traduce el error de Postgres a una frase.
 *
 * El caso que pasa de verdad es el `23505`: el slug repetido, el dorsal que ya
 * tiene otra jugadora, la segunda temporada marcada como activa. Decirlo con
 * el nombre del campo evita que parezca una falla del sistema cuando es un
 * dato que hay que corregir.
 */
export function errorDeBase(
  error: { code?: string; message?: string },
  repetido: string,
): string {
  if (error.code === '23505') return repetido
  // 23514 es un CHECK y 23503 una foreign key: el dato es inconsistente, no
  // duplicado.
  if (error.code === '23514') return 'Los datos no cierran: revisá los números'
  if (error.code === '23503') return 'Falta algo a lo que esto hace referencia'
  return 'No se pudo guardar'
}
