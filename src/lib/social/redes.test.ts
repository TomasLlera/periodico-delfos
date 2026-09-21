import { describe, expect, it } from 'vitest'
import {
  credencialesQueFaltan,
  esDryRun,
  postearSimulado,
  publicadorDe,
  tieneCredenciales,
} from './redes'
import type { CopyDeRed } from './compose'

const COMPLETO = {
  FACEBOOK_PAGE_ID: '123',
  FACEBOOK_PAGE_ACCESS_TOKEN: 'token',
  INSTAGRAM_BUSINESS_ACCOUNT_ID: '456',
  X_API_KEY: 'a',
  X_API_SECRET: 'b',
  X_ACCESS_TOKEN: 'c',
  X_ACCESS_TOKEN_SECRET: 'd',
}

const COPY: CopyDeRed = {
  red: 'facebook',
  texto: 'Aldosivi 6-1 Claypole',
  largo: 21,
  limite: 280,
  entra: true,
  recortado: false,
}

const PUBLICACION = { copy: COPY, imagenUrl: null, notaSlug: 'goleada-en-el-minella' }

describe('tieneCredenciales', () => {
  it('con todo cargado, las tres pueden postear', () => {
    expect(tieneCredenciales('facebook', COMPLETO)).toBe(true)
    expect(tieneCredenciales('instagram', COMPLETO)).toBe(true)
    expect(tieneCredenciales('x', COMPLETO)).toBe(true)
  })

  it('un entorno vacío no alcanza para ninguna', () => {
    expect(tieneCredenciales('facebook', {})).toBe(false)
  })

  /**
   * El caso que engaña: la variable existe pero está vacía, que es como queda
   * cuando alguien copia `.env.example` y no la completa.
   */
  it('una variable vacía no cuenta como cargada', () => {
    expect(tieneCredenciales('facebook', { ...COMPLETO, FACEBOOK_PAGE_ID: '   ' })).toBe(false)
  })

  /** Instagram postea con el token de la Página de Facebook, no con uno propio. */
  it('Instagram depende del token de Facebook', () => {
    const sinToken = { ...COMPLETO, FACEBOOK_PAGE_ACCESS_TOKEN: '' }
    expect(tieneCredenciales('instagram', sinToken)).toBe(false)
  })
})

describe('credencialesQueFaltan', () => {
  it('dice cuáles, por nombre, para poder ir a cargarlas', () => {
    expect(credencialesQueFaltan('x', {})).toEqual([
      'X_API_KEY',
      'X_API_SECRET',
      'X_ACCESS_TOKEN',
      'X_ACCESS_TOKEN_SECRET',
    ])
  })

  it('con todo cargado no falta nada', () => {
    expect(credencialesQueFaltan('facebook', COMPLETO)).toEqual([])
  })
})

describe('esDryRun', () => {
  it('sin credenciales se simula, en vez de fallar', () => {
    expect(esDryRun('facebook', {})).toBe(true)
  })

  it('el interruptor explícito gana aunque estén todas las claves', () => {
    expect(esDryRun('facebook', { ...COMPLETO, SOCIAL_DRY_RUN: 'true' })).toBe(true)
  })

  it('con las claves puestas y sin el interruptor, no se simula', () => {
    expect(esDryRun('facebook', COMPLETO)).toBe(false)
  })

  it('el interruptor sólo cuenta en "true", no en cualquier valor', () => {
    expect(esDryRun('facebook', { ...COMPLETO, SOCIAL_DRY_RUN: 'false' })).toBe(false)
    expect(esDryRun('facebook', { ...COMPLETO, SOCIAL_DRY_RUN: '1' })).toBe(false)
  })
})

describe('postearSimulado', () => {
  /**
   * Si uno de estos ids llega al panel creyéndose real, tiene que verse de una.
   */
  it('el id se reconoce a simple vista como falso', () => {
    const r = postearSimulado('instagram', PUBLICACION)
    expect(r.externalPostId).toMatch(/^simulado-/)
    expect(r.simulado).toBe(true)
    expect(r.error).toBeUndefined()
  })
})

describe('publicadorDe', () => {
  it('sin credenciales devuelve el simulado y no falla', async () => {
    const r = await publicadorDe('x', {})(PUBLICACION)
    expect(r.simulado).toBe(true)
  })

  /**
   * Con las claves puestas, simular en silencio sería peor que el error: quien
   * las cargó espera que se publique de verdad.
   */
  it('con credenciales y sin cliente escrito, avisa en vez de simular', async () => {
    const r = await publicadorDe('x', COMPLETO)(PUBLICACION)
    expect(r.simulado).toBeUndefined()
    expect(r.error).toContain('todavía no está escrito')
  })
})
