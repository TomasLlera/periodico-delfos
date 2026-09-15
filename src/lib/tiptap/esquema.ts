/**
 * Validación del cuerpo de una nota antes de renderizarlo.
 *
 * `notas.cuerpo` es una columna `jsonb`: Postgres garantiza que es JSON válido
 * y nada más. Puede venir de la migración desde WordPress, de una versión vieja
 * del editor o de una fila editada a mano. El renderer no lo recorre sin pasar
 * primero por acá.
 *
 * La validación es deliberadamente **de forma, no de vocabulario**: se exige
 * que cada nodo sea `{ type: string, … }` pero no que `type` esté en una lista
 * cerrada. Si el esquema enumerara los tipos conocidos, un nodo nuevo —o uno
 * que quedó de WordPress— invalidaría el documento entero y la nota saldría en
 * blanco. Se prefiere que el documento pase y que el renderer descarte en
 * silencio lo que no sabe dibujar.
 *
 * Los atributos sí se validan estrictamente, pero nodo por nodo y al momento de
 * renderizarlo: una imagen sin `alt` se cae sola, sin llevarse el resto.
 *
 * Contrato de atributos de los dos nodos propios (lo tiene que respetar
 * `extensions.ts` cuando se escriba el editor):
 *
 *     { type: 'imagen',   attrs: { src, alt, epigrafe?, credito? } }
 *     { type: 'planilla', attrs: { partidoId } }
 */

import { z } from 'zod'
import type { DocumentoTipTap, NodoTipTap } from '@/types'

// ============================================
// Forma del documento
// ============================================

const esquemaMarca = z.object({
  type: z.string(),
  attrs: z.record(z.string(), z.unknown()).optional(),
})

const esquemaNodo: z.ZodType<NodoTipTap> = z.lazy(() =>
  z.object({
    type: z.string(),
    attrs: z.record(z.string(), z.unknown()).optional(),
    marks: z.array(esquemaMarca).optional(),
    content: z.array(esquemaNodo).optional(),
    text: z.string().optional(),
  }),
)

export const esquemaDocumento = z.object({
  type: z.literal('doc'),
  content: z.array(esquemaNodo).optional(),
})

/**
 * Corte de seguridad ante un documento anidado sin fin. Una crónica real no
 * pasa de tres o cuatro niveles (lista → item → párrafo → texto).
 *
 * Vive acá y no en el renderer porque lo comparten los dos recorridos del
 * árbol: el que dibuja y el que junta los `partidoId`.
 */
export const PROFUNDIDAD_MAXIMA = 12

/**
 * Devuelve el documento si tiene forma de documento TipTap, o `null` si no.
 *
 * El `try/catch` no es decorativo: `safeParse` atrapa los `ZodError` pero no un
 * `RangeError` por desbordar la pila, que es lo que produciría un documento
 * absurdamente anidado. El renderer además corta a `PROFUNDIDAD_MAXIMA`.
 */
export function parsearDocumento(valor: unknown): DocumentoTipTap | null {
  try {
    const resultado = esquemaDocumento.safeParse(valor)
    return resultado.success ? resultado.data : null
  } catch {
    return null
  }
}

// ============================================
// URLs
// ============================================

/**
 * Un link del cuerpo no puede llevar a `javascript:` ni a `data:`. La lista es
 * blanca a propósito: lo que no está enumerado no pasa.
 */
const PROTOCOLOS_LINK: ReadonlySet<string> = new Set(['http:', 'https:', 'mailto:'])

/** Las imágenes siempre salen del bucket `media`, que es HTTPS público. */
const PROTOCOLOS_IMAGEN: ReadonlySet<string> = new Set(['http:', 'https:'])

/**
 * Normaliza y filtra una URL contra una lista blanca de protocolos.
 *
 * Se apoya en el parser de `URL` en lugar de en una expresión regular porque es
 * el mismo que aplica el navegador: normaliza mayúsculas (`JavaScript:`) y
 * descarta tabulaciones y saltos de línea intercalados (`java\nscript:`), que
 * son las dos formas clásicas de esconder un esquema prohibido.
 */
function urlPermitida(valor: unknown, protocolos: ReadonlySet<string>): string | null {
  if (typeof valor !== 'string') return null

  const url = valor.trim()
  if (url === '') return null

  // Ruta interna del sitio: no lleva esquema, así que no puede ejecutar nada.
  // `//host` queda afuera: es una URL externa disfrazada de ruta relativa.
  if (url.startsWith('/')) return url.startsWith('//') ? null : url

  try {
    return protocolos.has(new URL(url).protocol) ? url : null
  } catch {
    return null
  }
}

/**
 * `href` de un link del cuerpo, o `null` si no es seguro.
 *
 * Cuando devuelve `null` el renderer igual escribe el texto: se pierde el link,
 * no la frase.
 */
export function hrefSeguro(valor: unknown): string | null {
  if (typeof valor === 'string' && valor.trim().startsWith('#')) {
    return valor.trim()
  }
  return urlPermitida(valor, PROTOCOLOS_LINK)
}

