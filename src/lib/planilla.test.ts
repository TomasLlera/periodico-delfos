import { describe, expect, it } from 'vitest'
import {
  chequearMarcador,
  enCancha,
  enElBanco,
  golesPorEquipo,
  minutoSugerido,
  minutoValido,
  type EventoParaContar,
} from './planilla'
import type { FormacionConJugadora, Jugadora, TipoEvento } from '@/types'

const ALDOSIVI = 'eq-aldosivi'
const RIVAL = 'eq-rival'

const PARTIDO = {
  equipo_local_id: ALDOSIVI,
  equipo_visitante_id: RIVAL,
  goles_local: 6,
  goles_visitante: 1,
}

function evento(
  tipo: TipoEvento,
  minuto: number,
  equipo_id: string,
  jugadora_id: string | null = null,
  jugadora_sale_id: string | null = null,
): EventoParaContar {
  return { tipo, minuto, equipo_id, jugadora_id, jugadora_sale_id }
}

function jugadora(id: string, apellido: string): Jugadora {
  return {
    id,
    nombre: 'N',
    apellido,
    slug: id,
    posicion: 'mediocampista',
    fecha_nacimiento: null,
    foto_url: null,
    lugar_origen: null,
    bio: null,
    activa: true,
  }
}

function formacion(id: string, apellido: string, es_titular: boolean): FormacionConJugadora {
  return {
    partido_id: 'p1',
    jugadora_id: id,
    es_titular,
    dorsal: null,
    posicion: null,
    jugadora: jugadora(id, apellido),
  }
}

describe('golesPorEquipo', () => {
  it('cuenta los goles de cada lado', () => {
    const eventos = [
      evento('gol', 10, ALDOSIVI),
      evento('gol', 20, ALDOSIVI),
      evento('gol_penal', 30, RIVAL),
    ]

    expect(golesPorEquipo(eventos, PARTIDO)).toEqual({ local: 2, visitante: 1 })
  })

  it('el gol en contra suma al otro equipo', () => {
    const eventos = [evento('gol_en_contra', 15, ALDOSIVI)]
    expect(golesPorEquipo(eventos, PARTIDO)).toEqual({ local: 0, visitante: 1 })
  })

  it('el penal errado no suma nada', () => {
    const eventos = [evento('penal_errado', 15, ALDOSIVI)]
    expect(golesPorEquipo(eventos, PARTIDO)).toEqual({ local: 0, visitante: 0 })
  })

  it('las tarjetas tampoco', () => {
    const eventos = [evento('amarilla', 15, ALDOSIVI), evento('roja', 80, RIVAL)]
    expect(golesPorEquipo(eventos, PARTIDO)).toEqual({ local: 0, visitante: 0 })
  })
})

describe('chequearMarcador', () => {
  it('avisa cuando falta cargar un gol', () => {
    const eventos = [evento('gol', 10, ALDOSIVI)]
    const r = chequearMarcador(PARTIDO, eventos)

    expect(r.coincide).toBe(false)
    expect(r.cargado).toEqual({ local: 1, visitante: 0 })
    expect(r.declarado).toEqual({ local: 6, visitante: 1 })
  })

  it('coincide cuando están todos', () => {
    const eventos = [
      ...Array.from({ length: 6 }, (_, i) => evento('gol', i + 1, ALDOSIVI)),
      evento('gol', 70, RIVAL),
    ]

    expect(chequearMarcador(PARTIDO, eventos).coincide).toBe(true)
  })

  it('sin resultado declarado no puede coincidir', () => {
    const sinResultado = { ...PARTIDO, goles_local: null, goles_visitante: null }
    const r = chequearMarcador(sinResultado, [evento('gol', 10, ALDOSIVI)])

    expect(r.declarado).toBeNull()
    expect(r.coincide).toBe(false)
  })
})

describe('enCancha', () => {
  const formaciones = [
    formacion('j1', 'Larea', true),
    formacion('j2', 'Gutiérrez', true),
    formacion('j3', 'Contín', false),
  ]

  it('arranca con las titulares', () => {
    expect(enCancha(formaciones, [], ALDOSIVI).map((f) => f.jugadora_id)).toEqual(['j1', 'j2'])
  })

  it('un cambio saca a una y mete a la otra', () => {
    const eventos = [evento('cambio', 60, ALDOSIVI, 'j3', 'j1')]
    const ids = enCancha(formaciones, eventos, ALDOSIVI).map((f) => f.jugadora_id)

    expect(ids).toContain('j3')
    expect(ids).not.toContain('j1')
  })

  it('una expulsada deja de estar en cancha', () => {
    const eventos = [evento('roja', 80, ALDOSIVI, 'j2')]
    expect(enCancha(formaciones, eventos, ALDOSIVI).map((f) => f.jugadora_id)).toEqual(['j1'])
  })

  it('la doble amarilla también expulsa', () => {
    const eventos = [evento('doble_amarilla', 80, ALDOSIVI, 'j2')]
    expect(enCancha(formaciones, eventos, ALDOSIVI).map((f) => f.jugadora_id)).toEqual(['j1'])
  })

  it('aplica los cambios en orden de minuto, no de carga', () => {
    // La que entró en el 60 sale en el 75: cargados al revés, tiene que dar igual.
    const eventos = [
      evento('cambio', 75, ALDOSIVI, 'j1', 'j3'),
      evento('cambio', 60, ALDOSIVI, 'j3', 'j1'),
    ]

    const ids = enCancha(formaciones, eventos, ALDOSIVI).map((f) => f.jugadora_id)
    expect(ids).toContain('j1')
    expect(ids).not.toContain('j3')
  })

  it('los eventos del rival no mueven nuestra cancha', () => {
    const eventos = [evento('roja', 80, RIVAL, 'j2')]
    expect(enCancha(formaciones, eventos, ALDOSIVI)).toHaveLength(2)
  })

  it('el banco es el resto', () => {
    expect(enElBanco(formaciones, [], ALDOSIVI).map((f) => f.jugadora_id)).toEqual(['j3'])
  })
})

describe('minutoSugerido', () => {
  it('sin eventos arranca en cero', () => {
    expect(minutoSugerido([])).toBe(0)
  })

  it('propone el último cargado, no el primero', () => {
    const eventos = [evento('gol', 12, ALDOSIVI), evento('amarilla', 38, ALDOSIVI)]
    expect(minutoSugerido(eventos)).toBe(38)
  })
})

describe('minutoValido', () => {
  it('acepta el rango del CHECK de la base', () => {
    expect(minutoValido(0)).toBe(true)
    expect(minutoValido(120)).toBe(true)
  })

  it('rechaza lo que la base rechazaría', () => {
    expect(minutoValido(-1)).toBe(false)
    expect(minutoValido(121)).toBe(false)
    expect(minutoValido(45.5)).toBe(false)
  })
})
