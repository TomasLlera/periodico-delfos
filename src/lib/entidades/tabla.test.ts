import { describe, expect, it } from 'vitest'
import {
  esquemaFilaTabla,
  fechaSugerida,
  filaEnBlanco,
  huecosDeLaFecha,
  jugadosQueCorresponden,
  motivosQueNoCuadran,
  puntosQueCorresponden,
} from './tabla'

const TEMPORADA = '0e5f7a10-0000-4000-8000-0000000000aa'
const EQUIPO = '0e5f7a10-0000-4000-8000-0000000000bb'

/** Tres ganados, un empate y una derrota: 5 jugados, 10 puntos. */
const FILA = {
  temporada_id: TEMPORADA,
  fecha_numero: 5,
  equipo_id: EQUIPO,
  posicion: 2,
  puntos: 10,
  jugados: 5,
  ganados: 3,
  empatados: 1,
  perdidos: 1,
  goles_favor: 9,
  goles_contra: 4,
}

describe('esquemaFilaTabla', () => {
  it('acepta una fila que cierra', () => {
    expect(esquemaFilaTabla.safeParse(FILA).success).toBe(true)
  })

  /** El CHECK `partidos_cuadran`, dicho antes de que lo diga Postgres. */
  it('caza el ganado de más que no cuadra con los jugados', () => {
    const r = esquemaFilaTabla.safeParse({ ...FILA, ganados: 4, puntos: 13 })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toContain('suma de ganados')
  })

  /** El CHECK `puntos_cuadran`. */
  it('caza los puntos mal sumados', () => {
    const r = esquemaFilaTabla.safeParse({ ...FILA, puntos: 11 })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toContain('no coinciden')
  })

  it('no acepta números negativos', () => {
    expect(esquemaFilaTabla.safeParse({ ...FILA, goles_contra: -1 }).success).toBe(false)
  })

  it('la posición arranca en 1, no en 0', () => {
    expect(esquemaFilaTabla.safeParse({ ...FILA, posicion: 0 }).success).toBe(false)
  })

  it('un equipo sin elegir no pasa', () => {
    expect(esquemaFilaTabla.safeParse({ ...FILA, equipo_id: '' }).success).toBe(false)
  })
})

describe('puntosQueCorresponden', () => {
  it('tres por ganado y uno por empate', () => {
    expect(puntosQueCorresponden({ ganados: 3, empatados: 1 })).toBe(10)
  })

  it('un equipo sin jugar arranca en cero', () => {
    expect(puntosQueCorresponden({ ganados: 0, empatados: 0 })).toBe(0)
  })
})

describe('jugadosQueCorresponden', () => {
  it('es la suma de los tres resultados', () => {
    expect(jugadosQueCorresponden({ ganados: 3, empatados: 1, perdidos: 1 })).toBe(5)
  })
})

describe('motivosQueNoCuadran', () => {
  it('una fila bien cargada no tiene motivos', () => {
    expect(motivosQueNoCuadran(FILA)).toEqual([])
  })

  /**
   * El caso real: se carga un ganado de más y se rompen las dos cuentas a la
   * vez. Decir una sola obligaría a corregir, guardar y volver a fallar.
   */
  it('dice los dos problemas juntos', () => {
    const motivos = motivosQueNoCuadran({ ...FILA, ganados: 4 })
    expect(motivos).toHaveLength(2)
    expect(motivos[0]).toContain('la suma da 6')
    expect(motivos[1]).toContain('la cuenta da 13')
  })
})

describe('huecosDeLaFecha', () => {
  const filas = [{ posicion: 1 }, { posicion: 2 }, { posicion: 3 }]

  it('una fecha completa no tiene huecos', () => {
    expect(huecosDeLaFecha(filas, 3)).toEqual([])
  })

  it('avisa del equipo que falta cargar', () => {
    expect(huecosDeLaFecha(filas, 5)[0]).toBe('Faltan las posiciones 4, 5')
  })

  it('avisa de dos equipos en el mismo puesto', () => {
    expect(huecosDeLaFecha([{ posicion: 1 }, { posicion: 1 }], 2)[0]).toContain(
      'dos equipos en la posición 1',
    )
  })

  it('una fecha todavía sin cargar no es una fecha con huecos', () => {
    expect(huecosDeLaFecha([], 11)).toEqual([])
  })
})

describe('fechaSugerida', () => {
  it('la que sigue a la última cargada', () => {
    expect(fechaSugerida([{ fecha_numero: 3 }, { fecha_numero: 4 }])).toBe(5)
  })

  it('en una temporada sin tabla, la primera', () => {
    expect(fechaSugerida([])).toBe(1)
  })
})

describe('filaEnBlanco', () => {
  it('nace ubicada en su temporada, su fecha y su puesto', () => {
    const fila = filaEnBlanco(TEMPORADA, 5, 3)
    expect(fila.temporada_id).toBe(TEMPORADA)
    expect(fila.fecha_numero).toBe(5)
    expect(fila.posicion).toBe(3)
  })

  it('y en cero, que es una fila que cuadra', () => {
    expect(motivosQueNoCuadran(filaEnBlanco(TEMPORADA, 1, 1))).toEqual([])
  })
})
