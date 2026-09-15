import { describe, expect, it } from 'vitest'
import { jsonLdNota, urlDeNota } from '@/lib/seo'
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
