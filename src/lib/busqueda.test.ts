import { describe, expect, it } from 'vitest'
import { terminoBuscado } from '@/lib/busqueda'

describe('terminoBuscado', () => {
  it('sin parámetro está vacío', () => {
    expect(terminoBuscado(undefined)).toEqual({ estado: 'vacio' })
    expect(terminoBuscado('')).toEqual({ estado: 'vacio' })
    expect(terminoBuscado('   ')).toEqual({ estado: 'vacio' })
  })

  it('una sola letra es demasiado corto', () => {
    expect(terminoBuscado('a')).toEqual({ estado: 'corto' })
    expect(terminoBuscado(' a ')).toEqual({ estado: 'corto' })
  })

  it('devuelve el término limpio', () => {
    expect(terminoBuscado('  Aldosivi  ')).toEqual({ estado: 'listo', termino: 'Aldosivi' })
  })

  it('colapsa los espacios del medio', () => {
    expect(terminoBuscado('Aldosivi   Morón')).toEqual({
      estado: 'listo',
      termino: 'Aldosivi Morón',
    })
  })

  it('recorta un pegado accidental', () => {
    const resultado = terminoBuscado('x'.repeat(500))
    expect(resultado.estado).toBe('listo')
    if (resultado.estado === 'listo') expect(resultado.termino).toHaveLength(100)
  })

  it('con el parámetro repetido usa el primero', () => {
    expect(terminoBuscado(['gol', 'otro'])).toEqual({ estado: 'listo', termino: 'gol' })
  })
})
