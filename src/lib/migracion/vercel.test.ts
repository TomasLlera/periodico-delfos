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
        source: '/quilmes-0-2-tiburonas',
        destination: '/nota/quilmes-0-2-tiburonas',
        permanent: true,
      },
    ])
  })

  it('saca la barra final del origen, porque Next la saca antes de mirar las reglas', () => {
    const [regla] = formatoVercel([
      { origen: '/mi-nota/', destino: '/nota/mi-nota', permanente: true },
    ])
    expect(regla?.source).toBe('/mi-nota')
    expect(regla?.destination).toBe('/nota/mi-nota')
  })

  it('las categorías anidadas también pierden sólo la última barra', () => {
    const [regla] = formatoVercel([
      { origen: '/category/futbol-femenino/cronicas/', destino: '/cronicas', permanente: true },
    ])
    expect(regla?.source).toBe('/category/futbol-femenino/cronicas')
  })

  it('el destino queda como viene', () => {
    const [regla] = formatoVercel([{ origen: '/feed/', destino: '/', permanente: true }])
    expect(regla).toEqual({ source: '/feed', destination: '/', permanent: true })
  })

  it('rechaza dos orígenes que sólo difieren en la barra final', () => {
    expect(() =>
      formatoVercel([
        { origen: '/a/', destino: '/nota/a', permanente: true },
        { origen: '/a', destino: '/nota/a', permanente: true },
      ]),
    ).toThrow(/mismo origen/)
  })

  it('rechaza un loop aunque la barra final los haga parecer distintos', () => {
    expect(() =>
      formatoVercel([{ origen: '/nota/a/', destino: '/nota/a', permanente: true }]),
    ).toThrow(/loop/)
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
