import { describe, expect, it } from 'vitest'
import {
  agruparPorPuesto,
  iniciales,
  nombreCompleto,
  ordenarPlantel,
  puestoEnTemporada,
} from '@/lib/plantel'
import type { JugadoraEnPlantel, Posicion } from '@/types'

function jugadora(
  apellido: string,
  posicion: Posicion,
  dorsal: number | null = null,
  posicionTemporada: Posicion | null = null,
): JugadoraEnPlantel {
  return {
    id: `j-${apellido}`,
    nombre: 'Nombre',
    apellido,
    slug: apellido.toLowerCase(),
    posicion,
    fecha_nacimiento: null,
    foto_url: null,
    lugar_origen: null,
    bio: null,
    activa: true,
    dorsal,
    posicion_temporada: posicionTemporada,
    capitana: false,
  }
}

describe('puestoEnTemporada', () => {
  it('la posición del plantel le gana a la de la ficha', () => {
    const suplente = jugadora('Larea', 'defensora', 5, 'mediocampista')
    expect(puestoEnTemporada(suplente)).toBe('mediocampista')
  })

  it('sin posición de plantel vale la de la ficha', () => {
    expect(puestoEnTemporada(jugadora('Díaz', 'arquera', 1))).toBe('arquera')
  })
})

describe('agruparPorPuesto', () => {
  it('agrupa en el orden de la formación, del arco hacia adelante', () => {
    const grupos = agruparPorPuesto([
      jugadora('Cortadi', 'delantera', 9),
      jugadora('Díaz', 'arquera', 1),
      jugadora('Larea', 'mediocampista', 5),
      jugadora('Corona', 'defensora', 4),
    ])

    expect(grupos.map((g) => g.clave)).toEqual([
      'arqueras',
      'defensoras',
      'mediocampistas',
      'delanteras',
    ])
  })

  it('el cuerpo técnico es un solo grupo: la DT y su ayudante juntas', () => {
    const grupos = agruparPorPuesto([
      jugadora('Rossi', 'dt'),
      jugadora('Vera', 'ayudante'),
    ])

    expect(grupos).toHaveLength(1)
    expect(grupos[0].titulo).toBe('Cuerpo técnico')
    expect(grupos[0].jugadoras.map((j) => j.apellido)).toEqual(['Rossi', 'Vera'])
  })

  it('no dibuja grupos vacíos', () => {
    const grupos = agruparPorPuesto([jugadora('Díaz', 'arquera', 1)])
    expect(grupos.map((g) => g.clave)).toEqual(['arqueras'])
  })

  it('un plantel vacío no es un error: no hay grupos', () => {
    expect(agruparPorPuesto([])).toEqual([])
  })

  it('agrupa por la posición de la temporada, no por la de la ficha', () => {
    const grupos = agruparPorPuesto([jugadora('Larea', 'defensora', 5, 'mediocampista')])
    expect(grupos[0].clave).toBe('mediocampistas')
  })
})

describe('ordenarPlantel', () => {
  it('ordena por dorsal', () => {
    const ordenado = ordenarPlantel([
      jugadora('Cortadi', 'delantera', 9),
      jugadora('Díaz', 'arquera', 1),
      jugadora('Corona', 'defensora', 4),
    ])
    expect(ordenado.map((j) => j.dorsal)).toEqual([1, 4, 9])
  })

  it('las que no tienen dorsal van al final, no al principio', () => {
    const ordenado = ordenarPlantel([
      jugadora('Sosa', 'delantera', null),
      jugadora('Díaz', 'arquera', 1),
    ])
    expect(ordenado.map((j) => j.apellido)).toEqual(['Díaz', 'Sosa'])
  })

  it('sin dorsal desempata por apellido, con las reglas del español', () => {
    const ordenado = ordenarPlantel([
      jugadora('Ñanez', 'defensora', null),
      jugadora('Núñez', 'defensora', null),
      jugadora('Acosta', 'defensora', null),
    ])
    expect(ordenado.map((j) => j.apellido)).toEqual(['Acosta', 'Núñez', 'Ñanez'])
  })

  it('no toca el arreglo que recibe', () => {
    const original = [jugadora('Sosa', 'delantera', 11), jugadora('Díaz', 'arquera', 1)]
    ordenarPlantel(original)
    expect(original.map((j) => j.apellido)).toEqual(['Sosa', 'Díaz'])
  })
})

describe('nombreCompleto e iniciales', () => {
  it('arma el nombre completo', () => {
    expect(nombreCompleto({ nombre: 'Lucía', apellido: 'Cortadi' })).toBe('Lucía Cortadi')
  })

  it('las iniciales son la primera letra de cada parte, en mayúscula', () => {
    expect(iniciales({ nombre: 'Lucía', apellido: 'Cortadi' })).toBe('LC')
  })

  it('un apellido vacío no deja las iniciales en blanco', () => {
    expect(iniciales({ nombre: 'Lucía', apellido: '' })).toBe('L')
    expect(iniciales({ nombre: '', apellido: '' })).toBe('?')
  })
})
