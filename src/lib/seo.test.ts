import { describe, expect, it } from 'vitest'
import { jsonLdNota, jsonLdPartido, urlDeNota, urlOg } from '@/lib/seo'
import type { Autor, NotaConRelaciones } from '@/types'

const AUTOR: Autor = {
  id: 'a-1',
  nombre: 'Charlie Redondo',
  slug: 'charlie-redondo',
  bio: null,
  foto_url: null,
  instagram: null,
  x_handle: null,
}

function nota(extra: Partial<NotaConRelaciones> = {}): NotaConRelaciones {
  return {
    id: 'n-1',
    titulo: 'Aldosivi goleó y quedó a un punto de la punta',
    slug: 'aldosivi-goleo',
    bajada: 'Tres goles en el segundo tiempo y una defensa que no sufrió.',
    cuerpo: { type: 'doc', content: [] },
    imagen_portada: 'https://proyecto.supabase.co/storage/v1/object/public/media/gol.jpg',
    imagen_alt: 'Las jugadoras festejan el tercer gol',
    imagen_credito: null,
    categoria: 'cronica',
    temporada_id: 't-1',
    partido_id: 'p-1',
    autor_id: 'a-1',
    estado: 'publicada',
    publicada_en: '2026-08-08T18:30:00.000Z',
    destacada: false,
    auto_post: true,
    redes: [],
    created_at: '2026-08-08T18:00:00.000Z',
    updated_at: '2026-08-09T10:00:00.000Z',
    autor: AUTOR,
    temporada: null,
    partido: null,
    ...extra,
  }
}

describe('urlDeNota', () => {
  it('arma la URL absoluta', () => {
    expect(urlDeNota('aldosivi-goleo', 'https://periodicodelfos.com')).toBe(
      'https://periodicodelfos.com/nota/aldosivi-goleo',
    )
  })

  it('no duplica la barra si el sitio viene con una al final', () => {
    expect(urlDeNota('aldosivi-goleo', 'https://periodicodelfos.com/')).toBe(
      'https://periodicodelfos.com/nota/aldosivi-goleo',
    )
  })
})

describe('jsonLdNota', () => {
  const sitio = 'https://periodicodelfos.com'

  it('emite un NewsArticle con el título limpio y la canonical', () => {
    const datos = jsonLdNota(nota(), sitio)

    expect(datos['@type']).toBe('NewsArticle')
    expect(datos.headline).toBe('Aldosivi goleó y quedó a un punto de la punta')
    expect(datos.url).toBe('https://periodicodelfos.com/nota/aldosivi-goleo')
    expect(datos.inLanguage).toBe('es-AR')
  })

  it('lleva las dos fechas', () => {
    const datos = jsonLdNota(nota(), sitio)

    expect(datos.datePublished).toBe('2026-08-08T18:30:00.000Z')
    expect(datos.dateModified).toBe('2026-08-09T10:00:00.000Z')
  })

  it('omite las fechas si la nota no está publicada', () => {
    const datos = jsonLdNota(nota({ publicada_en: null }), sitio)

    expect(datos).not.toHaveProperty('datePublished')
    expect(datos).not.toHaveProperty('dateModified')
  })

  it('omite la imagen en vez de emitirla en null', () => {
    const datos = jsonLdNota(nota({ imagen_portada: null }), sitio)

    expect(datos).not.toHaveProperty('image')
  })
})

