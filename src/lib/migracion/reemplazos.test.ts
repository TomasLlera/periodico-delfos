import { describe, expect, it } from 'vitest'
import { REEMPLAZOS, slugQueReemplaza } from '@/lib/migracion/reemplazos'
import { redireccionesDeNotas } from '@/lib/migracion/redirecciones'
import type { NotaMigrada } from '@/lib/migracion/tipos'

function nota(slug: string, reemplazadaPor: string | null): NotaMigrada {
  return {
    slug,
    urlVieja: `https://periodicodelfos.com/${slug}/`,
    wpId: 1,
    titulo: 't',
    tituloOriginal: 't',
    bajada: 'b',
    cuerpo: { type: 'doc', content: [] },
    portada: null,
    imagenes: [],
    categoria: 'cronica',
    temporada: null,
    fechaNumero: null,
    etapa: null,
    autorSlug: 'charlie-redondo',
    estado: 'publicada',
    publicadaEn: '2026-04-11T18:30:00.000Z',
    advertencias: [],
    listaParaEscribir: true,
    reemplazadaPor,
  }
}

describe('REEMPLAZOS', () => {
  it('son las tres crónicas de abril de 2026 que se reescribieron a mano', () => {
    expect(Object.keys(REEMPLAZOS)).toHaveLength(3)
  })

  it('ningún destino está vacío: un reemplazo sin destino es una 301 a /nota/', () => {
    for (const destino of Object.values(REEMPLAZOS)) {
      expect(destino.trim()).not.toBe('')
    }
  })

  it('ningún slug se reemplaza por sí mismo', () => {
    for (const [viejo, nuevo] of Object.entries(REEMPLAZOS)) {
      expect(nuevo).not.toBe(viejo)
    }
  })

  it('ningún destino es a su vez un slug reemplazado: la 301 no puede encadenarse', () => {
    for (const destino of Object.values(REEMPLAZOS)) {
      expect(REEMPLAZOS[destino]).toBeUndefined()
    }
  })
})

describe('slugQueReemplaza', () => {
  it('encuentra el slug nuevo de una nota reescrita', () => {
    expect(
      slugQueReemplaza('all-boys-6-1-tiburonas-fecha-n2-aldosivi-en-la-primera-b-2026'),
    ).toBe('dura-derrota-para-las-tiburonas-6-a-1-frente-a-all-boys')
  })

  it('devuelve null para una nota que se migra normal', () => {
    expect(slugQueReemplaza('tiburonas-6-1-claypole-fecha-n4')).toBeNull()
  })

  it('tolera la barra final y las mayúsculas que trae un slug copiado del navegador', () => {
    expect(slugQueReemplaza('/All-Boys-6-1-Tiburonas-Fecha-N2-Aldosivi-En-La-Primera-B-2026/')).toBe(
      'dura-derrota-para-las-tiburonas-6-a-1-frente-a-all-boys',
    )
  })

  it('un destino vacío en la tabla no reemplaza nada', () => {
    expect(slugQueReemplaza('vieja', { vieja: '   ' })).toBeNull()
  })
})

describe('la 301 de una nota reemplazada', () => {
  it('apunta a la nota nueva, no al slug viejo que nunca va a existir', () => {
    const redirecciones = redireccionesDeNotas([nota('vieja', 'la-nueva')])

    expect(redirecciones).toEqual([
      { origen: '/vieja/', destino: '/nota/la-nueva', permanente: true },
    ])
  })

  it('una nota normal sigue redirigiendo a su propio slug', () => {
    expect(redireccionesDeNotas([nota('normal', null)])[0]?.destino).toBe('/nota/normal')
  })
})
