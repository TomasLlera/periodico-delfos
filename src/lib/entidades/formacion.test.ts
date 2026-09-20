import { describe, expect, it } from 'vitest'
import {
  avisosDeFormacion,
  contar,
  filasDeConvocatoria,
  filasParaGuardar,
  type FilaConvocatoria,
} from './formacion'
import type { FormacionConJugadora, Jugadora, JugadoraEnPlantel } from '@/types'

function jugadora(id: string, apellido: string): Jugadora {
  return {
    id,
    nombre: 'N',
    apellido,
    slug: apellido.toLowerCase(),
    posicion: 'mediocampista',
    fecha_nacimiento: null,
    foto_url: null,
    lugar_origen: null,
    bio: null,
    activa: true,
  }
}

function enPlantel(id: string, apellido: string, dorsal: number | null): JugadoraEnPlantel {
  return { ...jugadora(id, apellido), dorsal, posicion_temporada: 'delantera', capitana: false }
}

function enFormacion(
  id: string,
  apellido: string,
  es_titular: boolean,
  dorsal: number | null,
): FormacionConJugadora {
  return {
    partido_id: 'p',
    jugadora_id: id,
    es_titular,
    dorsal,
    posicion: 'arquera',
    jugadora: jugadora(id, apellido),
  }
}

const A = '0e5f7a10-0000-4000-8000-0000000000a1'
const B = '0e5f7a10-0000-4000-8000-0000000000a2'
const C = '0e5f7a10-0000-4000-8000-0000000000a3'

describe('filasDeConvocatoria', () => {
  const plantel = [enPlantel(A, 'Aguirre', 1), enPlantel(B, 'Cortadi', 10)]

  it('sin formación guardada, nadie está convocada todavía', () => {
    const filas = filasDeConvocatoria(plantel, [])
    expect(filas.map((f) => f.convocatoria)).toEqual(['fuera', 'fuera'])
  })

  it('toma el dorsal y el puesto del plantel cuando no hay formación', () => {
    const filas = filasDeConvocatoria(plantel, [])
    expect(filas[0].dorsal).toBe(1)
    expect(filas[0].posicion).toBe('delantera')
  })

  it('lo guardado en la formación le gana al plantel: es lo que jugó ese día', () => {
    const filas = filasDeConvocatoria(plantel, [enFormacion(A, 'Aguirre', true, 12)])
    const aguirre = filas.find((f) => f.jugadora_id === A)
    expect(aguirre?.convocatoria).toBe('titular')
    expect(aguirre?.dorsal).toBe(12)
    expect(aguirre?.posicion).toBe('arquera')
  })

  /**
   * El caso que justifica el merge: alguien que jugó y después se fue del
   * plantel. Esconderla la borraría de la planilla del partido que sí jugó.
   */
  it('no pierde a la que jugó pero ya no está en el plantel', () => {
    const filas = filasDeConvocatoria(plantel, [enFormacion(C, 'Zapata', true, 7)])
    const zapata = filas.find((f) => f.jugadora_id === C)
    expect(zapata?.fueraDelPlantel).toBe(true)
    expect(zapata?.convocatoria).toBe('titular')
  })

  it('pone a las convocadas arriba y el resto por apellido', () => {
    const filas = filasDeConvocatoria(plantel, [enFormacion(B, 'Cortadi', true, 10)])
    expect(filas.map((f) => f.apellido)).toEqual(['Cortadi', 'Aguirre'])
  })
})

describe('filasParaGuardar', () => {
  const filas: FilaConvocatoria[] = [
    { jugadora_id: A, apellido: 'Aguirre', nombre: 'N', dorsal: 1, posicion: 'arquera', convocatoria: 'titular', fueraDelPlantel: false },
    { jugadora_id: B, apellido: 'Cortadi', nombre: 'N', dorsal: 10, posicion: 'delantera', convocatoria: 'suplente', fueraDelPlantel: false },
    { jugadora_id: C, apellido: 'Zapata', nombre: 'N', dorsal: 7, posicion: null, convocatoria: 'fuera', fueraDelPlantel: false },
  ]

  it('las que no fueron convocadas no van a la base', () => {
    expect(filasParaGuardar(filas)).toHaveLength(2)
  })

  it('traduce la convocatoria a es_titular', () => {
    const guardadas = filasParaGuardar(filas)
    expect(guardadas[0]).toEqual({ jugadora_id: A, es_titular: true, dorsal: 1, posicion: 'arquera' })
    expect(guardadas[1].es_titular).toBe(false)
  })

  it('cuenta las de cada lugar', () => {
    expect(contar(filas, 'titular')).toBe(1)
    expect(contar(filas, 'fuera')).toBe(1)
  })
})

describe('avisosDeFormacion', () => {
  function fila(id: string, convocatoria: FilaConvocatoria['convocatoria'], dorsal: number | null = 5): FilaConvocatoria {
    return { jugadora_id: id, apellido: 'A', nombre: 'N', dorsal, posicion: null, convocatoria, fueraDelPlantel: false }
  }

  const once = Array.from({ length: 11 }, (_, i) => fila(`id-${i}`, 'titular'))

  it('once titulares con dorsal no tienen nada raro', () => {
    expect(avisosDeFormacion(once)).toEqual([])
  })

  it('avisa fuerte cuando no hay ninguna: la planilla no serviría', () => {
    expect(avisosDeFormacion([fila('x', 'suplente')])[0]).toContain('grilla vacía')
  })

  it('avisa si faltan titulares', () => {
    expect(avisosDeFormacion(once.slice(0, 10))[0]).toContain('10 titulares')
  })

  it('avisa de las convocadas sin dorsal y dice dónde se arregla', () => {
    const avisos = avisosDeFormacion([...once.slice(0, 10), fila('y', 'titular', null)])
    expect(avisos.some((a) => a.includes('sin dorsal'))).toBe(true)
  })

  it('no mira el dorsal de las que no fueron convocadas', () => {
    expect(avisosDeFormacion([...once, fila('z', 'fuera', null)])).toEqual([])
  })
})