describe('urlOg', () => {
  it('apunta a /api/og con el título', () => {
    expect(urlOg({ titulo: 'Un título' }, 'https://periodicodelfos.com')).toBe(
      'https://periodicodelfos.com/api/og?titulo=Un+t%C3%ADtulo',
    )
  })

  it('escapa los caracteres que cortarían el querystring', () => {
    const url = urlOg({ titulo: 'Aldosivi & Morón: ¿el 2-1?' }, 'https://x.com')
    expect(url).toContain('titulo=Aldosivi+%26+Mor%C3%B3n')
    expect(url).not.toContain('& Morón')
    // Un único `?`: el del querystring.
    expect(url.split('?')).toHaveLength(2)
  })

  it('la volanta es opcional', () => {
    expect(urlOg({ titulo: 'T' }, 'https://x.com')).not.toContain('volanta')
    expect(urlOg({ titulo: 'T', volanta: null }, 'https://x.com')).not.toContain('volanta')
    expect(urlOg({ titulo: 'T', volanta: 'Crónica' }, 'https://x.com')).toContain(
      'volanta=Cr%C3%B3nica',
    )
  })

  it('no duplica la barra final del sitio', () => {
    expect(urlOg({ titulo: 'T' }, 'https://x.com/')).toContain('https://x.com/api/og?')
  })
})

describe('jsonLdPartido', () => {
  const equipo = (nombre: string, esAldosivi: boolean, escudo: string | null = null) => ({
    id: nombre,
    nombre,
    nombre_corto: nombre.slice(0, 8),
    apodo: null,
    slug: nombre.toLowerCase(),
    escudo_url: escudo,
    ciudad: null,
    es_aldosivi: esAldosivi,
  })

  const partido = (parcial: Record<string, unknown> = {}) =>
    ({
      id: 'p1',
      temporada_id: 't1',
      fecha_numero: 12,
      fecha_hora: '2026-09-13T18:00:00Z',
      equipo_local_id: 'Aldosivi',
      equipo_visitante_id: 'Morón',
      goles_local: 2,
      goles_visitante: 1,
      estado: 'finalizado',
      cancha: 'Cancha 2 Aldosivi',
      arbitra: null,
      slug: 'aldosivi-moron-f12',
      observaciones: null,
      created_at: '2026-09-13T18:00:00Z',
      equipo_local: equipo('Aldosivi', true),
      equipo_visitante: equipo('Morón', false),
      temporada: {
        id: 't1',
        nombre: 'Primera B 2026',
        slug: 'primera-b-2026',
        division: 'Primera B',
        anio: 2026,
        zona: null,
        activa: true,
        created_at: '2026-01-01T00:00:00Z',
      },
      ...parcial,
    }) as Parameters<typeof jsonLdPartido>[0]

  it('emite un SportsEvent con los dos equipos', () => {
    const ld = jsonLdPartido(partido(), 'https://periodicodelfos.com')
    expect(ld['@type']).toBe('SportsEvent')
    expect(ld.name).toBe('Aldosivi vs Morón')
    expect(ld.url).toBe('https://periodicodelfos.com/partido/aldosivi-moron-f12')
    expect(ld.homeTeam).toMatchObject({ '@type': 'SportsTeam', name: 'Aldosivi' })
    expect(ld.awayTeam).toMatchObject({ name: 'Morón' })
  })

  it('mapea el estado al vocabulario de schema.org', () => {
    const base = 'https://x.com'
    expect(jsonLdPartido(partido({ estado: 'finalizado' }), base).eventStatus).toBe(
      'https://schema.org/EventScheduled',
    )
    expect(jsonLdPartido(partido({ estado: 'postergado' }), base).eventStatus).toBe(
      'https://schema.org/EventPostponed',
    )
    expect(jsonLdPartido(partido({ estado: 'suspendido' }), base).eventStatus).toBe(
      'https://schema.org/EventCancelled',
    )
  })

  it('omite la cancha cuando no está cargada', () => {
    expect(jsonLdPartido(partido({ cancha: null }), 'https://x.com').location).toBeUndefined()
    expect(jsonLdPartido(partido(), 'https://x.com').location).toMatchObject({
      name: 'Cancha 2 Aldosivi',
    })
  })

  it('omite el logo del equipo cuando no hay escudo', () => {
    const ld = jsonLdPartido(partido(), 'https://x.com')
    expect(ld.homeTeam).not.toHaveProperty('logo')
  })
})
