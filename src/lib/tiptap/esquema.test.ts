import { describe, expect, it } from 'vitest'
import {
  ATRIBUTOS_IMAGEN,
  ATRIBUTOS_PLANILLA,
  atributosImagen,
  esExterno,
  hrefDeMarcas,
  hrefSeguro,
  inicioDeLista,
  nivelDeTitulo,
  parsearDocumento,
  partidoIdDeNodo,
  partidoIdsDelCuerpo,
  tieneMarca,
} from '@/lib/tiptap/esquema'

// ============================================
// Forma del documento
// ============================================

describe('parsearDocumento', () => {
  it('acepta un documento vacío', () => {
    expect(parsearDocumento({ type: 'doc' })).toEqual({ type: 'doc' })
  })

  it('acepta un documento con párrafos, marcas y anidado', () => {
    const documento = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Aldosivi ganó ' },
            { type: 'text', text: '2 a 1', marks: [{ type: 'bold' }] },
          ],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Cortadi' }] }],
            },
          ],
        },
      ],
    }

    expect(parsearDocumento(documento)).toEqual(documento)
  })

  it('acepta nodos desconocidos: el renderer los descarta, el documento no se cae', () => {
    const documento = {
      type: 'doc',
      content: [
        { type: 'extensionQueYaNoExiste', attrs: { loQueSea: 1 } },
        { type: 'paragraph', content: [{ type: 'text', text: 'Esto sí se lee.' }] },
      ],
    }

    expect(parsearDocumento(documento)?.content).toHaveLength(2)
  })

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['un string', '<p>HTML de WordPress</p>'],
    ['un número', 42],
    ['un array', [{ type: 'paragraph' }]],
    ['un objeto sin type', { content: [] }],
    ['un nodo que no es doc', { type: 'paragraph', content: [] }],
    ['content que no es array', { type: 'doc', content: { type: 'paragraph' } }],
    ['un nodo sin type adentro', { type: 'doc', content: [{ text: 'suelto' }] }],
    ['un type que no es string', { type: 'doc', content: [{ type: 7 }] }],
    ['text que no es string', { type: 'doc', content: [{ type: 'text', text: 7 }] }],
    ['marks que no es array', { type: 'doc', content: [{ type: 'text', marks: 'bold' }] }],
  ])('rechaza %s', (_caso, valor) => {
    expect(parsearDocumento(valor)).toBeNull()
  })

  it('no explota con un documento absurdamente anidado', () => {
    let nodo: Record<string, unknown> = { type: 'text', text: 'fondo' }
    for (let i = 0; i < 2000; i++) {
      nodo = { type: 'blockquote', content: [nodo] }
    }

    expect(() => parsearDocumento({ type: 'doc', content: [nodo] })).not.toThrow()
  })
})

// ============================================
// Links
// ============================================

describe('hrefSeguro', () => {
  it.each([
    'https://www.periodicodelfos.com/nota/aldosivi-all-boys',
    'http://ejemplo.com.ar/algo?a=1&b=2#ancla',
    'mailto:redaccion@periodicodelfos.com',
    '/nota/fecha-11-aldosivi-all-boys',
    '/jugadora/lucia-cortadi',
    '#formaciones',
  ])('deja pasar %s', (href) => {
    expect(hrefSeguro(href)).toBe(href)
  })

  it.each([
    ['javascript', 'javascript:alert(1)'],
    ['javascript en mayúsculas', 'JavaScript:alert(1)'],
    ['javascript con espacios adelante', '   javascript:alert(1)'],
    ['javascript partido con un salto de línea', 'java\nscript:alert(1)'],
    ['javascript partido con un tab', 'java\tscript:alert(1)'],
    ['data', 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='],
    ['vbscript', 'vbscript:msgbox(1)'],
    ['file', 'file:///etc/passwd'],
    ['ftp', 'ftp://ejemplo.com/archivo.zip'],
    ['protocolo relativo', '//evil.example/pagina'],
    ['string vacío', ''],
    ['sólo espacios', '   '],
  ])('bloquea %s', (_caso, href) => {
    expect(hrefSeguro(href)).toBeNull()
  })

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['un número', 12],
    ['un objeto', { href: 'https://ejemplo.com' }],
  ])('bloquea %s, que ni siquiera es un string', (_caso, valor) => {
    expect(hrefSeguro(valor)).toBeNull()
  })

  it('normaliza los espacios de los bordes', () => {
    expect(hrefSeguro('  https://ejemplo.com/a  ')).toBe('https://ejemplo.com/a')
  })
})

