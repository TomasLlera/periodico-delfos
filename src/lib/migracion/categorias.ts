/**
 * Las categorías de WordPress → el enum `categoria_t` de `0005_notas.sql`.
 *
 * El mapeo va por **slug y no por id**: los ids son de esta instalación de
 * WordPress y no significan nada fuera de ella, así que un mapa `{ 44:
 * 'cronica' }` sería ilegible y se rompería en cuanto alguien tocara una
 * categoría desde el admin viejo.
 */

import type { Categoria } from '@/types'

/**
 * Slugs de WordPress con su equivalente.
 *
 * `aniversario` y `entrevistas` no tienen enum propio y caen en
 * `institucional` a propósito, no por descarte: son notas del medio sobre sí
 * mismo o sobre el club, no crónicas ni análisis. El informe imprime esta tabla
 * entera para que la decisión se vea, no se adivine.
 */
export const MAPA_CATEGORIAS: Readonly<Record<string, Categoria>> = {
  cronicas: 'cronica',
  cronica: 'cronica',
  analisis: 'analisis',
  temporadas: 'temporada',
  temporada: 'temporada',
  planteles: 'plantel',
  plantel: 'plantel',
  aniversario: 'institucional',
  entrevistas: 'institucional',
  institucional: 'institucional',
  uncategorized: 'institucional',
  'sin-categoria': 'institucional',
}

/**
 * Las que están en casi todas las notas y por lo tanto no distinguen nada.
 *
 * `futbol-femenino` es la categoría padre y está en 69 de 70 notas: si contara
 * para el mapeo, ninguna nota tendría categoría propia.
 */
const GENERICAS: ReadonlySet<string> = new Set(['futbol-femenino'])

/**
 * Cuando una nota tiene varias, gana la más específica.
 *
 * Una nota en `analisis` + `aniversario` es un análisis; al revés sería una
 * institucional que nadie encuentra en el listado de análisis.
 */
const PRIORIDAD: readonly Categoria[] = [
  'cronica',
  'analisis',
  'temporada',
  'plantel',
  'institucional',
]

export interface MapeoCategoria {
  categoria: Categoria
  /** Slugs sin equivalente. El script los lista al terminar. */
  sinMapear: string[]
}

/**
 * La categoría de una nota a partir de los slugs que tenía en WordPress.
 *
 * Lo que no mapea cae en `institucional` —el destino menos comprometido, que no
 * mete una nota cualquiera en el listado de crónicas— y se reporta.
 */
export function categoriaDesdeWordPress(slugs: readonly string[]): MapeoCategoria {
  const significativos = slugs.filter((slug) => !GENERICAS.has(slug))

  const encontradas = new Set<Categoria>()
  const sinMapear: string[] = []

  for (const slug of significativos) {
    const categoria = MAPA_CATEGORIAS[slug]
    if (categoria) {
      encontradas.add(categoria)
    } else {
      sinMapear.push(slug)
    }
  }

  const categoria = PRIORIDAD.find((candidata) => encontradas.has(candidata))

  return { categoria: categoria ?? 'institucional', sinMapear }
}

/** Índice `id → slug` para traducir el array `categories` de cada post. */
export function indiceDeCategorias(
  categorias: readonly { id: number; slug: string }[],
): ReadonlyMap<number, string> {
  return new Map(categorias.map((categoria) => [categoria.id, categoria.slug]))
}
