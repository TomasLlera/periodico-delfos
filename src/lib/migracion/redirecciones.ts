/**
 * El mapa de URLs viejas → nuevas, que después consume
 * `scripts/generate-redirects.ts` para escribir `vercel.json`.
 *
 * Regla no negociable 8: **toda URL vieja de WordPress redirige 301**. El
 * blueprint es explícito en que esto es lo que más caro sale omitir —"hay
 * posicionamiento acumulado; sin las 301 se pierde entero"—, y son cuatro años
 * de crónicas indexadas.
 *
 * Los slugs de las notas **se preservan tal cual**. Son largos y repiten el
 * sufijo que se le saca al título (`…-fecha-n12-aldosivi-femenino-en-la-primera-b-2026`),
 * y aun así conviene: acortarlos obligaría a una 301 igual, no mejora el
 * posicionamiento de una URL que ya está indexada, y rompería cualquier link
 * que alguien haya compartido. El sufijo molesta en el título, que es lo que se
 * lee; en la barra de direcciones no lo mira nadie.
 */

import type { Categoria } from '@/types'
import type { NotaMigrada, Redireccion } from '@/lib/migracion/tipos'

/**
 * Normaliza un permalink de WordPress al path que va a matchear Vercel.
 *
 * Se usa el campo `link` de la REST API y no `/${slug}/` armado a mano porque
 * `link` es la URL que WordPress realmente sirve y la que está indexada, sea
 * cual sea la estructura de permalinks configurada.
 */
export function pathDeUrl(url: string): string {
  try {
    const { pathname } = new URL(url)
    return pathname === '' ? '/' : pathname
  } catch {
    // Ya venía como path.
    return url.startsWith('/') ? url : `/${url}`
  }
}

/** Una nota vieja → su lugar nuevo. Los slugs no cambian. */
export function redireccionesDeNotas(notas: readonly NotaMigrada[]): Redireccion[] {
  return notas.map((nota) => ({
    origen: pathDeUrl(nota.urlVieja),
    destino: `/nota/${nota.slug}`,
    permanente: true,
  }))
}

/**
 * A dónde va cada archivo de categoría.
 *
 * Sólo crónicas y análisis tienen listado propio (blueprint 7.1). El resto
 * —aniversario, planteles, temporadas— no tiene una ruta equivalente: mandarlas
 * a la portada es preferible a un 404, y a inventar `/temporadas` para que
 * quede lindo el mapa.
 */
const DESTINO_POR_CATEGORIA: Readonly<Record<Categoria, string>> = {
  cronica: '/cronicas',
  analisis: '/analisis',
  temporada: '/',
  plantel: '/',
  institucional: '/',
}

export function redireccionesDeCategorias(
  categorias: readonly { link: string; slug: string }[],
  categoriaDe: (slug: string) => Categoria,
): Redireccion[] {
  return categorias.map((categoria) => ({
    origen: pathDeUrl(categoria.link),
    destino: DESTINO_POR_CATEGORIA[categoriaDe(categoria.slug)],
    permanente: true,
  }))
}

/** `/author/:slug/` → `/quienes-somos`. Lo escribe una sola persona. */
export function redireccionesDeAutores(
  autores: readonly { link: string }[],
): Redireccion[] {
  return autores.map((autor) => ({
    origen: pathDeUrl(autor.link),
    destino: '/quienes-somos',
    permanente: true,
  }))
}

/**
 * Rutas que genera WordPress y que no salen de ningún listado de la API.
 *
 * El feed importa: hay lectores y agregadores suscriptos, y un 404 ahí es una
 * baja silenciosa.
 */
export const REDIRECCIONES_FIJAS: readonly Redireccion[] = [
  { origen: '/feed/', destino: '/', permanente: true },
  { origen: '/category/', destino: '/', permanente: true },
  { origen: '/author/', destino: '/quienes-somos', permanente: true },
]

/**
 * Junta todo y saca los duplicados.
 *
 * Dos reglas con el mismo `origen` en `vercel.json` no rompen nada pero
 * esconden un error de armado, y la primera gana en silencio. Se queda la
 * primera y se avisa acá arriba, no en producción.
 */
export function unificarRedirecciones(
  ...grupos: readonly (readonly Redireccion[])[]
): Redireccion[] {
  const porOrigen = new Map<string, Redireccion>()

  for (const grupo of grupos) {
    for (const redireccion of grupo) {
      if (!porOrigen.has(redireccion.origen)) porOrigen.set(redireccion.origen, redireccion)
    }
  }

  return [...porOrigen.values()].sort((a, b) => a.origen.localeCompare(b.origen))
}
