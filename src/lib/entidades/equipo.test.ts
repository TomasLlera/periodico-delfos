import { describe, expect, it } from 'vitest'
import { avisoDeAldosivi, entradaDesdeEquipo, esquemaEquipo, slugDeEquipo } from './equipo'
import type { Equipo } from '@/types'

const CLAYPOLE: Equipo = {
  id: '11111111-1111-1111-1111-111111111111',
  nombre: 'Club Social y Deportivo Claypole',
  nombre_corto: 'Claypole',
  apodo: 'El Tambero',
  slug: 'claypole',
  escudo_url: null,
  ciudad: 'Claypole',
  es_aldosivi: false,
}

describe('slugDeEquipo', () => {
  it('sale del nombre corto, que es el que se lee en la URL', () => {
    expect(slugDeEquipo('Aldosivi')).toBe('aldosivi')
  })

  it('aguanta los nombres con acento', () => {
    expect(slugDeEquipo('Atlético Sarmiento')).toBe('atletico-sarmiento')
  })
})

describe('esquemaEquipo', () => {
  const valido = {
    nombre: 'Club Atlético Aldosivi',
    nombre_corto: 'Aldosivi',
    apodo: 'Tiburonas',
    slug: 'aldosivi',
    escudo_url: '',
    ciudad: 'Mar del Plata',
    es_aldosivi: true,
  }

  it('acepta un equipo completo', () => {
    const r = esquemaEquipo.safeParse(valido)
    expect(r.success).toBe(true)
  })

  it('el escudo vacío entra como null y no como cadena vacía', () => {
    const r = esquemaEquipo.parse(valido)
    expect(r.escudo_url).toBe(null)
  })

  it('exige el nombre corto: es el que se usa en todas partes', () => {
    const r = esquemaEquipo.safeParse({ ...valido, nombre_corto: '  ' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe('El nombre corto no puede quedar vacío')
  })
})

describe('entradaDesdeEquipo', () => {
  it('un equipo nuevo arranca como rival, que es el caso normal', () => {
    expect(entradaDesdeEquipo(null).es_aldosivi).toBe(false)
  })

  it('no pierde ningún campo del equipo guardado', () => {
    const entrada = entradaDesdeEquipo(CLAYPOLE)
    expect(entrada).toEqual({
      nombre: 'Club Social y Deportivo Claypole',
      nombre_corto: 'Claypole',
      apodo: 'El Tambero',
      slug: 'claypole',
      escudo_url: null,
      ciudad: 'Claypole',
      es_aldosivi: false,
    })
  })
})

describe('avisoDeAldosivi', () => {
  const aldosivi = { id: '22222222-2222-2222-2222-222222222222', nombre_corto: 'Aldosivi' }

  it('avisa cuando otro equipo pasa a ser el propio', () => {
    expect(avisoDeAldosivi({ es_aldosivi: true }, aldosivi, CLAYPOLE.id)).toContain(
      'Aldosivi deja de serlo',
    )
  })

  /**
   * El caso que importa: el equipo todavía no existe, así que mirando su
   * propia fila no hay nada que avisar, y sin embargo al guardarlo le saca la
   * marca a Aldosivi.
   */
  it('avisa también cuando el equipo nuevo se marca como propio', () => {
    expect(avisoDeAldosivi({ es_aldosivi: true }, aldosivi, null)).toContain('deja de serlo')
  })

  it('no avisa si el que se edita ya era el propio', () => {
    expect(avisoDeAldosivi({ es_aldosivi: true }, aldosivi, aldosivi.id)).toBe(null)
  })

  it('no avisa si todavía no hay ningún equipo propio', () => {
    expect(avisoDeAldosivi({ es_aldosivi: true }, null, null)).toBe(null)
  })

  it('no avisa al desmarcar', () => {
    expect(avisoDeAldosivi({ es_aldosivi: false }, aldosivi, CLAYPOLE.id)).toBe(null)
  })
})
