import { describe, expect, it } from 'vitest'
import {
  decodificarEntidades,
  normalizarEspacios,
  sinDiacriticos,
  textoPlano,
} from '@/lib/migracion/texto'

describe('decodificarEntidades', () => {
  it('resuelve las que usa WordPress en los títulos', () => {
    expect(decodificarEntidades('Fecha N°12 &#8211; Aldosivi')).toBe('Fecha N°12 – Aldosivi')
    expect(decodificarEntidades('Post &#8211; Peri&oacute;dico Delfos')).toBe(
      'Post – Periódico Delfos',
    )
    expect(decodificarEntidades('Tigre &amp; Quilmes')).toBe('Tigre & Quilmes')
    expect(decodificarEntidades('&#x2013; y &#x26;')).toBe('– y &')
  })

  it('no decodifica dos veces', () => {
    // `&amp;#8211;` es la sarta literal "&#8211;", no una raya.
    expect(decodificarEntidades('&amp;#8211;')).toBe('&#8211;')
  })

  it('deja intacto lo que no reconoce', () => {
    expect(decodificarEntidades('&noexiste; &#999999999;')).toBe('&noexiste; &#999999999;')
  })
})

describe('normalizarEspacios', () => {
  it('colapsa todo blanco a un espacio', () => {
    expect(normalizarEspacios('  hola \n\t mundo  ')).toBe('hola mundo')
  })
})

describe('textoPlano', () => {
  it('saca las etiquetas y resuelve las entidades', () => {
    expect(textoPlano('<p>Ganaron 2 &#8211; 1.</p>\n')).toBe('Ganaron 2 – 1.')
  })

  it('no pega la última palabra de un bloque con la primera del siguiente', () => {
    expect(textoPlano('<p>Uno</p><p>Dos</p>')).toBe('Uno Dos')
  })

  it('descarta el contenido de script y style', () => {
    expect(textoPlano('<style>p{color:red}</style><p>Texto</p>')).toBe('Texto')
  })
})

describe('sinDiacriticos', () => {
  it('quita tildes y eñes para armar nombres de archivo', () => {
    expect(sinDiacriticos('Campeón Añejo')).toBe('Campeon Anejo')
  })
})