describe('esExterno', () => {
  it('marca como externo lo que sale del sitio', () => {
    expect(esExterno('https://ejemplo.com')).toBe(true)
    expect(esExterno('http://ejemplo.com')).toBe(true)
  })

  it('no marca como externas las rutas internas ni los mails', () => {
    expect(esExterno('/nota/algo')).toBe(false)
    expect(esExterno('#ancla')).toBe(false)
    expect(esExterno('mailto:redaccion@periodicodelfos.com')).toBe(false)
  })
})

describe('hrefDeMarcas', () => {
  it('encuentra el href de la marca link', () => {
    const marcas = [{ type: 'bold' }, { type: 'link', attrs: { href: '/nota/x' } }]
    expect(hrefDeMarcas(marcas)).toBe('/nota/x')
  })

  it('devuelve null si el href de la marca no pasa el filtro', () => {
    const marcas = [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }]
    expect(hrefDeMarcas(marcas)).toBeNull()
  })

  it('devuelve null si la marca link no trae href', () => {
    expect(hrefDeMarcas([{ type: 'link' }])).toBeNull()
    expect(hrefDeMarcas([{ type: 'link', attrs: {} }])).toBeNull()
  })

  it('devuelve null cuando no hay marcas', () => {
    expect(hrefDeMarcas(undefined)).toBeNull()
    expect(hrefDeMarcas([{ type: 'italic' }])).toBeNull()
  })
})

describe('tieneMarca', () => {
  it('reconoce las marcas presentes y descarta el resto', () => {
    const marcas = [{ type: 'bold' }, { type: 'code' }]
    expect(tieneMarca(marcas, 'bold')).toBe(true)
    expect(tieneMarca(marcas, 'code')).toBe(true)
    expect(tieneMarca(marcas, 'italic')).toBe(false)
    expect(tieneMarca(undefined, 'bold')).toBe(false)
  })
})

// ============================================
// Nodos propios
// ============================================

