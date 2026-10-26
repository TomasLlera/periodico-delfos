import { describe, expect, it } from 'vitest'
import { exigir } from '@/lib/supabase/exigir'

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
})