/** `true` si el link sale del sitio y necesita `rel="noopener noreferrer"`. */
export function esExterno(href: string): boolean {
  return /^https?:\/\//i.test(href)
}

// ============================================
// Atributos, nodo por nodo
// ============================================

/**
 * Sólo `src` y `alt`, que son los que hacen o no hacen a la imagen.
 *
 * El epígrafe y el crédito se leen aparte con `textoOpcional()`: son adorno, y
 * uno mal cargado tiene que degradarse a nada, no tumbar la imagen entera.
 */
const esquemaImagen = z.object({
  src: z.string().trim().min(1),
  /** Regla no negociable 4. Una imagen sin descripción no se publica. */
  alt: z.string().trim().min(1),
})

/** Texto de adorno: `null` si falta, viene vacío o no es un string. */
function textoOpcional(valor: unknown): string | null {
  if (typeof valor !== 'string') return null
  const texto = valor.trim()
  return texto === '' ? null : texto
}

export interface AtributosImagen {
  src: string
  alt: string
  epigrafe: string | null
  credito: string | null
}

/**
 * Atributos de un nodo `imagen`, o `null` si le falta el `src` o el `alt`.
 *
 * Descartar la imagen entera por no tener `alt` pierde contenido, y es
 * intencional: la alternativa es publicar una imagen que un lector de pantalla
 * no puede anunciar. La base tiene el mismo criterio (constraint
 * `alt_requerido` en `0005_notas.sql`), así que llegar acá con `alt` vacío ya
 * es una anomalía.
 */
export function atributosImagen(attrs: unknown): AtributosImagen | null {
  const resultado = esquemaImagen.safeParse(attrs)
  if (!resultado.success) return null

  const src = urlPermitida(resultado.data.src, PROTOCOLOS_IMAGEN)
  if (!src) return null

  // `attrs` es un objeto: el safeParse de arriba ya lo confirmó.
  const { epigrafe, credito } = attrs as { epigrafe?: unknown; credito?: unknown }

  return {
    src,
    alt: resultado.data.alt,
    epigrafe: textoOpcional(epigrafe),
    credito: textoOpcional(credito),
  }
}

const esquemaPlanilla = z.object({
  partidoId: z.string().trim().min(1),
})

/** `partidoId` de un nodo `planilla`, o `null` si el nodo está incompleto. */
export function partidoIdDeNodo(attrs: unknown): string | null {
  const resultado = esquemaPlanilla.safeParse(attrs)
  return resultado.success ? resultado.data.partidoId : null
}

/**
 * Los `partidoId` de todos los nodos `planilla` del cuerpo, sin repetir.
 *
 * La página los usa para traer los partidos en **una sola** consulta antes de
 * renderizar. El renderer no consulta la base: si un `partidoId` no está en el
 * mapa que recibe, el nodo desaparece. Hacer la consulta desde el nodo serían
 * N consultas en serie, una por planilla embebida.
 *
 * Un cuerpo que no valida devuelve la lista vacía, no una excepción: la nota
 * se dibuja igual, sin las planillas.
 */
export function partidoIdsDelCuerpo(cuerpo: unknown): string[] {
  const documento = parsearDocumento(cuerpo)
  if (!documento) return []

  const ids = new Set<string>()

  function recorrer(nodos: NodoTipTap[] | undefined, profundidad: number): void {
    if (!nodos || profundidad > PROFUNDIDAD_MAXIMA) return

    for (const nodo of nodos) {
      if (nodo.type === 'planilla') {
        const id = partidoIdDeNodo(nodo.attrs)
        if (id) ids.add(id)
      }
      recorrer(nodo.content, profundidad + 1)
    }
  }

  recorrer(documento.content, 0)
  return [...ids]
}

/**
 * Nivel de un `heading`, acotado a 2 o 3.
 *
 * El `h1` de la página es el título de la nota: un `h1` en el cuerpo rompe la
 * jerarquía de encabezados. Un nivel fuera de rango se pega al borde más
 * cercano en lugar de descartar el título, que es contenido real.
 */
export function nivelDeTitulo(attrs: unknown): 2 | 3 {
  const nivel = (attrs as { level?: unknown } | null | undefined)?.level
  return typeof nivel === 'number' && nivel >= 3 ? 3 : 2
}

/** `start` de una lista ordenada. `undefined` cuando arranca en 1. */
export function inicioDeLista(attrs: unknown): number | undefined {
  const start = (attrs as { start?: unknown } | null | undefined)?.start
  if (typeof start !== 'number' || !Number.isInteger(start) || start === 1) {
    return undefined
  }
  return start
}

/** `href` de la marca `link` de un nodo de texto, ya filtrado. */
export function hrefDeMarcas(marcas: NodoTipTap['marks']): string | null {
  const link = marcas?.find((marca) => marca.type === 'link')
  return link ? hrefSeguro(link.attrs?.href) : null
}

/** `true` si el nodo de texto lleva la marca pedida. */
export function tieneMarca(marcas: NodoTipTap['marks'], tipo: string): boolean {
  return marcas?.some((marca) => marca.type === tipo) ?? false
}
