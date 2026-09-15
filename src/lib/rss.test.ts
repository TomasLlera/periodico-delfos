import { describe, expect, it } from 'vitest'
import { escaparXml, feedRss, fechaRss } from '@/lib/rss'
import type { NotaResumen } from '@/types'

const AHORA = new Date('2026-09-15T12:00:00Z')

function nota(parcial: Partial<NotaResumen> = {}): NotaResumen {
  return {
    id: 'id-1',
    titulo: 'Las Tiburonas lo dieron vuelta',
    slug: 'lo-dieron-vuelta',
    bajada: 'Dos goles en el tramo final.',
    imagen_portada: null,
    imagen_alt: '',
    imagen_credito: null,
    categoria: 'cronica',
    temporada_id: null,
    partido_id: null,
    autor_id: 'a1',
    estado: 'publicada',
    publicada_en: '2026-09-15T09:00:00Z',
    destacada: false,
    auto_post: true,
    redes: [],
    created_at: '2026-09-15T09:00:00Z',
    updated_at: '2026-09-15T09:00:00Z',
    autor: { nombre: 'Charlie Redondo', slug: 'charlie-redondo' },
    ...parcial,
  }
}

describe('escaparXml', () => {
  it('escapa los cinco caracteres de XML', () => {
    expect(escaparXml('a & b')).toBe('a &amp; b')
    expect(escaparXml('<b>')).toBe('&lt;b&gt;')
    expect(escaparXml('dijo "hola"')).toBe('dijo &quot;hola&quot;')
    expect(escaparXml("l'equipe")).toBe('l&apos;equipe')
  })

  it('no escapa dos veces el ampersand que introduce el propio escape', () => {
    expect(escaparXml('<')).toBe('&lt;')
    expect(escaparXml('&<')).toBe('&amp;&lt;')
  })

  it('deja los acentos en paz: el documento es UTF-8', () => {
    expect(escaparXml('Análisis táctico')).toBe('Análisis táctico')
  })
})

describe('fechaRss', () => {
  it('devuelve RFC 822 y no ISO', () => {
    expect(fechaRss('2026-09-15T09:00:00Z')).toBe('Tue, 15 Sep 2026 09:00:00 GMT')
  })
})

describe('feedRss', () => {
  it('arma un feed válido sin notas', () => {
    const xml = feedRss({ notas: [], urlSitio: 'https://periodicodelfos.com', ahora: AHORA })
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('<language>es-AR</language>')
    expect(xml).toContain('</rss>')
    expect(xml).not.toContain('<item>')
  })

  it('escapa el título de una nota con ampersand', () => {
    const xml = feedRss({
      notas: [nota({ titulo: 'Aldosivi & Morón: el 2-1' })],
      urlSitio: 'https://periodicodelfos.com',
      ahora: AHORA,
    })
    expect(xml).toContain('<title>Aldosivi &amp; Morón: el 2-1</title>')
    expect(xml).not.toContain('Aldosivi & Morón')
  })

  it('el link del item es la URL canónica de la nota', () => {
    const xml = feedRss({
      notas: [nota()],
      urlSitio: 'https://periodicodelfos.com/',
      ahora: AHORA,
    })
    expect(xml).toContain('<link>https://periodicodelfos.com/nota/lo-dieron-vuelta</link>')
  })

  it('omite pubDate si la nota no tiene fecha de publicación', () => {
    const xml = feedRss({
      notas: [nota({ publicada_en: null })],
      urlSitio: 'https://periodicodelfos.com',
      ahora: AHORA,
    })
    expect(xml).toContain('<item>')
    expect(xml).not.toContain('<pubDate>')
  })

  it('el guid no es permalink: es el id de la base', () => {
    const xml = feedRss({ notas: [nota({ id: 'abc-123' })], urlSitio: 'https://x.com', ahora: AHORA })
    expect(xml).toContain('<guid isPermaLink="false">abc-123</guid>')
  })
})
