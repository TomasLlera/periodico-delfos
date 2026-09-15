import { NOMBRE_SITIO, urlDeNota } from '@/lib/seo'
import type { NotaResumen } from '@/types'

/**
 * El feed RSS, armado a mano y no con una librería.
 *
 * Son treinta líneas de XML y una dependencia menos. Lo que sí hay que hacer
 * bien es escapar: los títulos de este sitio tienen comillas, guiones y
 * ampersands —"Tiburonas 7-0 Laferrere: Semifinales"— y un `&` sin escapar
 * rompe el documento entero, no sólo ese item. Por eso esto es lógica pura y
 * tiene tests: el error se ve recién cuando un lector de feeds falla.
 */

const DESCRIPCION_SITIO =
  'El fútbol femenino de Aldosivi, fecha a fecha. Crónicas, análisis y estadísticas de las Tiburonas, desde Mar del Plata.'

/**
 * Los cinco caracteres que XML no deja pasar en texto ni en atributos.
 *
 * El `&` va primero a propósito: si se reemplazara después, volvería a escapar
 * los `&` que acaban de introducir los otros reemplazos y saldría `&amp;lt;`.
 */
export function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** RFC 822, que es lo que pide RSS 2.0. No ISO. */
export function fechaRss(iso: string): string {
  return new Date(iso).toUTCString()
}

interface Opciones {
  notas: readonly NotaResumen[]
  urlSitio: string
  /** Inyectable para que el test no dependa del reloj. */
  ahora?: Date
}

export function feedRss({ notas, urlSitio, ahora = new Date() }: Opciones): string {
  const base = urlSitio.replace(/\/+$/, '')

  const items = notas
    .map((nota) => {
      const url = urlDeNota(nota.slug, base)
      const fecha = nota.publicada_en ? fechaRss(nota.publicada_en) : null

      return [
        '    <item>',
        `      <title>${escaparXml(nota.titulo)}</title>`,
        `      <link>${escaparXml(url)}</link>`,
        // `isPermaLink="false"` porque el guid es el id de la base, no una URL.
        `      <guid isPermaLink="false">${escaparXml(nota.id)}</guid>`,
        `      <description>${escaparXml(nota.bajada)}</description>`,
        `      <dc:creator>${escaparXml(nota.autor.nombre)}</dc:creator>`,
        fecha ? `      <pubDate>${fecha}</pubDate>` : null,
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escaparXml(NOMBRE_SITIO)}</title>`,
    `    <link>${escaparXml(base)}</link>`,
    `    <description>${escaparXml(DESCRIPCION_SITIO)}</description>`,
    '    <language>es-AR</language>',
    `    <lastBuildDate>${ahora.toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${escaparXml(`${base}/rss.xml`)}" rel="self" type="application/rss+xml" />`,
    items,
    '  </channel>',
    '</rss>',
  ]
    .filter((linea) => linea !== '')
    .join('\n')
}
