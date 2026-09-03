/**
 * Cuánto ocupa un texto en X, que no es lo que devuelve `.length`.
 *
 * X no cuenta caracteres de JavaScript: cuenta **peso**. Cada carácter vale 1 o
 * 2 según en qué rango Unicode caiga, y el máximo son 280. Los rangos livianos
 * son los de `twitter-text` con su configuración por omisión (v3): el latín
 * entero, incluidos los acentos, la eñe, el grado y la raya, pesa 1; todo lo
 * demás —los emoji del copy, entre otras cosas— pesa 2.
 *
 * Y un link pesa 23, siempre, corto o largo: X lo reescribe a `t.co` antes de
 * contarlo. Un `https://periodicodelfos.com/nota/tiburonas-0-1-all-boys-fecha-n11-…`
 * de 90 caracteres ocupa 23, así que medirlo con `.length` deja fuera 67
 * caracteres de bajada que sí entraban.
 *
 * Contar mal en cualquiera de las dos direcciones cuesta caro: de menos, la API
 * rechaza el posteo; de más, se recorta una bajada que entraba entera.
 */

/** El máximo de X. */
export const LARGO_MAXIMO_X = 280

/** Lo que ocupa cualquier URL una vez reescrita a `t.co`. */
export const LARGO_DE_URL = 23

/**
 * Los rangos que pesan 1. Todo lo que no esté acá pesa 2.
 *
 * Salen de la configuración por omisión de `twitter-text`: `[0, 4351]` cubre
 * latín, latín extendido, griego y cirílico; los otros tres son puntuación
 * general (comillas tipográficas, rayas, el apóstrofo curvo).
 */
const RANGOS_LIVIANOS: readonly (readonly [number, number])[] = [
  [0, 4351],
  [8192, 8205],
  [8208, 8223],
  [8242, 8247],
]

function pesoDeCodigo(codigo: number): number {
  return RANGOS_LIVIANOS.some(([desde, hasta]) => codigo >= desde && codigo <= hasta) ? 1 : 2
}

/**
 * El peso de un texto, sin mirar links.
 *
 * Itera por code points y no por unidades UTF-16: un emoji fuera del plano
 * básico son dos unidades en JavaScript y un solo carácter para X.
 */
export function pesoDeTexto(texto: string): number {
  let total = 0
  for (const caracter of texto) {
    total += pesoDeCodigo(caracter.codePointAt(0) ?? 0)
  }
  return total
}

const URL_EN_TEXTO = /https?:\/\/\S+/g

/** El peso de un texto contando cada link como 23. Esto es lo que mide X. */
export function largoEnX(texto: string): number {
  let total = 0
  let desde = 0

  for (const encontrada of texto.matchAll(URL_EN_TEXTO)) {
    total += pesoDeTexto(texto.slice(desde, encontrada.index)) + LARGO_DE_URL
    desde = encontrada.index + encontrada[0].length
  }

  return total + pesoDeTexto(texto.slice(desde))
}

/** Los puntos suspensivos del recorte. Un solo carácter, y pesa 2. */
const ELIPSIS = '…'

/**
 * Recorta un texto para que no pase de un peso, cortando por palabra.
 *
 * Nunca corta a mitad de palabra: es el defecto que tiene hoy el extracto de
 * WordPress y que la migración se pasó un módulo entero detectando. Si no entra
 * ni la primera palabra devuelve `''`, y quien llama decide si vale la pena
 * publicar el bloque sin ese texto.
 */
export function recortarAPeso(texto: string, pesoMaximo: number): string {
  if (pesoMaximo <= 0) return ''
  if (pesoDeTexto(texto) <= pesoMaximo) return texto

  const disponible = pesoMaximo - pesoDeTexto(ELIPSIS)

  let salida = ''
  for (const palabra of texto.split(/\s+/)) {
    const candidata = salida === '' ? palabra : `${salida} ${palabra}`
    if (pesoDeTexto(candidata) > disponible) break
    salida = candidata
  }

  if (salida === '') return ''

  // Sin la coma o el punto que quedaron colgando antes de los puntos
  // suspensivos: "…de Defensa y Justicia,…" se lee como un error de tipeo.
  return `${salida.replace(/[.,;:·–—-]+$/u, '')}${ELIPSIS}`
}
