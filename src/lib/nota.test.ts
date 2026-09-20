import { describe, expect, it } from 'vitest'
import {
  chequearPublicacion,
  cuerpoVacio,
  documentoVacio,
  esquemaNota,
  redesAPostear,
  slugDesdeTitulo,
  type EntradaNota,
} from './nota'

describe('slugDesdeTitulo', () => {
  it('baja a minúsculas y une con guiones', () => {
    expect(slugDesdeTitulo('Tiburonas 2-1 Defensores de Belgrano')).toBe(
      'tiburonas-2-1-defensores-de-belgrano',
    )
  })

  it('saca los acentos sin comerse la letra', () => {
    expect(slugDesdeTitulo('Crónica del clásico')).toBe('cronica-del-clasico')
  })

  it('convierte la ñ en n', () => {
    expect(slugDesdeTitulo('Diez años de fútbol femenino')).toBe('diez-anos-de-futbol-femenino')
  })

  it('tira la puntuación en vez de pegar las palabras', () => {
    expect(slugDesdeTitulo('¿Cómo llega All Boys?')).toBe('como-llega-all-boys')
  })

  it('no deja guiones dobles ni en las puntas', () => {
    expect(slugDesdeTitulo('  Tiburonas — campeonas!  ')).toBe('tiburonas-campeonas')
  })
})

describe('cuerpoVacio', () => {
  it('un documento recién abierto está vacío', () => {
    expect(cuerpoVacio(documentoVacio())).toBe(true)
  })

  it('varios párrafos en blanco siguen estando vacíos', () => {
    expect(
      cuerpoVacio({ type: 'doc', content: [{ type: 'paragraph' }, { type: 'paragraph' }] }),
    ).toBe(true)
  })

  it('encuentra el texto aunque esté anidado', () => {
    const cuerpo = {
      type: 'doc' as const,
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Gol de Luna' }] }],
            },
          ],
        },
      ],
    }

    expect(cuerpoVacio(cuerpo)).toBe(false)
  })
})

const NOTA: EntradaNota = {
  titulo: 'Tiburonas 2-1 Defensores',
  slug: 'tiburonas-2-1-defensores',
  bajada: 'Ganó de local en la primera fecha.',
  cuerpo: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hola' }] }] },
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

describe('chequearPublicacion', () => {
  it('una nota completa se puede publicar', () => {
    expect(chequearPublicacion(NOTA)).toEqual({ puede: true, motivos: [] })
  })

  it('junta todos los motivos, no sólo el primero', () => {
    const { motivos } = chequearPublicacion({
      ...NOTA,
      titulo: '   ',
      bajada: '',
      cuerpo: documentoVacio(),
    })

    expect(motivos).toHaveLength(3)
  })

  it('una imagen sin alt frena la publicación', () => {
    const chequeo = chequearPublicacion({
      ...NOTA,
      imagen_portada: 'wp/2026/08/tiburonas.jpg',
      imagen_alt: '  ',
    })

    expect(chequeo.puede).toBe(false)
    expect(chequeo.motivos).toContain('La imagen de portada no tiene texto alternativo')
  })

  it('sin imagen, el alt vacío no molesta', () => {
    expect(chequearPublicacion({ ...NOTA, imagen_portada: null, imagen_alt: '' }).puede).toBe(true)
  })
})

describe('esquemaNota', () => {
  it('acepta una nota bien formada', () => {
    expect(esquemaNota.safeParse(NOTA).success).toBe(true)
  })

  it('rechaza la imagen sin alt, con el error en el campo del alt', () => {
    const r = esquemaNota.safeParse({ ...NOTA, imagen_portada: 'foto.jpg', imagen_alt: '' })

    expect(r.success).toBe(false)
    expect(r.error?.issues[0]?.path).toEqual(['imagen_alt'])
  })

  it('convierte los opcionales vacíos en null', () => {
    const r = esquemaNota.parse({ ...NOTA, imagen_credito: '   ' })
    expect(r.imagen_credito).toBeNull()
  })

  it('rechaza una bajada en blanco', () => {
    expect(esquemaNota.safeParse({ ...NOTA, bajada: '   ' }).success).toBe(false)
  })
})

describe('redesAPostear', () => {
  it('con auto_post apagado no postea a ninguna', () => {
    expect(redesAPostear({ auto_post: false, redes: ['facebook'] })).toEqual([])
  })

  it('con auto_post prendido devuelve las elegidas', () => {
    expect(redesAPostear({ auto_post: true, redes: ['x'] })).toEqual(['x'])
  })
})
