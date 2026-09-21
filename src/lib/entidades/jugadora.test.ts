import { describe, expect, it } from 'vitest'
import {
  entradaDesdeJugadora,
  esquemaJugadora,
  nombreDeLista,
  slugDeJugadora,
} from './jugadora'
import type { Jugadora } from '@/types'

const CORTADI: Jugadora = {
  id: '44444444-4444-4444-4444-444444444444',
  nombre: 'Lucía',
  apellido: 'Cortadi',
  slug: 'lucia-cortadi',
  posicion: 'delantera',
  fecha_nacimiento: '1999-04-23',
  foto_url: 'https://ejemplo.supabase.co/media/cortadi.webp',
  lugar_origen: 'Mar del Plata',
  bio: null,
  activa: true,
}

describe('slugDeJugadora', () => {
  it('junta nombre y apellido', () => {
    expect(slugDeJugadora('Lucía', 'Cortadi')).toBe('lucia-cortadi')
  })

  it('aguanta el nombre compuesto', () => {
    expect(slugDeJugadora('María José', 'Núñez')).toBe('maria-jose-nunez')
  })
})

describe('esquemaJugadora', () => {
  const valida = {
    nombre: 'Lucía',
    apellido: 'Cortadi',
    slug: 'lucia-cortadi',
    posicion: 'delantera',
    fecha_nacimiento: '',
    foto_url: '',
    lugar_origen: '',
    bio: '',
    activa: true,
  }

  it('acepta una ficha con lo mínimo: nombre, apellido y puesto', () => {
    expect(esquemaJugadora.safeParse(valida).success).toBe(true)
  })

  it('todo lo opcional vacío entra como null', () => {
    const r = esquemaJugadora.parse(valida)
    expect(r.fecha_nacimiento).toBe(null)
    expect(r.foto_url).toBe(null)
    expect(r.lugar_origen).toBe(null)
    expect(r.bio).toBe(null)
  })

  it('exige el apellido: es con lo que se la busca en toda la base', () => {
    expect(esquemaJugadora.safeParse({ ...valida, apellido: ' ' }).success).toBe(false)
  })

  it('no acepta un puesto que no existe en el enum de la base', () => {
    expect(esquemaJugadora.safeParse({ ...valida, posicion: 'wing' }).success).toBe(false)
  })

  it('una fecha de nacimiento mal escrita no pasa', () => {
    expect(esquemaJugadora.safeParse({ ...valida, fecha_nacimiento: '23/4/99' }).success).toBe(
      false,
    )
  })
})

describe('entradaDesdeJugadora', () => {
  it('una jugadora nueva arranca activa', () => {
    expect(entradaDesdeJugadora(null).activa).toBe(true)
  })

  it('no pierde ningún campo de la guardada', () => {
    expect(entradaDesdeJugadora(CORTADI)).toEqual({
      nombre: 'Lucía',
      apellido: 'Cortadi',
      slug: 'lucia-cortadi',
      posicion: 'delantera',
      fecha_nacimiento: '1999-04-23',
      foto_url: 'https://ejemplo.supabase.co/media/cortadi.webp',
      lugar_origen: 'Mar del Plata',
      bio: null,
      activa: true,
    })
  })
})

describe('nombreDeLista', () => {
  it('apellido primero: es con lo que se busca en una lista de treinta', () => {
    expect(nombreDeLista(CORTADI)).toBe('Cortadi, Lucía')
  })
})
