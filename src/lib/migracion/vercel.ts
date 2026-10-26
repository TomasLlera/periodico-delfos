/**
 * Traduce las `Redireccion` que arma `redirecciones.ts` al vocabulario que lee
 * `vercel.json`. La usa `scripts/generate-redirects.ts`, que es sólo I/O.
 */

import type { Redireccion } from '@/lib/migracion/tipos'

/** Una regla en el vocabulario de `vercel.json`. */
export interface RedireccionVercel {
  source: string
  destination: string
  permanent: true
}

/**
 * `origen` siempre trae la barra final que usaba WordPress (`/mi-nota/`) y
 * `destino` nunca la tiene (`/nota/mi-nota`).
 *
 * **`source` va SIN la barra final, y no es estética.** Antes iba el `origen`
 * tal cual, con la idea de que Vercel lo matchea literal contra la URL vieja.
 * No pasa eso: en producción Next contesta primero, con su 308 de
 * `trailingSlash: false` (`/mi-nota/` → `/mi-nota`), y recién después se miran
 * las reglas. La URL sin barra no matcheaba ninguna y las 82 terminaban en 404
 * (medido el 26/10/2026 contra periodico-delfos.vercel.app).
 *
 * Sin la barra, `/mi-nota/` hace 308 → `/mi-nota` y la regla 301 →
 * `/nota/mi-nota`. Son dos saltos y Google los sigue; y `/mi-nota` sin barra,
 * que también circula, entra directo.
 */
export function formatoVercel(redirecciones: readonly Redireccion[]): RedireccionVercel[] {
  const vistos = new Set<string>()

  for (const { origen, destino } of redirecciones) {
    const source = sinBarraFinal(origen)
    // Se compara ya sin la barra: `/a/` y `/a` serían la misma regla.
    if (vistos.has(source)) {
      throw new Error(`Dos redirecciones con el mismo origen: ${origen}`)
    }
    vistos.add(source)

    if (source === sinBarraFinal(destino)) {
      throw new Error(`Redirección a sí misma (loop de 301): ${origen}`)
    }
  }

  return redirecciones.map(({ origen, destino, permanente }) => ({
    source: sinBarraFinal(origen),
    destination: destino,
    permanent: permanente,
  }))
}

/** `/mi-nota/` → `/mi-nota`. La raíz se queda como está: sin barra no hay ruta. */
export function sinBarraFinal(ruta: string): string {
  return ruta.length > 1 && ruta.endsWith('/') ? ruta.slice(0, -1) : ruta
}
