import { describe, expect, it } from 'vitest'
import { LARGO_MINIMO, terminoBuscado } from '@/lib/busqueda'
import { chequearImagen, MAXIMO_BYTES } from '@/lib/imagen'

// Los bordes que los tests de cada archivo no tocaban: el valor justo en el
// límite y el inmediatamente afuera (Metodología de pruebas, clase 10).

describe('terminoBuscado en el borde de LARGO_MINIMO', () => {
  it('con exactamente dos caracteres ya es una búsqueda', () => {
    expect(LARGO_MINIMO).toBe(2)
    expect(terminoBuscado('ab')).toEqual({ estado: 'listo', termino: 'ab' })
  })

  it('con uno solo es corto, aunque venga rodeado de espacios', () => {
    expect(terminoBuscado('  a  ')).toEqual({ estado: 'corto' })
  })
})

describe('chequearImagen en el borde de MAXIMO_BYTES', () => {
  it('un byte por encima de los 8 MB ya no entra', () => {
    const r = chequearImagen('image/jpeg', MAXIMO_BYTES + 1)
    expect(r.ok).toBe(false)
    expect(r.motivo).toContain('el máximo son 8 MB')
  })
})
