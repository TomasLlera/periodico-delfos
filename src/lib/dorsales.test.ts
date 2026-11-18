import { describe, expect, it } from 'vitest'
import {
  dorsalesDistintos,
  dorsalesPorJugadora,
  resumenDeUsos,
  type UsoCrudo,
} from './dorsales'

function uso(apellido: string, dorsal: number | null): UsoCrudo {
  return {
    jugadora_id: apellido.toLowerCase(),
    nombre: 'N',
    apellido,
    slug: apellido.toLowerCase(),
    dorsal,
  }
}

describe('dorsalesPorJugadora', () => {
  it('cuenta cuántas veces usó cada número', () => {
    const filas = dorsalesPorJugadora([
      uso('Cortadi', 10),
      uso('Cortadi', 10),
      uso('Cortadi', 16),
    ])

    expect(filas).toHaveLength(1)
    expect(filas[0].usos).toEqual([
      { dorsal: 10, veces: 2 },
      { dorsal: 16, veces: 1 },
    ])
  })

  it('cuenta los partidos en los que entró, con número o sin él', () => {
    const filas = dorsalesPorJugadora([uso('Garro', 7), uso('Garro', null), uso('Garro', 7)])

    expect(filas[0].partidos).toBe(3)
    expect(filas[0].sinDorsal).toBe(1)
  })

  /**
   * Las planillas anteriores a la `0020` se cargaron sin dorsales. Un `null`
   * contado como número sería un dato inventado.
   */
  it('la convocatoria sin número no genera un dorsal', () => {
    const filas = dorsalesPorJugadora([uso('Vera', null)])

    expect(filas[0].usos).toEqual([])
    expect(filas[0].sinDorsal).toBe(1)
  })

  it('a igual cantidad de partidos, primero el número más bajo', () => {
    const filas = dorsalesPorJugadora([uso('Díaz', 23), uso('Díaz', 4)])

    expect(filas[0].usos.map((u) => u.dorsal)).toEqual([4, 23])
  })

  it('ordena la tabla por el número con el que se la reconoce', () => {
    const filas = dorsalesPorJugadora([
      uso('Cortadi', 10),
      uso('Aguirre', 1),
      uso('Sosa', 5),
    ])

    expect(filas.map((f) => f.apellido)).toEqual(['Aguirre', 'Sosa', 'Cortadi'])
  })

  it('las que nunca tuvieron número van al final, no al principio', () => {
    const filas = dorsalesPorJugadora([uso('Vera', null), uso('Cortadi', 10)])

    expect(filas.map((f) => f.apellido)).toEqual(['Cortadi', 'Vera'])
  })

  it('sin formaciones cargadas devuelve la lista vacía', () => {
    expect(dorsalesPorJugadora([])).toEqual([])
  })
})

describe('dorsalesDistintos', () => {
  it('no cuenta dos veces el número que compartieron dos jugadoras', () => {
    // Legal: la regla de la `0020` es por partido, y la 4 puede pasar de una
    // jugadora a otra a mitad de temporada.
    const filas = dorsalesPorJugadora([uso('Díaz', 4), uso('Sosa', 4), uso('Vera', 9)])

    expect(dorsalesDistintos(filas)).toBe(2)
  })

  it('sin números registrados da cero', () => {
    expect(dorsalesDistintos(dorsalesPorJugadora([uso('Vera', null)]))).toBe(0)
  })
})

describe('resumenDeUsos', () => {
  it('pone el singular cuando fue un solo partido', () => {
    expect(resumenDeUsos([{ dorsal: 16, veces: 1 }])).toBe('16 en 1 partido')
  })

  it('encadena los números con punto medio', () => {
    expect(
      resumenDeUsos([
        { dorsal: 10, veces: 5 },
        { dorsal: 16, veces: 1 },
      ]),
    ).toBe('10 en 5 partidos · 16 en 1 partido')
  })

  it('lo dice cuando no hay ningún número', () => {
    expect(resumenDeUsos([])).toBe('Sin dorsal registrado')
  })
})
