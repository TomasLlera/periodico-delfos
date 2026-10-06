import { describe, expect, it } from 'vitest'
import {
  chequearFechaDeArchivo,
  chequearProgramacion,
  chequearPublicacion,
  decidirPorFecha,
  cuerpoVacio,
  documentoVacio,
  entradaDesdeNota,
  esquemaNota,
  firmaDe,
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

describe('firmaDe', () => {
  it('quien escribe firma lo suyo', () => {
    expect(firmaDe({ id: 'charlie', firma_como: null })).toBe('charlie')
  })

  it('una cuenta que no es del medio firma con el titular', () => {
    expect(firmaDe({ id: 'tecnica', firma_como: 'charlie' })).toBe('charlie')
  })

  it('no sigue la cadena: firma con quien apunta y ahí termina', () => {
    // Si la cuenta apuntada a su vez apunta a otra, no se resuelve dos veces.
    // Es lo mismo que hace la base y lo que dice `0011_firma_autor.sql`: la
    // alternativa es un trigger para un caso que requiere dos updates a mano.
    expect(firmaDe({ id: 'a', firma_como: 'b' })).toBe('b')
  })
})

describe('entradaDesdeNota', () => {
  it('una nota nueva arranca en crónica y con las tres redes', () => {
    const e = entradaDesdeNota(null)

    expect(e.categoria).toBe('cronica')
    expect(e.redes).toEqual(['facebook', 'instagram', 'x'])
    expect(e.auto_post).toBe(true)
    expect(e.destacada).toBe(false)
  })

  it('una nota nueva abre con el cuerpo vacío, no sin cuerpo', () => {
    expect(entradaDesdeNota(null).cuerpo).toEqual(documentoVacio())
  })

  it('no pierde ninguno de los trece campos al abrir una guardada', () => {
    const guardada = {
      titulo: 'Tiburonas 5-1 El Frontón',
      slug: 'tiburonas-5-1-el-fronton',
      bajada: 'Goleada en el Minella.',
      cuerpo: { type: 'doc' as const, content: [{ type: 'paragraph' }] },
      imagen_portada: 'https://x.supabase.co/storage/v1/object/public/media/f.jpg',
      imagen_alt: 'El plantel festeja',
      imagen_credito: 'Charlie Redondo',
      categoria: 'cronica' as const,
      temporada_id: 'c0ffee00-0000-4000-8000-000000000002',
      partido_id: 'c0ffee00-0000-4000-8000-000000000003',
      destacada: true,
      auto_post: false,
      redes: ['x'] as const,
    }

    expect(entradaDesdeNota({ ...guardada, redes: [...guardada.redes] })).toEqual({
      ...guardada,
      redes: ['x'],
    })
  })
})

describe('chequearProgramacion', () => {
  const ahora = new Date('2026-10-01T12:00:00Z')

  it('acepta una hora con margen de sobra', () => {
    expect(chequearProgramacion('2026-10-01T18:00:00Z', ahora)).toEqual({ puede: true })
  })

  it('rechaza una hora que ya paso, que es el caso que mas va a pasar', () => {
    const r = chequearProgramacion('2026-10-01T11:59:00Z', ahora)
    expect(r.puede).toBe(false)
    expect(r.motivo).toContain('ya pasó')
  })

  it('rechaza programar adentro del intervalo del cron', () => {
    // Dentro de 3 minutos: el publicador corre cada 5, asi que esa hora miente.
    const r = chequearProgramacion('2026-10-01T12:03:00Z', ahora)
    expect(r.puede).toBe(false)
    expect(r.motivo).toContain('5')
  })

  it('acepta justo en el borde del margen', () => {
    expect(chequearProgramacion('2026-10-01T12:05:00Z', ahora).puede).toBe(true)
  })

  it('pide una fecha cuando no hay ninguna', () => {
    expect(chequearProgramacion(null, ahora).puede).toBe(false)
    expect(chequearProgramacion('cualquier cosa', ahora).puede).toBe(false)
  })
})

describe('chequearFechaDeArchivo', () => {
  const ahora = new Date('2026-10-06T12:00:00Z')

  it('acepta una fecha pasada, que es para lo que existe', () => {
    expect(chequearFechaDeArchivo('2023-05-14T18:00:00Z', ahora).puede).toBe(true)
  })

  it('rechaza el futuro y manda a programar', () => {
    const r = chequearFechaDeArchivo('2026-10-07T12:00:00Z', ahora)
    expect(r.puede).toBe(false)
    expect(r.motivo).toContain('programala')
  })

  it('rechaza un ano mal tipeado', () => {
    const r = chequearFechaDeArchivo('1026-05-14T18:00:00Z', ahora)
    expect(r.puede).toBe(false)
    expect(r.motivo).toContain('vieja')
  })

  it('rechaza lo que no es una fecha y el vacio', () => {
    expect(chequearFechaDeArchivo('cualquier cosa', ahora).puede).toBe(false)
    expect(chequearFechaDeArchivo(null, ahora).puede).toBe(false)
  })
})

describe('decidirPorFecha', () => {
  const ahora = new Date('2026-10-06T12:00:00Z')

  it('sin fecha, publica ahora', () => {
    expect(decidirPorFecha(null, ahora)).toEqual({ modo: 'ahora' })
    expect(decidirPorFecha('', ahora)).toEqual({ modo: 'ahora' })
  })

  it('con fecha futura, programa', () => {
    expect(decidirPorFecha('2026-10-06T18:00:00Z', ahora)).toEqual({
      modo: 'programar',
      iso: '2026-10-06T18:00:00Z',
    })
  })

  /** Es lo que le paso a Charlie: fecha vieja en el campo de programar. */
  it('con fecha pasada, archiva en vez de rebotar', () => {
    expect(decidirPorFecha('2023-05-14T18:00:00Z', ahora)).toEqual({
      modo: 'archivo',
      iso: '2023-05-14T18:00:00Z',
    })
  })

  /** El margen de cinco minutos del cron sigue valiendo para el futuro. */
  it('un futuro demasiado cerca no se puede programar', () => {
    const r = decidirPorFecha('2026-10-06T12:02:00Z', ahora)
    expect(r.modo).toBe('ninguno')
  })

  it('una fecha ilegible no decide nada', () => {
    expect(decidirPorFecha('ayer', ahora).modo).toBe('ninguno')
  })
})
