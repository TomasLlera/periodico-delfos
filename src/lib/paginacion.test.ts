import { describe, expect, it } from 'vitest'
import { contarPaginas, paginaPedida, POR_PAGINA } from '@/lib/paginacion'

describe('paginaPedida', () => {
  it('sin parámetro devuelve la primera', () => {
    expect(paginaPedida(undefined)).toBe(1)
    expect(paginaPedida('')).toBe(1)
  })

  it('lee un número escrito bien', () => {
    expect(paginaPedida('1')).toBe(1)
    expect(paginaPedida('3')).toBe(3)
    expect(paginaPedida('120')).toBe(120)
  })

  it('vuelve a 1 con cualquier cosa que no sea una cadena de dígitos', () => {
    expect(paginaPedida('0')).toBe(1)
    expect(paginaPedida('-2')).toBe(1)
    expect(paginaPedida('abc')).toBe(1)
    expect(paginaPedida('2.5')).toBe(1)
    expect(paginaPedida(' 2 ')).toBe(1)
    // Number('1e3') es 1000, y nadie escribió eso en la barra de direcciones.
    expect(paginaPedida('1e3')).toBe(1)
  })

  it('con el parámetro repetido usa el primero', () => {
    expect(paginaPedida(['4', '9'])).toBe(4)
    expect(paginaPedida([])).toBe(1)
  })
})

describe('contarPaginas', () => {
  it('nunca devuelve menos de una', () => {
    expect(contarPaginas(0)).toBe(1)
    expect(contarPaginas(-5)).toBe(1)
    expect(contarPaginas(10, 0)).toBe(1)
  })

  it('redondea para arriba', () => {
    expect(contarPaginas(1)).toBe(1)
    expect(contarPaginas(POR_PAGINA)).toBe(1)
    expect(contarPaginas(POR_PAGINA + 1)).toBe(2)
  })

  it('las 70 notas de la migración dan 6 páginas', () => {
    expect(contarPaginas(70)).toBe(6)
  })
})
