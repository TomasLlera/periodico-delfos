import { describe, expect, it } from 'vitest'
import {
  estaVigente,
  estadoDeSponsor,
  hoyEnArgentina,
  sponsorsDeHueco,
} from '@/lib/sponsors'
import type { Sponsor } from '@/types'

/**
 * Lo que se prueba acá es plata: un banner que sigue apareciendo despues de
 * vencido es un espacio que el medio regala, y uno que no aparece estando pago
 * es una llamada incomoda.
 */
function sponsor(extra: Partial<Sponsor> = {}): Sponsor {
  return {
    id: 's-1',
    nombre: 'Panaderia San Juan',
    imagen_url: 'https://proyecto.supabase.co/storage/v1/object/public/media/sponsor.webp',
    alt: 'Banner de Panaderia San Juan',
    link: 'https://ejemplo.com',
    ubicacion: 'portada_arriba',
    desde: '2026-10-01',
    hasta: null,
    orden: 0,
    activo: true,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
    ...extra,
  }
}

describe('estaVigente', () => {
  it('muestra el que empezo y no tiene fin', () => {
    expect(estaVigente(sponsor(), '2026-10-02')).toBe(true)
  })

  it('no muestra el que todavia no arranco', () => {
    expect(estaVigente(sponsor({ desde: '2026-11-01' }), '2026-10-02')).toBe(false)
  })

  it('el primer dia ya se ve', () => {
    expect(estaVigente(sponsor({ desde: '2026-10-02' }), '2026-10-02')).toBe(true)
  })

  /**
   * `hasta` es inclusive, que es lo que entiende cualquiera que vendio un
   * espacio "hasta el 31".
   */
  it('el ultimo dia todavia se ve, y al siguiente no', () => {
    const s = sponsor({ hasta: '2026-10-31' })
    expect(estaVigente(s, '2026-10-31')).toBe(true)
    expect(estaVigente(s, '2026-11-01')).toBe(false)
  })

  it('el apagado no se ve aunque este en fecha', () => {
    expect(estaVigente(sponsor({ activo: false }), '2026-10-02')).toBe(false)
  })
})

describe('sponsorsDeHueco', () => {
  const dos = [
    sponsor({ id: 'b', nombre: 'Bicicleteria', orden: 1 }),
    sponsor({ id: 'a', nombre: 'Almacen', orden: 0 }),
  ]

  it('devuelve solo los del hueco pedido', () => {
    const otros = [...dos, sponsor({ id: 'c', ubicacion: 'nota_lateral' })]
    expect(sponsorsDeHueco(otros, 'nota_lateral', '2026-10-02').map((s) => s.id)).toEqual(['c'])
  })

  it('ordena por orden y despues por nombre', () => {
    expect(sponsorsDeHueco(dos, 'portada_arriba', '2026-10-02').map((s) => s.id)).toEqual([
      'a',
      'b',
    ])
  })

  /** Dos con el mismo numero tienen que salir siempre en la misma posicion. */
  it('con el mismo orden, el desempate es estable y alfabetico', () => {
    const empate = [
      sponsor({ id: 'z', nombre: 'Zapateria', orden: 5 }),
      sponsor({ id: 'a', nombre: 'Almacen', orden: 5 }),
    ]
    expect(sponsorsDeHueco(empate, 'portada_arriba', '2026-10-02').map((s) => s.id)).toEqual([
      'a',
      'z',
    ])
  })

  it('filtra los vencidos y los que no arrancaron', () => {
    const mezcla = [
      sponsor({ id: 'vencido', hasta: '2026-09-30' }),
      sponsor({ id: 'futuro', desde: '2026-12-01' }),
      sponsor({ id: 'vivo' }),
    ]
    expect(sponsorsDeHueco(mezcla, 'portada_arriba', '2026-10-02').map((s) => s.id)).toEqual([
      'vivo',
    ])
  })

  it('un hueco sin nada devuelve lista vacia y no explota', () => {
    expect(sponsorsDeHueco([], 'portada_entre_notas', '2026-10-02')).toEqual([])
  })
})

describe('estadoDeSponsor', () => {
  it('nombra los cuatro estados', () => {
    expect(estadoDeSponsor(sponsor(), '2026-10-02')).toBe('activo')
    expect(estadoDeSponsor(sponsor({ desde: '2026-12-01' }), '2026-10-02')).toBe('programado')
    expect(estadoDeSponsor(sponsor({ hasta: '2026-09-30' }), '2026-10-02')).toBe('vencido')
    expect(estadoDeSponsor(sponsor({ activo: false }), '2026-10-02')).toBe('apagado')
  })

  /** Apagado le gana a todo: es la decision explicita de alguien. */
  it('el apagado manda sobre la fecha', () => {
    expect(estadoDeSponsor(sponsor({ activo: false, hasta: '2026-09-30' }), '2026-10-02')).toBe(
      'apagado',
    )
  })
})

describe('hoyEnArgentina', () => {
  /**
   * El caso que importa: en Vercel el reloj esta en UTC, asi que a las 23 de
   * Mar del Plata alla ya son las 2 del dia siguiente. Una campana que vence
   * hoy no se puede apagar tres horas antes.
   */
  it('a las 23 de Mar del Plata todavia es el mismo dia', () => {
    expect(hoyEnArgentina(new Date('2026-10-02T02:00:00Z'))).toBe('2026-10-01')
  })

  it('a la medianoche de Mar del Plata ya cambio el dia', () => {
    expect(hoyEnArgentina(new Date('2026-10-02T03:00:00Z'))).toBe('2026-10-02')
  })

  it('al mediodia de UTC coincide con el dia local', () => {
    expect(hoyEnArgentina(new Date('2026-10-02T12:00:00Z'))).toBe('2026-10-02')
  })
})
