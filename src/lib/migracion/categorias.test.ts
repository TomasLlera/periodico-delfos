import { describe, expect, it } from 'vitest'
import { categoriaDesdeWordPress, indiceDeCategorias } from '@/lib/migracion/categorias'

describe('categoriaDesdeWordPress', () => {
  it('mapea las categorías reales del sitio viejo', () => {
    expect(categoriaDesdeWordPress(['cronicas']).categoria).toBe('cronica')
    expect(categoriaDesdeWordPress(['analisis']).categoria).toBe('analisis')
    expect(categoriaDesdeWordPress(['temporadas']).categoria).toBe('temporada')
    expect(categoriaDesdeWordPress(['planteles']).categoria).toBe('plantel')
    expect(categoriaDesdeWordPress(['aniversario']).categoria).toBe('institucional')
    expect(categoriaDesdeWordPress(['entrevistas']).categoria).toBe('institucional')
  })

  it('ignora la categoría padre, que está en 69 de 70 notas', () => {
    // Tal como viene: ['cronicas', 'futbol-femenino'].
    expect(categoriaDesdeWordPress(['cronicas', 'futbol-femenino']).categoria).toBe('cronica')
    expect(categoriaDesdeWordPress(['futbol-femenino', 'planteles']).categoria).toBe('plantel')
  })

  it('gana la categoría más específica cuando hay varias', () => {
    // La nota del aniversario del ascenso está en análisis y en aniversario.
    expect(categoriaDesdeWordPress(['analisis', 'aniversario', 'futbol-femenino']).categoria).toBe(
      'analisis',
    )
    expect(categoriaDesdeWordPress(['aniversario', 'analisis']).categoria).toBe('analisis')
  })

  it('cae en institucional cuando no queda nada', () => {
    expect(categoriaDesdeWordPress([]).categoria).toBe('institucional')
    expect(categoriaDesdeWordPress(['futbol-femenino']).categoria).toBe('institucional')
    expect(categoriaDesdeWordPress(['uncategorized']).categoria).toBe('institucional')
  })

  it('lista lo que no supo mapear en vez de tragárselo', () => {
    const resultado = categoriaDesdeWordPress(['futbol-masculino', 'podcast', 'futbol-femenino'])

    expect(resultado.categoria).toBe('institucional')
    expect(resultado.sinMapear).toEqual(['futbol-masculino', 'podcast'])
  })

  it('no reporta como sin mapear lo que sí tiene una decisión tomada', () => {
    expect(categoriaDesdeWordPress(['aniversario']).sinMapear).toEqual([])
  })
})

describe('indiceDeCategorias', () => {
  it('traduce los ids que trae cada post', () => {
    const indice = indiceDeCategorias([
      { id: 44, slug: 'cronicas' },
      { id: 25, slug: 'futbol-femenino' },
    ])

    expect(indice.get(44)).toBe('cronicas')
    expect(indice.get(999)).toBeUndefined()
  })
})