describe('atributosImagen', () => {
  it('acepta una imagen completa', () => {
    expect(
      atributosImagen({
        src: 'https://proyecto.supabase.co/storage/v1/object/public/media/gol.jpg',
        alt: 'Cortadi festeja el gol con la tribuna de fondo',
        epigrafe: 'El 1 a 0 a los 23 minutos',
        credito: 'Foto: Charlie Redondo',
      }),
    ).toEqual({
      src: 'https://proyecto.supabase.co/storage/v1/object/public/media/gol.jpg',
      alt: 'Cortadi festeja el gol con la tribuna de fondo',
      epigrafe: 'El 1 a 0 a los 23 minutos',
      credito: 'Foto: Charlie Redondo',
    })
  })

  it('normaliza a null el epígrafe y el crédito ausentes o vacíos', () => {
    expect(
      atributosImagen({ src: 'https://a.co/b.jpg', alt: 'Un alt', epigrafe: '   ' }),
    ).toEqual({ src: 'https://a.co/b.jpg', alt: 'Un alt', epigrafe: null, credito: null })
  })

  it('un epígrafe roto degrada a null y no se lleva la imagen puesta', () => {
    expect(
      atributosImagen({ src: 'https://a.co/b.jpg', alt: 'Un alt', epigrafe: 42, credito: null }),
    ).toEqual({ src: 'https://a.co/b.jpg', alt: 'Un alt', epigrafe: null, credito: null })
  })

  it.each([
    ['sin alt', { src: 'https://a.co/b.jpg' }],
    ['con alt vacío', { src: 'https://a.co/b.jpg', alt: '' }],
    ['con alt de puros espacios', { src: 'https://a.co/b.jpg', alt: '   ' }],
    ['con alt que no es string', { src: 'https://a.co/b.jpg', alt: 3 }],
  ])('descarta una imagen %s: regla no negociable 4', (_caso, attrs) => {
    expect(atributosImagen(attrs)).toBeNull()
  })

  it.each([
    ['sin src', { alt: 'Un alt' }],
    ['con src vacío', { src: '', alt: 'Un alt' }],
    ['con src javascript:', { src: 'javascript:alert(1)', alt: 'Un alt' }],
    ['con src data:', { src: 'data:image/svg+xml,<svg onload=alert(1)>', alt: 'Un alt' }],
    ['con src protocolo-relativo', { src: '//evil.example/x.jpg', alt: 'Un alt' }],
    ['sin attrs', undefined],
    ['con attrs null', null],
  ])('descarta una imagen %s', (_caso, attrs) => {
    expect(atributosImagen(attrs)).toBeNull()
  })
})

describe('partidoIdDeNodo', () => {
  it('devuelve el id del partido', () => {
    expect(partidoIdDeNodo({ partidoId: 'par-fecha-11' })).toBe('par-fecha-11')
  })

  it.each([
    ['attrs vacíos', {}],
    ['id vacío', { partidoId: '' }],
    ['id que no es string', { partidoId: 11 }],
    ['sin attrs', undefined],
    ['la clave equivocada', { partido_id: 'par-fecha-11' }],
  ])('devuelve null con %s', (_caso, attrs) => {
    expect(partidoIdDeNodo(attrs)).toBeNull()
  })
})

// ============================================
// Atributos de bloque
// ============================================

describe('nivelDeTitulo', () => {
  it('acota los niveles al rango 2–3', () => {
    expect(nivelDeTitulo({ level: 1 })).toBe(2)
    expect(nivelDeTitulo({ level: 2 })).toBe(2)
    expect(nivelDeTitulo({ level: 3 })).toBe(3)
    expect(nivelDeTitulo({ level: 6 })).toBe(3)
  })

  it('cae en 2 cuando el nivel falta o no es un número', () => {
    expect(nivelDeTitulo({})).toBe(2)
    expect(nivelDeTitulo(undefined)).toBe(2)
    expect(nivelDeTitulo({ level: '3' })).toBe(2)
  })
})

describe('inicioDeLista', () => {
  it('devuelve el start cuando la lista no arranca en 1', () => {
    expect(inicioDeLista({ start: 5 })).toBe(5)
  })

  it('omite el start por omisión y los valores inválidos', () => {
    expect(inicioDeLista({ start: 1 })).toBeUndefined()
    expect(inicioDeLista({})).toBeUndefined()
    expect(inicioDeLista(undefined)).toBeUndefined()
    expect(inicioDeLista({ start: '3' })).toBeUndefined()
    expect(inicioDeLista({ start: 2.5 })).toBeUndefined()
  })
})

