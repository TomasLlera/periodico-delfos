import { describe, expect, it } from 'vitest'
import {
  ANIO_MINIMO,
  anioMaximo,
  avisoDeActiva,
  entradaDesdeTemporada,
  esquemaTemporada,
  nombreDeTemporada,
  slugDeTemporada,
} from './temporada'
import type { Temporada } from '@/types'

const PRIMERA_B: Temporada = {
  id: '33333333-3333-3333-3333-333333333333',
  nombre: 'Primera B 2026',
  slug: 'primera-b-2026',
  division: 'Primera B',
  anio: 2026,
  zona: 'Zona B',
  activa: true,
  created_at: '2026-01-10T12:00:00.000Z',
}

describe('slugDeTemporada', () => {
  it('junta división y año', () => {
    expect(slugDeTemporada('Primera B', 2026)).toBe('primera-b-2026')
  })

  it('no deja un slug que arranque con guión si la división está vacía', () => {
    expect(slugDeTemporada('  ', 2026)).toBe('2026')
  })
})

describe('nombreDeTemporada', () => {
  it('es lo que se lee en cualquier select del panel', () => {
    expect(nombreDeTemporada('Primera B', 2026)).toBe('Primera B 2026')
  })
})

describe('esquemaTemporada', () => {
  const valida = {
    nombre: 'Primera B 2026',
    slug: 'primera-b-2026',
    division: 'Primera B',
    anio: 2026,
    zona: '',
    activa: false,
  }

  it('acepta una temporada completa', () => {
    expect(esquemaTemporada.safeParse(valida).success).toBe(true)
  })

  it('la zona es opcional y entra como null', () => {
    expect(esquemaTemporada.parse(valida).zona).toBe(null)
  })

  it('un año de dos dígitos es un error de tipeo, no una temporada', () => {
    expect(esquemaTemporada.safeParse({ ...valida, anio: 26 }).success).toBe(false)
  })

  it('exige la división: es la mitad del slug', () => {
    expect(esquemaTemporada.safeParse({ ...valida, division: '' }).success).toBe(false)
  })
})

describe('anioMaximo', () => {
  it('llega hasta el año que viene, que es hasta donde se programa', () => {
    expect(anioMaximo(new Date('2026-09-20T12:00:00.000Z'))).toBe(2027)
  })

  it('el piso no se mueve', () => {
    expect(ANIO_MINIMO).toBe(2015)
  })
})

describe('entradaDesdeTemporada', () => {
  it('una temporada nueva arranca en el año en curso y sin activar', () => {
    const entrada = entradaDesdeTemporada(null, new Date('2026-09-20T12:00:00.000Z'))
    expect(entrada.anio).toBe(2026)
    expect(entrada.activa).toBe(false)
  })

  it('no pierde ningún campo de la guardada', () => {
    const entrada = entradaDesdeTemporada(PRIMERA_B, new Date('2026-09-20T12:00:00.000Z'))
    expect(entrada).toEqual({
      nombre: 'Primera B 2026',
      slug: 'primera-b-2026',
      division: 'Primera B',
      anio: 2026,
      zona: 'Zona B',
      activa: true,
    })
  })
})

describe('avisoDeActiva', () => {
  it('dice cuál se apaga', () => {
    expect(avisoDeActiva({ activa: true }, PRIMERA_B, null)).toContain(
      'Primera B 2026 deja de estar activa',
    )
  })

  it('no avisa si la que se edita ya era la activa', () => {
    expect(avisoDeActiva({ activa: true }, PRIMERA_B, PRIMERA_B.id)).toBe(null)
  })

  it('no avisa en una base sin ninguna temporada activa', () => {
    expect(avisoDeActiva({ activa: true }, null, null)).toBe(null)
  })
})
