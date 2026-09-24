import { describe, expect, it } from 'vitest'
import type { EntradaNota } from './nota'
import { ID_VISTA_PREVIA, esSobrePublicada, notaDePrevisualizacion } from './vista-previa'
import type { Autor } from '@/types'

const AUTOR: Autor = {
  id: '780bfef5-2987-4e4f-af2d-c6f6d5bf6a21',
  nombre: 'Charlie Redondo',
  slug: 'charlie-redondo',
  bio: null,
  foto_url: null,
  instagram: null,
  x_handle: null,
  firma_como: null,
}

const ENTRADA: EntradaNota = {
  titulo: 'Tiburonas 2-1 Defensores',
  slug: 'tiburonas-2-1-defensores',
  bajada: 'Ganó de local en la primera fecha.',
  cuerpo: { type: 'doc', content: [{ type: 'paragraph' }] },
  imagen_portada: null,
  imagen_alt: '',
  imagen_credito: null,
  categoria: 'cronica',
  temporada_id: null,
  partido_id: null,
  destacada: false,
  auto_post: true,
  redes: ['facebook', 'instagram', 'x'],
}

const AHORA = new Date('2026-09-20T18:00:00.000Z')

describe('notaDePrevisualizacion', () => {
  it('al crear, la nota no existe y queda como borrador', () => {
    const nota = notaDePrevisualizacion({ entrada: ENTRADA, autor: AUTOR, ahora: AHORA })

    expect(nota.id).toBe(ID_VISTA_PREVIA)
    expect(nota.estado).toBe('borrador')
  })

  it('pone la fecha de ahora: es la que tendría si se confirmara', () => {
    const nota = notaDePrevisualizacion({ entrada: ENTRADA, autor: AUTOR, ahora: AHORA })

    expect(nota.publicada_en).toBe(AHORA.toISOString())
  })

  it('editando una publicada, conserva su id, su estado y su fecha', () => {
    const nota = notaDePrevisualizacion({
      entrada: { ...ENTRADA, titulo: 'Título corregido' },
      autor: AUTOR,
      existente: {
        id: 'c0ffee00-0000-4000-8000-000000000001',
        estado: 'publicada',
        publicada_en: '2026-04-20T12:00:00.000Z',
        created_at: '2026-04-19T12:00:00.000Z',
      },
      ahora: AHORA,
    })

    expect(nota.id).toBe('c0ffee00-0000-4000-8000-000000000001')
    expect(nota.estado).toBe('publicada')
    expect(nota.publicada_en).toBe('2026-04-20T12:00:00.000Z')
    expect(nota.titulo).toBe('Título corregido')
  })

  it('no inventa imagen ni relaciones cuando no las hay', () => {
    const nota = notaDePrevisualizacion({ entrada: ENTRADA, autor: AUTOR, ahora: AHORA })

    expect(nota.imagen_portada).toBeNull()
    expect(nota.temporada).toBeNull()
    expect(nota.partido).toBeNull()
  })

  it('deja pasar el blob de la imagen elegida y sin subir', () => {
    const nota = notaDePrevisualizacion({
      entrada: { ...ENTRADA, imagen_portada: 'blob:http://localhost:3000/abc', imagen_alt: 'Luna festeja' },
      autor: AUTOR,
      ahora: AHORA,
    })

    expect(nota.imagen_portada).toBe('blob:http://localhost:3000/abc')
    expect(nota.imagen_alt).toBe('Luna festeja')
  })

  it('el autor de la nota es el de la sesión', () => {
    const nota = notaDePrevisualizacion({ entrada: ENTRADA, autor: AUTOR, ahora: AHORA })

    expect(nota.autor_id).toBe(AUTOR.id)
    expect(nota.autor.nombre).toBe('Charlie Redondo')
  })
})

describe('esSobrePublicada', () => {
  it('es falso al crear', () => {
    expect(esSobrePublicada(null)).toBe(false)
  })

  it('es falso sobre un borrador guardado', () => {
    expect(
      esSobrePublicada({
        id: 'x',
        estado: 'borrador',
        publicada_en: null,
        created_at: AHORA.toISOString(),
      }),
    ).toBe(false)
  })

  it('es verdadero sobre una nota que está viva en el sitio', () => {
    expect(
      esSobrePublicada({
        id: 'x',
        estado: 'publicada',
        publicada_en: AHORA.toISOString(),
        created_at: AHORA.toISOString(),
      }),
    ).toBe(true)
  })
})
