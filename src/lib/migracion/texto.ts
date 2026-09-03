/**
 * Decodificación de entidades y limpieza de texto suelto de WordPress.
 *
 * El cuerpo de la nota no pasa por acá: lo parsea `generateJSON()`, que ya
 * decodifica todo con un DOM de verdad. Esto es para el título y el extracto,
 * que llegan como strings y no como HTML de bloque.
 *
 * WordPress deja los acentos en UTF-8 y entidiza sólo la puntuación tipográfica
 * (`&#8211;` para la raya, `&#8217;` para el apóstrofo) más las cinco de XML,
 * así que un decodificador de entidades numéricas y una tabla corta alcanzan y
 * evitan arrastrar una dependencia sólo para los títulos.
 */

/** Las nombradas que aparecen en el volcado de periodicodelfos.com. */
const ENTIDADES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  ndash: '–',
  mdash: '—',
  laquo: '«',
  raquo: '»',
  ldquo: '“',
  rdquo: '”',
  lsquo: '‘',
  rsquo: '’',
  deg: '°',
  ordm: 'º',
  middot: '·',
  bull: '•',
  eacute: 'é',
  aacute: 'á',
  iacute: 'í',
  oacute: 'ó',
  uacute: 'ú',
  ntilde: 'ñ',
  Ntilde: 'Ñ',
}

function desdeCodigo(codigo: number): string | null {
  // `fromCodePoint` tira `RangeError` con cualquier cosa fuera del rango
  // Unicode, y un `&#999999999;` en un título no puede tumbar la migración.
  if (!Number.isInteger(codigo) || codigo < 0 || codigo > 0x10ffff) return null
  try {
    return String.fromCodePoint(codigo)
  } catch {
    return null
  }
}

/**
 * Decodifica las entidades HTML de un string.
 *
 * Las numéricas van primero a propósito: `&amp;#8211;` en WordPress significa
 * "la sarta literal `&#8211;`", y resolver las nombradas al final impide que se
 * decodifique dos veces y termine convertida en una raya.
 */
export function decodificarEntidades(texto: string): string {
  return texto
    .replace(/&#x([0-9a-f]+);/gi, (entera, hex: string) => desdeCodigo(parseInt(hex, 16)) ?? entera)
    .replace(/&#(\d+);/g, (entera, dec: string) => desdeCodigo(Number(dec)) ?? entera)
    .replace(/&([a-z][a-z0-9]*);/gi, (entera, nombre: string) => ENTIDADES[nombre] ?? entera)
}

/** Colapsa todo blanco —incluido el espacio duro de `&nbsp;`— a un espacio. */
export function normalizarEspacios(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim()
}

/**
 * Texto plano de un fragmento de HTML.
 *
 * Sirve para el extracto y para comparar contra el cuerpo; no pretende ser un
 * parser. Los bloques se separan con un espacio para que `</p><p>` no pegue la
 * última palabra de un párrafo con la primera del siguiente.
 */
export function textoPlano(html: string): string {
  const sinEtiquetas = html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
  return normalizarEspacios(decodificarEntidades(sinEtiquetas))
}

/** Quita tildes y diacríticos. Para comparar y para armar nombres de archivo. */
export function sinDiacriticos(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}
