import { describe, expect, it } from 'vitest'
import {
  REDIRECCIONES_FIJAS,
  pathDeUrl,
  redireccionesDeAutores,
  redireccionesDeCategorias,
  redireccionesDeNotas,
  unificarRedirecciones,
} from '@/lib/migracion/redirecciones'
import type { NotaMigrada } from '@/lib/migracion/tipos'

function nota(slug: string, urlVieja: string): NotaMigrada {
  return {
    slug,
    urlVieja,
    wpId: 1,
    titulo: 't',
    tituloOriginal: 't',
    bajada: 'b',
    cuerpo: { type: 'doc', content: [] },
    portada: null,
    imagenes: [],
    categoria: 'cronica',
    temporada: null,
    fechaNumero: null,
    etapa: null,
    autorSlug: 'charlie-redondo',
    estado: 'publicada',
    publicadaEn: '2026-08-08T18:30:00.000Z',
    advertencias: [],
    listaParaEscribir: true,
  }
}

describe('pathDeUrl', () => {
  it('se queda con el path, barra final incluida', () => {
    expect(pathDeUrl('https://periodicodelfos.com/tiburonas-2-1-tigre/')).toBe(
      '/tiburonas-2-1-tigre/',
    )
  })

  it('aguanta que ya venga como path', () => {
    expect(pathDeUrl('/tiburonas-2-1-tigre/')).toBe('/tiburonas-2-1-tigre/')
    expect(pathDeUrl('tiburonas')).toBe('/tiburonas')
  })
})

describe('redireccionesDeNotas', () => {
  it('manda la URL vieja a /nota/ con el mismo slug', () => {
    const notas = [nota('quilmes-0-2-tiburonas', 'https://periodicodelfos.com/quilmes-0-2-tiburonas/')]

    expect(redireccionesDeNotas(notas)).toEqual([
      {
        origen: '/quilmes-0-2-tiburonas/',
        destino: '/nota/quilmes-0-2-tiburonas',
        permanente: true,
      },
    ])
  })
})

describe('redireccionesDeCategorias', () => {
  it('usa los listados propios donde existen y la portada donde no', () => {
    const categorias = [
      { slug: 'cronicas', link: 'https://periodicodelfos.com/category/futbol-femenino/cronicas/' },
      { slug: 'analisis', link: 'https://periodicodelfos.com/category/futbol-femenino/analisis/' },
      { slug: 'planteles', link: 'https://periodicodelfos.com/category/futbol-femenino/planteles/' },
    ]

    expect(
      redireccionesDeCategorias(categorias, (slug) =>
        slug === 'cronicas' ? 'cronica' : slug === 'analisis' ? 'analisis' : 'plantel',
      ),
    ).toEqual([
      { origen: '/category/futbol-femenino/cronicas/', destino: '/cronicas', permanente: true },
      { origen: '/category/futbol-femenino/analisis/', destino: '/analisis', permanente: true },
      { origen: '/category/futbol-femenino/planteles/', destino: '/', permanente: true },
    ])
  })
})

describe('redireccionesDeAutores', () => {
  it('manda el archivo de autor a quiénes somos', () => {
    expect(
      redireccionesDeAutores([
        { link: 'https://periodicodelfos.com/author/redondocarlosrogeliogmail-com/' },
      ]),
    ).toEqual([
      {
        origen: '/author/redondocarlosrogeliogmail-com/',
        destino: '/quienes-somos',
        permanente: true,
      },
    ])
  })
})

describe('unificarRedirecciones', () => {
  it('deja una sola regla por origen y las ordena', () => {
    const resultado = unificarRedirecciones(
      [{ origen: '/b/', destino: '/nota/b', permanente: true }],
      [{ origen: '/a/', destino: '/nota/a', permanente: true }],
      [{ origen: '/b/', destino: '/otra-cosa', permanente: true }],
    )

    expect(resultado).toEqual([
      { origen: '/a/', destino: '/nota/a', permanente: true },
      { origen: '/b/', destino: '/nota/b', permanente: true },
    ])
  })

  it('todas son 301', () => {
    expect(REDIRECCIONES_FIJAS.every((r) => r.permanente)).toBe(true)
  })
})
