import { describe, expect, it } from 'vitest'
import {
  capitanas,
  esquemaFilaPlantel,
  filaDePlantel,
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
    posicion: null,
    capitana: false,
  }

  it('acepta una fila', () => {
    expect(esquemaFilaPlantel.safeParse(valida).success).toBe(true)
  })

  /**
   * **El dorsal ya no es parte de la fila del plantel**, y este test es el que
   * lo fija. Acá había tres que lo daban por supuesto —uno aceptaba la fila
   * "con dorsal", otro lo dejaba en `null` y el tercero exigía el rango 1–99—;
   * la `0020` movió el número a `formaciones` y el esquema dejó de tenerlo.
   *
   * Zod ignora las claves de más en vez de rechazarlas, así que un formulario
   * viejo que siguiera mandando `dorsal` pasaría la validación y el dato se
   * perdería en silencio. Por eso se verifica que no llegue a la fila que va a
   * la base: es lo que importa, y es lo que rompía el guardado cuando sí
   * llegaba.
   */
  it('un dorsal que venga de más no entra a la fila de la base', () => {
    const parseada = esquemaFilaPlantel.parse({ ...valida, dorsal: 10 })
    expect('dorsal' in parseada).toBe(false)
    expect('dorsal' in filaDePlantel(parseada)).toBe(false)
  })

  it('la posición puede quedar en null: manda la de la ficha', () => {
    expect(esquemaFilaPlantel.parse({ ...valida, posicion: null }).posicion).toBe(null)
  })
})

// Acá vivían los tests de `duenaDelDorsal`, que avisaba si dos jugadoras del
// plantel compartían número. Se fueron con la función: desde la `0020` el
// dorsal es de cada partido y la unicidad la cuida
// `formaciones_dorsal_unico_idx` por partido y equipo, no el plantel.

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
