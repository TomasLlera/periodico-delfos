import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { COLOR_BARRA_NAVEGADOR, COLORES_OG } from './colores'

const css = readFileSync(fileURLToPath(new URL('../app/globals.css', import.meta.url)), 'utf8')

/** El valor de un token dentro del primer bloque que abre con `selector`. */
function token(selector: string, nombre: string): string | undefined {
  const inicio = css.indexOf(`${selector} {`)
  if (inicio === -1) return undefined
  const bloque = css.slice(inicio, css.indexOf('}', inicio))
  return bloque.match(new RegExp(`--${nombre}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1]?.toLowerCase()
}

describe('colores para JavaScript', () => {
  it('la barra del navegador es --block-bg de cada tema (--header-bg lo toma de ahí)', () => {
    expect(token(':root', 'block-bg')).toBe(COLOR_BARRA_NAVEGADOR.light)
    expect(token(":root[data-theme='dark']", 'block-bg')).toBe(COLOR_BARRA_NAVEGADOR.dark)
  })

  it('la imagen OG usa los --block-* del tema claro', () => {
    expect(token(':root', 'block-bg')).toBe(COLORES_OG.fondo)
    expect(token(':root', 'block-text')).toBe(COLORES_OG.texto)
    expect(token(':root', 'block-accent')).toBe(COLORES_OG.acento)
  })

  it('el oscuro sin JavaScript repite exactamente el de data-theme', () => {
    const conAtributo = css.slice(css.indexOf(":root[data-theme='dark'] {"))
    const sinAtributo = css.slice(css.indexOf(':root:not([data-theme]) {'))
    const valores = (bloque: string) =>
      bloque.slice(0, bloque.indexOf('}')).match(/--[a-z-]+:\s*#[0-9a-f]{6}/gi)
    expect(valores(sinAtributo)).toEqual(valores(conAtributo))
  })
})
