import { describe, expect, it } from 'vitest'
import {
  avisosDeFormacion,
  contar,
  dorsalesRepetidos,
  erroresDeFormacion,
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
    equipo_id: 'eq-aldosivi',
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

  // Con un dorsal distinto cada una: once jugadoras con el 5 no es una
  // formación, es el caso de error que prueba `erroresDeFormacion`.
  const once = Array.from({ length: 11 }, (_, i) => fila(`id-${i}`, 'titular', i + 1))

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

  /**
   * El dorsal dejó de vivir en `plantel` con la `0020`. El aviso que mandaba a
   * esa pantalla mandaba a un lugar donde ya no hay nada que tocar.
   */
  it('el aviso de sin dorsal manda a esta lista y no al plantel', () => {
    const aviso = avisosDeFormacion([fila('y', 'titular', null)]).find((a) =>
      a.includes('sin dorsal'),
    )
    expect(aviso).toContain('esta misma lista')
    expect(aviso).not.toContain('plantel')
  })

  it('no mira el dorsal de las que no fueron convocadas', () => {
    expect(avisosDeFormacion([...once, fila('z', 'fuera', null)])).toEqual([])
  })
})

describe('erroresDeFormacion', () => {
  function fila(
    id: string,
    convocatoria: FilaConvocatoria['convocatoria'],
    dorsal: number | null,
  ): FilaConvocatoria {
    return { jugadora_id: id, apellido: 'A', nombre: 'N', dorsal, posicion: null, convocatoria, fueraDelPlantel: false }
  }

  it('una formación con números distintos no tiene errores', () => {
    expect(erroresDeFormacion([fila('a', 'titular', 1), fila('b', 'suplente', 12)])).toEqual([])
  })

  /**
   * Es lo que rechaza `formaciones_dorsal_unico_idx`, y llegar hasta la base
   * con esto cuesta la formación entera: `guardarFormacion()` borra antes de
   * insertar.
   */
  it('dos jugadoras con el mismo número frenan el guardado', () => {
    const errores = erroresDeFormacion([fila('a', 'titular', 10), fila('b', 'titular', 10)])
    expect(errores).toHaveLength(1)
    expect(errores[0]).toContain('10')
  })

  it('una titular y una suplente también chocan: es el mismo partido', () => {
    expect(erroresDeFormacion([fila('a', 'titular', 7), fila('b', 'suplente', 7)])).toHaveLength(1)
  })

  it('la que quedó fuera no choca con nadie: su número no se guarda', () => {
    expect(erroresDeFormacion([fila('a', 'titular', 7), fila('b', 'fuera', 7)])).toEqual([])
  })

  it('dos sin número no son un número repetido', () => {
    expect(erroresDeFormacion([fila('a', 'titular', null), fila('b', 'titular', null)])).toEqual([])
  })

  it('nombra todos los números repetidos, ordenados', () => {
    const errores = erroresDeFormacion([
      fila('a', 'titular', 9),
      fila('b', 'titular', 9),
      fila('c', 'titular', 4),
      fila('d', 'suplente', 4),
    ])
    expect(errores[0]).toContain('4, 9')
  })

  it('el dorsal fuera de rango también frena: lo rechaza el CHECK', () => {
    expect(erroresDeFormacion([fila('a', 'titular', 0)])[0]).toContain('1 a 99')
    expect(erroresDeFormacion([fila('a', 'titular', 100)])[0]).toContain('1 a 99')
  })
})

describe('dorsalesRepetidos', () => {
  function fila(id: string, dorsal: number | null): FilaConvocatoria {
    return { jugadora_id: id, apellido: 'A', nombre: 'N', dorsal, posicion: null, convocatoria: 'titular', fueraDelPlantel: false }
  }

  it('devuelve sólo los que están dos veces', () => {
    expect(dorsalesRepetidos([fila('a', 1), fila('b', 1), fila('c', 2)])).toEqual([1])
  })

  it('sin repetidos devuelve la lista vacía', () => {
    expect(dorsalesRepetidos([fila('a', 1), fila('b', 2)])).toEqual([])
  })
})
