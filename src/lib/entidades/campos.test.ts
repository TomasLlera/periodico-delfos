import { describe, expect, it } from 'vitest'
import {
  enteroOpcional,
  errorDeBase,
  fechaOpcional,
  isoALocal,
  localAIso,
  slugificar,
  textoOpcional,
  textoRequerido,
} from './campos'

describe('slugificar', () => {
  it('baja a minúsculas y une con guiones', () => {
    expect(slugificar('Defensores de Belgrano')).toBe('defensores-de-belgrano')
  })

  it('saca los acentos sin comerse la letra', () => {
    expect(slugificar('Atlético Sarmiento')).toBe('atletico-sarmiento')
  })

  it('convierte la ñ en n', () => {
    expect(slugificar('Peñarol')).toBe('penarol')
  })

  it('no deja guiones dobles ni en las puntas', () => {
    expect(slugificar('  Kimberley — Mar del Plata  ')).toBe('kimberley-mar-del-plata')
  })
})

describe('textoRequerido', () => {
  it('rechaza el espacio en blanco, que no es un nombre', () => {
    const r = textoRequerido('El nombre').safeParse('   ')
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe('El nombre no puede quedar vacío')
  })

  it('recorta los espacios de las puntas', () => {
    expect(textoRequerido('El nombre').parse('  Aldosivi ')).toBe('Aldosivi')
  })
})

describe('textoOpcional', () => {
  it('el campo vacío del formulario entra como null, no como cadena vacía', () => {
    expect(textoOpcional.parse('')).toBe(null)
    expect(textoOpcional.parse('   ')).toBe(null)
  })

  it('deja pasar lo que sí se escribió', () => {
    expect(textoOpcional.parse(' Mar del Plata ')).toBe('Mar del Plata')
  })
})

describe('enteroOpcional', () => {
  const dorsal = enteroOpcional('El dorsal', 1, 99)

  it('acepta null: el dorsal se puede no saber todavía', () => {
    expect(dorsal.parse(null)).toBe(null)
  })

  it('corta el error de tipeo antes de que llegue al CHECK de Postgres', () => {
    expect(dorsal.safeParse(900).success).toBe(false)
    expect(dorsal.safeParse(0).success).toBe(false)
  })

  it('rechaza los decimales', () => {
    expect(dorsal.safeParse(10.5).success).toBe(false)
  })
})

describe('fechaOpcional', () => {
  it('la fecha de nacimiento se puede no saber', () => {
    expect(fechaOpcional.parse('')).toBe(null)
  })

  it('acepta lo que devuelve un input de fecha', () => {
    expect(fechaOpcional.parse('1999-04-23')).toBe('1999-04-23')
  })

  it('rechaza cualquier otra cosa', () => {
    expect(fechaOpcional.safeParse('23/04/1999').success).toBe(false)
  })
})

describe('isoALocal y localAIso', () => {
  it('el partido de las 15:30 en Mar del Plata se guarda como 18:30 UTC', () => {
    expect(localAIso('2026-08-02T15:30')).toBe('2026-08-02T18:30:00.000Z')
  })

  it('y vuelve a leerse como 15:30', () => {
    expect(isoALocal('2026-08-02T18:30:00.000Z')).toBe('2026-08-02T15:30')
  })

  /**
   * La razón de que el huso esté escrito a mano: el resultado no puede
   * depender del reloj de la máquina, porque el mismo cálculo corre en el
   * servidor —Vercel, en UTC— y en el navegador de Charlie.
   */
  it('no depende del huso de quien corre el código', () => {
    const ida = localAIso('2026-08-02T15:30')
    expect(ida).not.toBeNull()
    expect(isoALocal(ida as string)).toBe('2026-08-02T15:30')
  })

  it('cruza la medianoche sin perder el día', () => {
    expect(localAIso('2026-08-02T22:00')).toBe('2026-08-03T01:00:00.000Z')
    expect(isoALocal('2026-08-03T01:00:00.000Z')).toBe('2026-08-02T22:00')
  })

  it('una fecha rota no se convierte en un instante inventado', () => {
    expect(localAIso('el sábado')).toBe(null)
    expect(isoALocal('nada')).toBe('')
  })
})

describe('errorDeBase', () => {
  it('el duplicado se dice con el nombre del campo', () => {
    expect(errorDeBase({ code: '23505' }, 'Ese dorsal ya está usado')).toBe(
      'Ese dorsal ya está usado',
    )
  })

  it('un CHECK es un dato que no cierra, no un duplicado', () => {
    expect(errorDeBase({ code: '23514' }, 'repetido')).toBe(
      'Los datos no cierran: revisá los números',
    )
  })

  it('lo que no se reconoce no se disfraza', () => {
    expect(errorDeBase({ code: '42501' }, 'repetido')).toBe('No se pudo guardar')
  })
})
