import { describe, expect, it } from 'vitest'
import {
  capitanas,
  duenaDelDorsal,
  esquemaFilaPlantel,
  jugadorasDisponibles,
} from './plantel'
import type { Jugadora, JugadoraEnPlantel } from '@/types'

const TEMPORADA = '0e5f7a10-0000-4000-8000-0000000000aa'

function jugadora(id: string, apellido: string, activa = true): Jugadora {
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
    activa,
  }
}

function enPlantel(id: string, apellido: string, dorsal: number | null, capitana = false): JugadoraEnPlantel {
  return {
    ...jugadora(id, apellido),
    dorsal,
    posicion_temporada: null,
    capitana,
  }
}

const CORTADI = enPlantel('0e5f7a10-0000-4000-8000-000000000001', 'Cortadi', 10, true)
const GARRO = enPlantel('0e5f7a10-0000-4000-8000-000000000002', 'Garro', 9)

describe('esquemaFilaPlantel', () => {
  const valida = {
    temporada_id: TEMPORADA,
    jugadora_id: CORTADI.id,
    dorsal: 10,
    posicion: null,
    capitana: false,
  }

  it('acepta una fila con dorsal', () => {
    expect(esquemaFilaPlantel.safeParse(valida).success).toBe(true)
  })

  it('el dorsal puede faltar: todavía no se sabe', () => {
    expect(esquemaFilaPlantel.safeParse({ ...valida, dorsal: null }).success).toBe(true)
  })

  /** El mismo rango que el CHECK `dorsal_valido`, pero dicho antes. */
  it('rechaza un dorsal fuera de 1–99', () => {
    expect(esquemaFilaPlantel.safeParse({ ...valida, dorsal: 0 }).success).toBe(false)
    expect(esquemaFilaPlantel.safeParse({ ...valida, dorsal: 100 }).success).toBe(false)
  })

  it('la posición puede quedar en null: manda la de la ficha', () => {
    expect(esquemaFilaPlantel.parse({ ...valida, posicion: null }).posicion).toBe(null)
  })
})

describe('duenaDelDorsal', () => {
  it('encuentra a la que ya lo tiene', () => {
    expect(duenaDelDorsal(10, [CORTADI, GARRO], null)?.apellido).toBe('Cortadi')
  })

  it('no se acusa a sí misma al editar su propia fila', () => {
    expect(duenaDelDorsal(10, [CORTADI, GARRO], CORTADI.id)).toBe(null)
  })

  it('un dorsal libre no tiene dueña', () => {
    expect(duenaDelDorsal(7, [CORTADI, GARRO], null)).toBe(null)
  })

  it('sin dorsal no hay conflicto posible', () => {
    expect(duenaDelDorsal(null, [CORTADI, GARRO], null)).toBe(null)
  })
})

describe('jugadorasDisponibles', () => {
  const todas = [
    jugadora(CORTADI.id, 'Cortadi'),
    jugadora(GARRO.id, 'Garro'),
    jugadora('0e5f7a10-0000-4000-8000-000000000003', 'Aguirre'),
    jugadora('0e5f7a10-0000-4000-8000-000000000004', 'Zapata', false),
  ]

  it('deja afuera a las que ya están en el plantel', () => {
    const libres = jugadorasDisponibles(todas, [CORTADI, GARRO])
    expect(libres.map((j) => j.apellido)).toEqual(['Aguirre'])
  })

  it('deja afuera a las inactivas: se fueron del club', () => {
    const libres = jugadorasDisponibles(todas, [])
    expect(libres.map((j) => j.apellido)).not.toContain('Zapata')
  })

  it('las ordena por apellido, que es como se las busca', () => {
    const libres = jugadorasDisponibles(todas, [])
    expect(libres.map((j) => j.apellido)).toEqual(['Aguirre', 'Cortadi', 'Garro'])
  })
})

describe('capitanas', () => {
  it('la cinta la tiene una sola', () => {
    expect(capitanas([CORTADI, GARRO]).map((j) => j.apellido)).toEqual(['Cortadi'])
  })

  /** La base no lo impide a propósito: capitana y vice es un caso real. */
  it('dos se pueden, y la pantalla lo muestra en vez de bloquearlo', () => {
    expect(capitanas([CORTADI, { ...GARRO, capitana: true }])).toHaveLength(2)
  })
})
