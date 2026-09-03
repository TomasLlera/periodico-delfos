/**
 * Las formas que entran y salen de la migración desde WordPress.
 *
 * Lo que entra se valida con Zod aunque venga de nuestro propio sitio viejo: es
 * la diferencia entre que el script se caiga con "el post 2645 no tiene
 * `content.rendered`" y que escriba una nota con el cuerpo en `undefined`.
 * Sólo se declaran los campos que la migración usa; WordPress manda cuarenta
 * más (`yoast_head`, `uagb_*`, `magazineBlocks*`) y Zod los descarta.
 */

import { z } from 'zod'
import type { Categoria, DocumentoTipTap, EstadoNota } from '@/types'

// ============================================
// Lo que devuelve la REST API de WordPress
// ============================================

const textoRenderizado = z.object({ rendered: z.string() })

export const esquemaPostWP = z.object({
  id: z.number(),
  slug: z.string(),
  /** URL vieja completa. Es la fuente de verdad para las 301. */
  link: z.string(),
  status: z.string(),
  /** UTC. `date` viene en la hora local del sitio y sin zona. */
  date_gmt: z.string(),
  modified_gmt: z.string(),
  title: textoRenderizado,
  content: textoRenderizado,
  excerpt: textoRenderizado,
  author: z.number(),
  /** id del adjunto destacado, o 0 si no tiene. */
  featured_media: z.number(),
  categories: z.array(z.number()),
  /**
   * La meta description de Yoast, que en este sitio es la segunda —y única
   * otra— fuente de bajada escrita a mano. Donde el post tiene extracto
   * manual, Yoast lo copia; donde no, a veces hay una escrita sólo para Google.
   */
  yoast_head_json: z
    .object({
      description: z.string().optional(),
      og_description: z.string().optional(),
    })
    .optional(),
})

export const esquemaCategoriaWP = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  link: z.string(),
  parent: z.number(),
})

export const esquemaMediaWP = z.object({
  id: z.number(),
  slug: z.string(),
  source_url: z.string(),
  mime_type: z.string(),
  alt_text: z.string().default(''),
  caption: textoRenderizado.optional(),
  title: textoRenderizado.optional(),
})

export const esquemaAutorWP = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  link: z.string(),
  description: z.string().default(''),
})

export type PostWP = z.infer<typeof esquemaPostWP>
export type CategoriaWP = z.infer<typeof esquemaCategoriaWP>
export type MediaWP = z.infer<typeof esquemaMediaWP>
export type AutorWP = z.infer<typeof esquemaAutorWP>

/** Todo el sitio viejo, ya bajado a disco. */
export interface VolcadoWP {
  posts: PostWP[]
  categorias: CategoriaWP[]
  medios: MediaWP[]
  autores: AutorWP[]
}

// ============================================
// Lo que sale
// ============================================

/**
 * La temporada que se leyó del título.
 *
 * No es un `temporada_id`: los uuid los pone la base y el script los resuelve
 * por `slug` recién al escribir. Hasta entonces la temporada viaja por su
 * nombre, que es lo único que el título del post permite saber.
 */
export interface ReferenciaTemporada {
  /** "Primera B 2026" */
  nombre: string
  /** "primera-b-2026" */
  slug: string
  /** "Primera B" */
  division: string
  anio: number
}

export interface ImagenMigrada {
  /** URL en WordPress, a máxima resolución. */
  origen: string
  /** Ruta dentro del bucket `media`. */
  ruta: string
  /** Vacío significa que hay que escribirlo a mano antes de publicar. */
  alt: string
  epigrafe: string | null
  credito: string | null
  /** id del adjunto en WordPress, cuando se pudo determinar. */
  wpId: number | null
}

export type TipoAdvertencia =
  | 'bajada-faltante'
  | 'alt-faltante'
  | 'categoria-sin-mapear'
  | 'temporada-sin-detectar'
  | 'nodos-descartados'
  | 'datos-deportivos-en-el-cuerpo'
  | 'portada-repetida-en-el-cuerpo'

export interface Advertencia {
  tipo: TipoAdvertencia
  detalle: string
}

/**
 * Una nota lista para insertarse en `notas`, salvo por los uuid.
 *
 * `temporada`, `autorSlug` y las rutas de las imágenes se resuelven contra la
 * base en el momento de escribir. Todo lo demás ya está en su forma final.
 */
export interface NotaMigrada {
  wpId: number
  /** El slug viejo, preservado tal cual. Ver `redirecciones.ts`. */
  slug: string
  /** Path de la URL vieja, con la barra final que usaba WordPress. */
  urlVieja: string
  /** Sin el sufijo de fecha y temporada. */
  titulo: string
  tituloOriginal: string
  /** Vacía cuando WordPress no tenía una escrita a mano. */
  bajada: string
  cuerpo: DocumentoTipTap
  /** Sólo cuando tiene `alt`: la base rechaza una portada sin describir. */
  portada: ImagenMigrada | null
  /**
   * Todas las imágenes que toca la nota, para subirlas al bucket.
   *
   * Incluye las que quedaron afuera de la nota por no tener `alt`: el archivo
   * se sube igual, así cuando se escriba el `alt` y se vuelva a correr sólo
   * falte enlazarlo. Las del cuerpo ya están embebidas en `cuerpo` como nodos
   * `imagen`; esta lista existe para el paso de subida, no para escribir la fila.
   */
  imagenes: ImagenMigrada[]
  categoria: Categoria
  temporada: ReferenciaTemporada | null
  /**
   * El número de fecha que decía el título.
   *
   * `notas` no tiene columna para esto: la fecha es del partido
   * (`partidos.fecha_numero`), y los partidos se cargan a mano desde el admin.
   * Viaja igual para que al vincular la nota con su partido no haya que volver
   * a leer 70 títulos.
   */
  fechaNumero: number | null
  /** "Semifinales", "Postergado", "Cuartos de Final". `null` si era una fecha común. */
  etapa: string | null
  autorSlug: string
  estado: EstadoNota
  publicadaEn: string
  advertencias: Advertencia[]
  /**
   * `false` mientras falte la bajada.
   *
   * La base la exige no vacía (constraint `bajada_no_vacia`), así que una nota
   * incompleta no se puede insertar ni siquiera como borrador: se escribe la
   * bajada a mano y se vuelve a correr.
   */
  listaParaEscribir: boolean
}

export interface Redireccion {
  origen: string
  destino: string
  /** Siempre 301. Regla no negociable 8. */
  permanente: true
}
