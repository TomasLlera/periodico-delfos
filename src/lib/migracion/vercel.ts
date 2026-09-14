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
 * `destino` nunca la tiene (`/nota/mi-nota`) — son rutas de sitios distintos,
 * no una elección a armonizar. Vercel matchea `source` en forma literal contra
 * la URL entrante, así que una sola regla con el `origen` tal cual alcanza:
 * es exactamente la URL vieja que Google tiene indexada y que hay que
 * interceptar. No hace falta emitir las dos formas ni depender de
 * `trailingSlash` de Next, que sólo gobierna las rutas nuevas.
 */
export function formatoVercel(redirecciones: readonly Redireccion[]): RedireccionVercel[] {
  const vistos = new Set<string>()

  for (const { origen, destino } of redirecciones) {
    if (vistos.has(origen)) {
      throw new Error(`Dos redirecciones con el mismo origen: ${origen}`)
    }
    vistos.add(origen)

    if (origen === destino) {
      throw new Error(`Redirección a sí misma (loop de 301): ${origen}`)
    }
  }

  return redirecciones.map(({ origen, destino, permanente }) => ({
    source: origen,
    destination: destino,
    permanent: permanente,
  }))
}