describe('partidoIdsDelCuerpo', () => {
  const planilla = (partidoId: unknown) => ({ type: 'planilla', attrs: { partidoId } })

  it('junta los ids de las planillas embebidas, sin repetir', () => {
    const cuerpo = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Hola' }] },
        planilla('p-1'),
        planilla('p-2'),
        planilla('p-1'),
      ],
    }

    expect(partidoIdsDelCuerpo(cuerpo)).toEqual(['p-1', 'p-2'])
  })

  it('encuentra una planilla anidada adentro de otro nodo', () => {
    const cuerpo = {
      type: 'doc',
      content: [
        { type: 'blockquote', content: [planilla('p-hondo')] },
      ],
    }

    expect(partidoIdsDelCuerpo(cuerpo)).toEqual(['p-hondo'])
  })

  it('ignora las planillas sin un partidoId usable', () => {
    const cuerpo = {
      type: 'doc',
      content: [planilla(''), planilla(null), { type: 'planilla' }, planilla('p-ok')],
    }

    expect(partidoIdsDelCuerpo(cuerpo)).toEqual(['p-ok'])
  })

  it('devuelve una lista vacía si el cuerpo no es un documento', () => {
    expect(partidoIdsDelCuerpo('<p>WordPress</p>')).toEqual([])
    expect(partidoIdsDelCuerpo(null)).toEqual([])
    expect(partidoIdsDelCuerpo({ type: 'doc' })).toEqual([])
  })

  it('no se cuelga con un documento absurdamente anidado', () => {
    let nodo: Record<string, unknown> = planilla('p-fondo')
    for (let i = 0; i < 400; i += 1) nodo = { type: 'blockquote', content: [nodo] }

    expect(() => partidoIdsDelCuerpo({ type: 'doc', content: [nodo] })).not.toThrow()
  })
})

/**
 * El contrato de los nodos propios, mirado desde los dos lados.
 *
 * `extensiones.tsx` arma sus `addAttributes()` con estas constantes, así que si
 * alguien le agrega un atributo al editor sin enseñárselo al validador, o le
 * cambia el nombre a uno, esto se cae acá y no en una nota publicada sin pie
 * de foto.
 */
describe('el contrato de atributos de los nodos propios', () => {
  it('un nodo imagen armado con los atributos del contrato pasa la validación', () => {
    const attrs = {
      ...ATRIBUTOS_IMAGEN,
      src: 'https://ejemplo.supabase.co/media/foto.webp',
      alt: 'Las jugadoras festejando el gol',
    }

    const imagen = atributosImagen(attrs)
    expect(imagen).not.toBeNull()
    expect(imagen?.alt).toBe('Las jugadoras festejando el gol')
  })

  it('el epígrafe y el crédito nacen en null y siguen siendo opcionales', () => {
    expect(ATRIBUTOS_IMAGEN.epigrafe).toBe(null)
    expect(ATRIBUTOS_IMAGEN.credito).toBe(null)

    const imagen = atributosImagen({
      ...ATRIBUTOS_IMAGEN,
      src: 'https://ejemplo.supabase.co/media/foto.webp',
      alt: 'Algo',
    })
    expect(imagen?.epigrafe).toBe(null)
  })

  /**
   * El nodo recién insertado nace con `alt: ''` porque TipTap necesita un
   * default. El que no lo deja publicar es esto.
   */
  it('una imagen recién insertada, sin alt todavía, no se renderiza', () => {
    expect(
      atributosImagen({ ...ATRIBUTOS_IMAGEN, src: 'https://ejemplo.supabase.co/media/f.webp' }),
    ).toBe(null)
  })

  it('un nodo planilla armado con el contrato devuelve su partidoId', () => {
    const attrs = { ...ATRIBUTOS_PLANILLA, partidoId: '0e5f7a10-0000-4000-8000-000000000001' }
    expect(partidoIdDeNodo(attrs)).toBe('0e5f7a10-0000-4000-8000-000000000001')
  })

  it('una planilla sin partido elegido no se renderiza', () => {
    expect(partidoIdDeNodo({ ...ATRIBUTOS_PLANILLA })).toBe(null)
  })

  it('el cuerpo junta los partidos de las planillas que insertó el editor', () => {
    const cuerpo = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'El primer tiempo.' }] },
        { type: 'planilla', attrs: { ...ATRIBUTOS_PLANILLA, partidoId: 'p-1' } },
      ],
    }
    expect(partidoIdsDelCuerpo(cuerpo)).toEqual(['p-1'])
  })
})
