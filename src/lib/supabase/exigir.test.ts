import { describe, expect, it } from 'vitest'
import {
  esRangoFueraDeAlcance,
  exigir,
  RANGO_FUERA_DE_ALCANCE,
} from '@/lib/supabase/exigir'

describe('exigir', () => {
  it('devuelve la respuesta entera cuando no hay error', () => {
    const respuesta = { data: [{ id: 'a' }], count: 1, error: null }
    expect(exigir(respuesta, 'getAlgo')).toBe(respuesta)
  })

  it('con data null y sin error no tira: "no hay fila" no es una falla', () => {
    expect(exigir({ data: null, error: null }, 'getAlgo').data).toBeNull()
  })

  it('tira con el nombre de la consulta, el código y el mensaje', () => {
    expect(() =>
      exigir(
        { data: null, error: { message: 'column notas.publicada does not exist', code: '42703' } },
        'getNotaPorSlug',
      ),
    ).toThrow('Supabase falló en getNotaPorSlug (42703): column notas.publicada does not exist')
  })

  it('sin código, el mensaje igual sale', () => {
    expect(() => exigir({ data: null, error: { message: 'fetch failed' } }, 'getSponsors')).toThrow(
      'Supabase falló en getSponsors: fetch failed',
    )
  })

  // El rango fuera de alcance sí lo hace tirar: quien pagina tiene que
  // preguntar antes con `esRangoFueraDeAlcance()`. `exigir()` no decide solo
  // que una falla no importa.
  it('un rango fuera de alcance también tira si no se lo filtró antes', () => {
    expect(() =>
      exigir(
        { data: null, error: { message: 'Requested range not satisfiable', code: 'PGRST103' } },
        'getNotasPorCategoria',
      ),
    ).toThrow('Supabase falló en getNotasPorCategoria')
  })
})

describe('esRangoFueraDeAlcance', () => {
  it('reconoce el PGRST103 de PostgREST', () => {
    expect(RANGO_FUERA_DE_ALCANCE).toBe('PGRST103')
    expect(
      esRangoFueraDeAlcance({
        error: { message: 'Requested range not satisfiable', code: RANGO_FUERA_DE_ALCANCE },
      }),
    ).toBe(true)
  })

  it('sin error no es un rango vacío', () => {
    expect(esRangoFueraDeAlcance({ error: null })).toBe(false)
  })

  // Es la distinción que importa: una base caída devuelve `data: null` igual
  // que un rango vacío, y ésa sí tiene que volar a 500.
  it('otra falla no se confunde con un rango vacío', () => {
    expect(esRangoFueraDeAlcance({ error: { message: 'fetch failed' } })).toBe(false)
    expect(
      esRangoFueraDeAlcance({ error: { message: 'column does not exist', code: '42703' } }),
    ).toBe(false)
  })
})
