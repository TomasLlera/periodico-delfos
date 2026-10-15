import { describe, expect, it } from 'vitest'
import {
  avisoSinRed,
  botonParaReanudar,
  haceCuanto,
  hayAlgoSinGuardar,
  hayQueOfrecer,
  mismoContenido,
  quedoViejo,
  ultimoDeNotaNueva,
  type Borrador,
} from './borrador'
import { entradaDesdeNota, type EntradaNota } from './nota'

const VACIA = entradaDesdeNota(null)

function con(cambios: Partial<EntradaNota>): EntradaNota {
  return { ...VACIA, ...cambios }
}

function borrador(cambios: Partial<Borrador> = {}): Borrador {
  return {
    id: '0e5f7a10-0000-4000-8000-000000000001',
    nueva: true,
    entrada: con({ titulo: 'Golearon en el Minella' }),
    archivo: null,
    guardado: '2026-10-15T20:00:00.000Z',
    ...cambios,
  }
}

describe('mismoContenido', () => {
  it('no le importa el orden de las claves, que jsonb reordena', () => {
    const escrito = con({
      cuerpo: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hola' }] }] },
    })
    const deLaBase = con({
      cuerpo: { content: [{ content: [{ text: 'Hola', type: 'text' }], type: 'paragraph' }], type: 'doc' },
    })

    expect(mismoContenido(escrito, deLaBase)).toBe(true)
  })

  it('sí le importa el orden de los párrafos', () => {
    const p = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] })
    const a = con({ cuerpo: { type: 'doc', content: [p('uno'), p('dos')] } })
    const b = con({ cuerpo: { type: 'doc', content: [p('dos'), p('uno')] } })

    expect(mismoContenido(a, b)).toBe(false)
  })
})

describe('hayAlgoSinGuardar', () => {
  it('abrir el editor y no tocar nada no deja borrador', () => {
    expect(hayAlgoSinGuardar(VACIA, VACIA, null)).toBe(false)
  })

  it('una letra ya es algo', () => {
    expect(hayAlgoSinGuardar(con({ titulo: 'G' }), VACIA, null)).toBe(true)
  })

  it('elegir una foto también, aunque el texto no cambie', () => {
    expect(hayAlgoSinGuardar(VACIA, VACIA, new File(['x'], 'foto.jpg'))).toBe(true)
  })
})

describe('hayQueOfrecer', () => {
  it('sin borrador no hay nada que ofrecer', () => {
    expect(hayQueOfrecer(null, VACIA)).toBe(false)
  })

  it('uno idéntico a lo guardado es un guardado que salió bien: no se ofrece', () => {
    const guardada = con({ titulo: 'Golearon en el Minella' })
    expect(hayQueOfrecer(borrador({ entrada: guardada }), guardada)).toBe(false)
  })

  it('uno con texto que la base no tiene, sí', () => {
    expect(hayQueOfrecer(borrador(), VACIA)).toBe(true)
  })
})

describe('quedoViejo', () => {
  it('la nota guardada después del borrador lo deja viejo', () => {
    expect(quedoViejo(borrador(), '2026-10-15T20:30:00.000Z')).toBe(true)
  })

  it('la nota guardada antes, no', () => {
    expect(quedoViejo(borrador(), '2026-10-15T19:00:00.000Z')).toBe(false)
  })

  it('una nota que todavía no existe, tampoco', () => {
    expect(quedoViejo(borrador(), null)).toBe(false)
  })
})

describe('ultimoDeNotaNueva', () => {
  it('elige el más reciente de los de nota nueva, e ignora los de notas que existen', () => {
    const viejo = borrador({ id: 'a', guardado: '2026-10-15T18:00:00.000Z' })
    const reciente = borrador({ id: 'b', guardado: '2026-10-15T21:00:00.000Z' })
    const deEdicion = borrador({ id: 'c', nueva: false, guardado: '2026-10-15T22:00:00.000Z' })

    expect(ultimoDeNotaNueva([viejo, deEdicion, reciente])?.id).toBe('b')
  })

  it('sin ninguno, null', () => {
    expect(ultimoDeNotaNueva([borrador({ nueva: false })])).toBeNull()
  })
})

describe('haceCuanto', () => {
  const ahora = new Date('2026-10-15T20:00:00.000Z')
  const menos = (ms: number) => new Date(ahora.getTime() - ms).toISOString()

  it.each([
    [menos(20_000), 'recién'],
    [menos(60_000), 'hace 1 minuto'],
    [menos(12 * 60_000), 'hace 12 minutos'],
    [menos(60 * 60_000), 'hace 1 hora'],
    [menos(5 * 60 * 60_000), 'hace 5 horas'],
    [menos(24 * 60 * 60_000), 'hace 1 día'],
    [menos(3 * 24 * 60 * 60_000), 'hace 3 días'],
  ])('%s → %s', (desde, esperado) => {
    expect(haceCuanto(desde, ahora)).toBe(esperado)
  })
})

describe('avisoSinRed', () => {
  it('nunca dice que no se guardó: sin respuesta no se sabe', () => {
    const aviso = avisoSinRed({ tipo: 'guardar' }, true)
    expect(aviso).toContain('no pudimos confirmar')
    expect(aviso).not.toMatch(/no se guardó/)
  })

  it('guardar se reanuda solo', () => {
    expect(avisoSinRed({ tipo: 'guardar' }, true)).toContain('se va a guardar solo')
  })

  it('publicar pregunta, no se reanuda solo', () => {
    const aviso = avisoSinRed({ tipo: 'publicar', publicadaEn: null }, true)
    expect(aviso).toContain('te vamos a preguntar si publicarla')
    expect(aviso).not.toContain('solo')
  })

  it('sin copia en el dispositivo, pide no cerrar la pestaña', () => {
    const aviso = avisoSinRed({ tipo: 'programar', publicarEn: '2026-10-16T12:00:00.000Z' }, false)
    expect(aviso).toContain('No cierres esta pestaña')
    expect(aviso).not.toContain('a salvo')
  })
})

describe('botonParaReanudar', () => {
  it('nombra lo que va a hacer', () => {
    expect(botonParaReanudar({ tipo: 'publicar', publicadaEn: null })).toBe('Publicar ahora')
    expect(botonParaReanudar({ tipo: 'programar', publicarEn: 'x' })).toBe('Programar ahora')
    expect(botonParaReanudar({ tipo: 'guardar' })).toBe('Guardar ahora')
  })
})
