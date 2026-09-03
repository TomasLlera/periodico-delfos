import { describe, expect, it } from 'vitest'
import { bajadaDeExtracto } from '@/lib/migracion/bajada'

const CUERPO =
  'Las Tiburonas cerraron el año con una temporada que quedará en la historia. ' +
  'No hubo forma de bajarlas del podio en los últimos cuatro meses.'

describe('bajadaDeExtracto', () => {
  it('acepta un extracto escrito a mano', () => {
    const extracto =
      '<p>Las Tiburonas profundizan su mal momento. Cayeron 2 a 1 frente a Defensa y Justicia, en su cuarta derrota consecutiva. </p>'

    expect(bajadaDeExtracto(extracto, CUERPO)).toEqual({
      bajada:
        'Las Tiburonas profundizan su mal momento. Cayeron 2 a 1 frente a Defensa y Justicia, en su cuarta derrota consecutiva.',
      motivo: null,
    })
  })

  it('rechaza el extracto vacío', () => {
    expect(bajadaDeExtracto('', CUERPO)).toEqual({ bajada: '', motivo: 'vacia' })
    expect(bajadaDeExtracto('<p></p>\n', CUERPO)).toEqual({ bajada: '', motivo: 'vacia' })
  })

  it('rechaza el corte a mitad de oración', () => {
    // El caso del blueprint: WordPress corta a las 55 palabras, caiga donde caiga.
    const extracto = '<p>una temporada que quedará en la historia. No</p>'

    expect(bajadaDeExtracto(extracto, 'otro cuerpo cualquiera')).toEqual({
      bajada: '',
      motivo: 'truncada',
    })
  })

  it('rechaza la marca de continuación que agrega WordPress', () => {
    expect(bajadaDeExtracto('<p>Las Tiburonas ganaron de local [&hellip;]</p>', CUERPO).motivo).toBe(
      'con-puntos-suspensivos',
    )
    expect(bajadaDeExtracto('<p>Las Tiburonas ganaron de local…</p>', CUERPO).motivo).toBe(
      'con-puntos-suspensivos',
    )
    expect(bajadaDeExtracto('<p>Las Tiburonas ganaron de local...</p>', CUERPO).motivo).toBe(
      'con-puntos-suspensivos',
    )
  })

  it('detecta el extracto automático aunque termine bien', () => {
    // Copia literal del arranque del cuerpo: es el automático de WordPress.
    const extracto = '<p>Las Tiburonas cerraron el año con una temporada que quedará en la historia.</p>'

    expect(bajadaDeExtracto(extracto, CUERPO).motivo).toBe('copiada-del-cuerpo')
  })

  it('no confunde con una copia a una bajada corta que arranca distinto', () => {
    const extracto = '<p>Un cierre de año para enmarcar.</p>'

    expect(bajadaDeExtracto(extracto, CUERPO)).toEqual({
      bajada: 'Un cierre de año para enmarcar.',
      motivo: null,
    })
  })

  it('resuelve entidades y colapsa los espacios', () => {
    const extracto = '<p>Ganaron  2 &#8211; 1  &amp; siguen&nbsp;arriba.</p>'

    expect(bajadaDeExtracto(extracto, CUERPO).bajada).toBe('Ganaron 2 – 1 & siguen arriba.')
  })

  it('acepta cierres que no son el punto', () => {
    expect(bajadaDeExtracto('<p>¿Puede Aldosivi dar el golpe?</p>', CUERPO).motivo).toBeNull()
    expect(bajadaDeExtracto('<p>¡Campeonas!</p>', CUERPO).motivo).toBeNull()
  })
})
