/**
 * Los colores que JavaScript necesita como valor y no como clase.
 *
 * La fuente de verdad de la paleta es `src/app/globals.css`: los componentes
 * usan siempre las utilidades del tema (`bg-bg`, `text-text-muted`). Esto
 * existe sólo para los dos lugares que no pueden leer una variable CSS:
 *
 * - La imagen de `/api/og`, que es un PNG: no hay tema ni CSS en una tarjeta
 *   de Twitter.
 * - El `<meta name="theme-color">`, que colorea la barra del navegador y
 *   acepta un color literal, no un `var()`.
 *
 * Cada valor repite un token de `globals.css`, y `colores.test.ts` falla si
 * alguno se desincroniza.
 */

/** `--header-bg` en cada tema: la barra del navegador empalma con la cabecera. */
export const COLOR_BARRA_NAVEGADOR = {
  light: '#1a1a1a',
  dark: '#181818',
} as const

/** Los tokens `--block-*` del tema claro: la tarjeta es un bloque oscuro. */
export const COLORES_OG = {
  fondo: '#1a1a1a',
  texto: '#f2f0ea',
  acento: '#c9a24a',
} as const

export type Tema = keyof typeof COLOR_BARRA_NAVEGADOR
