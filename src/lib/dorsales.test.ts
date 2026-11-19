import { describe, expect, it } from 'vitest'
import {
  conDatosCargados,
  conPlantelCompleto,
  dorsalesDistintos,
  dorsalesPorJugadora,
  resumenDeFila,
  resumenDeUsos,
  type DorsalesDeJugadora,
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

describe('conPlantelCompleto', () => {
  const jugo = (id: string, apellido: string, dorsal: number): DorsalesDeJugadora => ({
    jugadora_id: id,
    nombre: 'N',
    apellido,
    slug: id,
    usos: [{ dorsal, veces: 3 }],
    partidos: 3,
    sinDorsal: 0,
  })

  const enPlantel = (id: string, apellido: string) => ({
    jugadora_id: id,
    nombre: 'N',
    apellido,
    slug: id,
  })

  it('suma las del plantel que no entraron en ninguna planilla', () => {
    const filas = conPlantelCompleto(
      [jugo('a', 'Cortadi', 10)],
      [enPlantel('a', 'Cortadi'), enPlantel('b', 'Zaragoza')],
    )

    expect(filas).toHaveLength(2)
    expect(filas[1]?.jugadora_id).toBe('b')
    expect(filas[1]?.partidos).toBe(0)
    expect(filas[1]?.usos).toEqual([])
  })

  it('no duplica a las que ya jugaron', () => {
    const filas = conPlantelCompleto([jugo('a', 'Cortadi', 10)], [enPlantel('a', 'Cortadi')])

    expect(filas).toHaveLength(1)
    expect(filas[0]?.partidos).toBe(3)
  })

  it('conserva a la que jugó aunque no esté en el plantel cargado', () => {
    const filas = conPlantelCompleto([jugo('a', 'Cortadi', 10)], [])

    expect(filas.map((f) => f.jugadora_id)).toEqual(['a'])
  })

  it('las que nunca fueron convocadas van al final, después de las que no tienen número anotado', () => {
    const sinNumero: DorsalesDeJugadora = {
      jugadora_id: 'c',
      nombre: 'N',
      apellido: 'Alvarez',
      slug: 'c',
      usos: [],
      partidos: 2,
      sinDorsal: 2,
    }

    const filas = conPlantelCompleto(
      [sinNumero, jugo('a', 'Cortadi', 10)],
      [enPlantel('b', 'Aguirre')],
    )

    expect(filas.map((f) => f.jugadora_id)).toEqual(['a', 'c', 'b'])
  })

  it('entre las no convocadas, por apellido', () => {
    const filas = conPlantelCompleto([], [enPlantel('z', 'Zaragoza'), enPlantel('a', 'Aguirre')])

    expect(filas.map((f) => f.apellido)).toEqual(['Aguirre', 'Zaragoza'])
  })
})

describe('resumenDeFila', () => {
  it('distingue no haber sido convocada de no tener el número anotado', () => {
    const base = { jugadora_id: 'a', nombre: 'N', apellido: 'A', slug: 'a', usos: [] }

    expect(resumenDeFila({ ...base, partidos: 0, sinDorsal: 0 })).toBe(
      'Sin convocatorias en el campeonato',
    )
    expect(resumenDeFila({ ...base, partidos: 2, sinDorsal: 2 })).toBe('Sin dorsal registrado')
  })

  it('con números, es el resumen de los usos', () => {
    expect(
      resumenDeFila({
        jugadora_id: 'a',
        nombre: 'N',
        apellido: 'A',
        slug: 'a',
        usos: [{ dorsal: 10, veces: 5 }],
        partidos: 5,
        sinDorsal: 0,
      }),
    ).toBe('10 en 5 partidos')
  })
})

describe('conDatosCargados', () => {
  const temporadas = [{ id: '2026' }, { id: '2024' }, { id: '2023' }]

  it('deja las que tienen formaciones', () => {
    expect(conDatosCargados(temporadas, new Set(), new Set(['2026']))).toEqual([{ id: '2026' }])
  })

  it('deja las que tienen plantel aunque no haya una sola formación', () => {
    expect(conDatosCargados(temporadas, new Set(['2024']), new Set())).toEqual([{ id: '2024' }])
  })

  it('saca las que no tienen ni plantel ni formaciones', () => {
    const quedan = conDatosCargados(temporadas, new Set(['2026']), new Set(['2026']))

    expect(quedan.map((t) => t.id)).toEqual(['2026'])
  })

  it('sin datos en ninguna, no queda ninguna', () => {
    expect(conDatosCargados(temporadas, new Set(), new Set())).toEqual([])
  })
})
