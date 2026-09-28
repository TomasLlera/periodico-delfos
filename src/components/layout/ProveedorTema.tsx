'use client'

import { ThemeProvider } from 'next-themes'

/**
 * El tema claro u oscuro, con `next-themes`.
 *
 * Lo que resuelve la biblioteca y no conviene escribir a mano: un script
 * inline en el `<head>` que pone `data-theme` en `<html>` **antes del primer
 * pintado** —sin el parpadeo de crema a negro—, la elección guardada en
 * `localStorage` y el seguimiento de `prefers-color-scheme` mientras nadie
 * elija. `enableColorScheme` suma `color-scheme` en línea, así que scrollbars
 * e inputs nativos acompañan desde el primer frame.
 *
 * Sin JavaScript no hay atributo y manda el media query de `globals.css`.
 */
export function ProveedorTema({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      storageKey="tema"
    >
      {children}
    </ThemeProvider>
  )
}
