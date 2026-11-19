import { describe, expect, it } from 'vitest'
import { CORRECCIONES_DE_TEMPORADA, temporadaCorregida } from '@/lib/migracion/correcciones'
import type { ReferenciaTemporada } from '@/lib/migracion/tipos'

const b2023: ReferenciaTemporada = {
  nombre: 'Primera B 2023',
  slug: 'primera-b-2023',
  division: 'Primera B',
  anio: 2023,
}

describe('temporadaCorregida', () => {
  it('deja la detectada cuando el título está bien', () => {
    expect(temporadaCorregida('cualquier-nota', b2023)).toEqual(b2023)
  })

  it('no inventa una temporada donde el título no decía ninguna', () => {
    expect(temporadaCorregida('cualquier-nota', null)).toBeNull()
  })

  it('corrige la semifinal de 2023, que el título manda a la Primera B', () => {
    const corregida = temporadaCorregida(
      'tiburonas-7-0-laferrere-semifinales-aldosivi-femenino-en-la-primera-b-2023',
      b2023,
    )

    expect(corregida).toEqual({
      nombre: 'Primera C 2023',
      slug: 'primera-c-2023',
      division: 'Primera C',
      anio: 2023,
    })
  })

  it('un slug de temporada con formato raro no rompe: queda la detectada', () => {
    expect(temporadaCorregida('nota', b2023, { nota: 'torneo-raro' })).toEqual(b2023)
  })

  it('todas las correcciones apuntan a un slug con el formato de titulo.ts', () => {
    for (const slug of Object.values(CORRECCIONES_DE_TEMPORADA)) {
      expect(slug).toMatch(/^primera-[a-z]-\d{4}$/)
    }
  })
})
