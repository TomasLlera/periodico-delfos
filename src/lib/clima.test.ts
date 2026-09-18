import { describe, expect, it } from 'vitest'
import { etiquetaTemperatura, temperaturaAccesible, temperaturaDe } from '@/lib/clima'

describe('temperaturaDe', () => {
  it('redondea los grados de una respuesta válida', () => {
    expect(temperaturaDe({ current: { temperature_2m: 13.4 } })).toBe(13)
    expect(temperaturaDe({ current: { temperature_2m: 13.5 } })).toBe(14)
    expect(temperaturaDe({ current: { temperature_2m: -2.6 } })).toBe(-3)
  })

  it('nunca devuelve -0, que se imprime con signo', () => {
    expect(Object.is(temperaturaDe({ current: { temperature_2m: -0.4 } }), 0)).toBe(true)
  })

  // La API es externa: el sitio no puede romperse porque un día cambie de forma.
  it('devuelve null con cualquier cosa que no sea la forma esperada', () => {
    expect(temperaturaDe({ current: { temperature_2m: 'templado' } })).toBeNull()
    expect(temperaturaDe({ current: {} })).toBeNull()
    expect(temperaturaDe({ error: true, reason: 'fuera de rango' })).toBeNull()
    expect(temperaturaDe(null)).toBeNull()
    expect(temperaturaDe(undefined)).toBeNull()
    expect(temperaturaDe('14')).toBeNull()
  })
})

describe('etiquetaTemperatura', () => {
  it('escribe los grados con el símbolo', () => {
    expect(etiquetaTemperatura(14)).toBe('14°')
    expect(etiquetaTemperatura(0)).toBe('0°')
  })

  it('usa el signo menos U+2212 y no un guion', () => {
    expect(etiquetaTemperatura(-3)).toBe('−3°')
  })
})

describe('temperaturaAccesible', () => {
  it('dice la palabra, que es lo que se lee en voz alta', () => {
    expect(temperaturaAccesible(14)).toBe('14 grados')
    expect(temperaturaAccesible(1)).toBe('1 grado')
    expect(temperaturaAccesible(-1)).toBe('-1 grado')
  })
})
