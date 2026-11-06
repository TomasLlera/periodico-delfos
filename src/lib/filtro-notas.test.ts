import { describe, expect, it } from 'vitest'
import {
  anioDeNota,
  aniosDeNotas,
  filtrarNotas,
  hayFiltro,
  leerFiltro,
  type Filtro,
} from '@/lib/filtro-notas'
import type { NotaResumen } from '@/types'

/**
 * Una nota del listado con lo mínimo que mira el filtro. El resto de
 * `NotaResumen` no participa, así que se completa una vez y no se repite en
 * cada caso.
 */
function nota(parcial: Partial<NotaResumen> & { titulo: string }): NotaResumen {
  const base: NotaResumen = {
    id: parcial.titulo,
    titulo: parcial.titulo,
    slug: parcial.titulo,
    bajada: '',
    imagen_portada: null,
    imagen_alt: '',
    imagen_credito: null,
    categoria: 'cronica',
    temporada_id: null,
    partido_id: null,
    autor_id: 'charlie',
    estado: 'publicada',
    publicada_en: '2026-05-10T12:00:00.000Z',
    publicar_en: null,
    destacada: false,
    auto_post: true,
    redes: ['facebook'],
    created_at: '2026-05-01T12:00:00.000Z',
    updated_at: '2026-05-01T12:00:00.000Z',
    autor: { nombre: 'Charlie Redondo', slug: 'charlie-redondo' },
  }

  return { ...base, ...parcial }
}

const SIN_FILTRO: Filtro = { texto: '', estado: null, categoria: null, anio: null }

describe('leerFiltro', () => {
  it('sin parámetros no filtra nada', () => {
    expect(leerFiltro({})).toEqual(SIN_FILTRO)
  })

  it('lee los cuatro campos', () => {
    expect(
      leerFiltro({ texto: ' Claypole ', estado: 'borrador', categoria: 'analisis', anio: '2024' }),
    ).toEqual({ texto: 'Claypole', estado: 'borrador', categoria: 'analisis', anio: 2024 })
  })

  it('descarta un estado o una categoría que no existen', () => {
    expect(leerFiltro({ estado: 'cualquiera', categoria: 'inventada' })).toEqual(SIN_FILTRO)
  })

  it('descarta un año que no es un año', () => {
    expect(leerFiltro({ anio: 'ayer' }).anio).toBeNull()
    expect(leerFiltro({ anio: '1998' }).anio).toBeNull()
    expect(leerFiltro({ anio: '' }).anio).toBeNull()
  })

  it('colapsa los espacios del medio y recorta un pegado accidental', () => {
    expect(leerFiltro({ texto: 'Aldosivi   Morón' }).texto).toBe('Aldosivi Morón')
    expect(leerFiltro({ texto: 'x'.repeat(500) }).texto).toHaveLength(100)
  })

  it('con el parámetro repetido usa el primero', () => {
    expect(leerFiltro({ texto: ['gol', 'otro'] }).texto).toBe('gol')
  })
})

describe('hayFiltro', () => {
  it('es falso sin nada puesto', () => {
    expect(hayFiltro(SIN_FILTRO)).toBe(false)
  })

  it('alcanza con uno', () => {
    expect(hayFiltro({ ...SIN_FILTRO, texto: 'gol' })).toBe(true)
    expect(hayFiltro({ ...SIN_FILTRO, estado: 'borrador' })).toBe(true)
    expect(hayFiltro({ ...SIN_FILTRO, categoria: 'cronica' })).toBe(true)
    expect(hayFiltro({ ...SIN_FILTRO, anio: 2024 })).toBe(true)
  })
})

describe('anioDeNota', () => {
  it('usa la fecha de publicación', () => {
    expect(anioDeNota(nota({ titulo: 'a', publicada_en: '2024-03-02T12:00:00.000Z' }))).toBe(2024)
  })

  it('la programada vale por cuándo sale', () => {
    const programada = nota({
      titulo: 'a',
      estado: 'programada',
      publicada_en: null,
      publicar_en: '2027-01-02T12:00:00.000Z',
      created_at: '2026-01-01T12:00:00.000Z',
    })
    expect(anioDeNota(programada)).toBe(2027)
  })

  it('el borrador, que no tiene fecha de publicación, vale por cuándo se empezó', () => {
    const borrador = nota({
      titulo: 'a',
      estado: 'borrador',
      publicada_en: null,
      created_at: '2025-11-02T12:00:00.000Z',
    })
    expect(anioDeNota(borrador)).toBe(2025)
  })
})

describe('aniosDeNotas', () => {
  it('sin repetir y del más nuevo al más viejo', () => {
    const notas = [
      nota({ titulo: 'a', publicada_en: '2024-03-02T12:00:00.000Z' }),
      nota({ titulo: 'b', publicada_en: '2026-03-02T12:00:00.000Z' }),
      nota({ titulo: 'c', publicada_en: '2024-09-02T12:00:00.000Z' }),
    ]
    expect(aniosDeNotas(notas)).toEqual([2026, 2024])
  })

  it('sin notas no hay años', () => {
    expect(aniosDeNotas([])).toEqual([])
  })
})

describe('filtrarNotas', () => {
  const notas = [
    nota({ titulo: 'Aldosivi 6-1 Claypole', categoria: 'cronica' }),
    nota({ titulo: 'El análisis de la fecha 4', categoria: 'analisis' }),
    nota({
      titulo: 'Morón, la previa',
      categoria: 'cronica',
      estado: 'borrador',
      publicada_en: null,
      created_at: '2024-02-02T12:00:00.000Z',
    }),
  ]

  it('sin filtro devuelve todo y en el mismo orden', () => {
    expect(filtrarNotas(notas, SIN_FILTRO).map((n) => n.titulo)).toEqual(notas.map((n) => n.titulo))
  })

  it('por texto, por parte del título', () => {
    expect(filtrarNotas(notas, { ...SIN_FILTRO, texto: 'claypole' })).toHaveLength(1)
  })

  it('ignora las tildes en los dos lados', () => {
    expect(filtrarNotas(notas, { ...SIN_FILTRO, texto: 'moron' })).toHaveLength(1)
    expect(filtrarNotas(notas, { ...SIN_FILTRO, texto: 'análisis' })).toHaveLength(1)
    expect(filtrarNotas(notas, { ...SIN_FILTRO, texto: 'analisis' })).toHaveLength(1)
  })

  it('por estado', () => {
    expect(filtrarNotas(notas, { ...SIN_FILTRO, estado: 'borrador' })).toHaveLength(1)
    expect(filtrarNotas(notas, { ...SIN_FILTRO, estado: 'archivada' })).toHaveLength(0)
  })

  it('por categoría', () => {
    expect(filtrarNotas(notas, { ...SIN_FILTRO, categoria: 'cronica' })).toHaveLength(2)
  })

  it('por año', () => {
    expect(filtrarNotas(notas, { ...SIN_FILTRO, anio: 2024 }).map((n) => n.titulo)).toEqual([
      'Morón, la previa',
    ])
  })

  it('los filtros se acumulan', () => {
    expect(
      filtrarNotas(notas, { ...SIN_FILTRO, texto: 'moron', categoria: 'analisis' }),
    ).toHaveLength(0)
  })
})
