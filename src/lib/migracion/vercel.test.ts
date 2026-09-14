import { describe, expect, it } from 'vitest'
import { formatoVercel } from '@/lib/migracion/vercel'

describe('formatoVercel', () => {
  it('traduce origen/destino/permanente a source/destination/permanent', () => {
    expect(
      formatoVercel([
        { origen: '/quilmes-0-2-tiburonas/', destino: '/nota/quilmes-0-2-tiburonas', permanente: true },
      ]),
    ).toEqual([
      {
        source: '/quilmes-0-2-tiburonas/',
        destination: '/nota/quilmes-0-2-tiburonas',
        permanent: true,
      },
    ])
  })

  it('no toca la barra final de ninguno de los dos lados', () => {
    const [regla] = formatoVercel([
      { origen: '/mi-nota/', destino: '/nota/mi-nota', permanente: true },
    ])
    expect(regla?.source).toBe('/mi-nota/')
    expect(regla?.destination).toBe('/nota/mi-nota')
  })

  it('rechaza dos reglas con el mismo origen', () => {
    expect(() =>
      formatoVercel([
        { origen: '/a/', destino: '/nota/a', permanente: true },
        { origen: '/a/', destino: '/otra-cosa', permanente: true },
      ]),
    ).toThrow(/mismo origen/)
  })

  it('rechaza una redirección a sí misma', () => {
    expect(() =>
      formatoVercel([{ origen: '/a/', destino: '/a/', permanente: true }]),
    ).toThrow(/loop/)
  })
})
