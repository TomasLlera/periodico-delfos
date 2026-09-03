/**
 * De un volcado de WordPress a las filas que espera `0005_notas.sql`.
 *
 * Todo lo de acá es puro: entra JSON, sale JSON. No hay red, no hay disco y no
 * hay Supabase, que es lo que permite correr las 70 notas en un test sin
 * credenciales y lo que hace que `scripts/migrate-wp.ts` sea sólo un envoltorio
 * de I/O.
 *
 * Los uuid no se resuelven acá. La temporada viaja por su slug y el autor por
 * el suyo; el script los cambia por ids recién cuando escribe.
 */

import { bajadaDeExtracto } from '@/lib/migracion/bajada'
import { categoriaDesdeWordPress, indiceDeCategorias } from '@/lib/migracion/categorias'
import { htmlATipTap, seccionesDeDatosDeportivos } from '@/lib/migracion/cuerpo'
import type { ImagenCruda } from '@/lib/migracion/extensiones'
import {
  partirEpigrafe,
  rutaEnBucket,
  urlOriginal,
  urlPublicaDeBucket,
} from '@/lib/migracion/imagenes'
import { normalizarEspacios, textoPlano } from '@/lib/migracion/texto'
import { limpiarTitulo } from '@/lib/migracion/titulo'
import type {
  Advertencia,
  ImagenMigrada,
  MediaWP,
  NotaMigrada,
  PostWP,
  VolcadoWP,
} from '@/lib/migracion/tipos'
import type { AtributosImagen } from '@/lib/tiptap/esquema'
import type { EstadoNota } from '@/types'

export interface OpcionesTransformar {
  /**
   * Base del proyecto de Supabase, para armar las URLs públicas del bucket.
   * En seco puede ser cualquier cosa: nada de lo que sale se escribe.
   */
  urlSupabase: string
  /** Bajadas escritas a mano, por slug de nota. Ver `bajadas.json`. */
  bajadas: Readonly<Record<string, string>>
  /** Textos alternativos escritos a mano, por ruta en el bucket. Ver `alt.json`. */
  alts: Readonly<Record<string, string>>
  /** Slug en la tabla `autores` al que se atribuyen las notas. */
  autorSlug: string
}

export interface ResultadoMigracion {
  notas: NotaMigrada[]
  /** Cada imagen una sola vez, aunque la usen varias notas. */
  imagenes: ImagenMigrada[]
  /** Slugs de categoría de WordPress sin equivalente en `categoria_t`. */
  categoriasSinMapear: string[]
  /** Nodos que se tiraron al podar, sumados sobre todas las notas. */
  descartados: Record<string, number>
}

/** El primero que tenga algo escrito. */
function primerTexto(...candidatos: (string | null | undefined)[]): string {
  for (const candidato of candidatos) {
    const texto = normalizarEspacios(candidato ?? '')
    if (texto !== '') return texto
  }
  return ''
}

/** `date_gmt` viene sin zona pero es UTC. Sin la Z se lee como hora local. */
function aISO(fechaGmt: string): string {
  const con = /[zZ]|[+-]\d{2}:?\d{2}$/.test(fechaGmt) ? fechaGmt : `${fechaGmt}Z`
  const fecha = new Date(con)
  return Number.isNaN(fecha.getTime()) ? new Date(0).toISOString() : fecha.toISOString()
}

/** Lo que se va juntando de una nota mientras se la recorre. */
interface Registro {
  imagenes: ImagenMigrada[]
  sinAlt: string[]
  portadaRepetida: boolean
}

interface Contexto {
  opciones: OpcionesTransformar
  medios: ReadonlyMap<number, MediaWP>
  categorias: ReadonlyMap<number, string>
}

/**
 * Arma la imagen a partir de lo que dijo el HTML y de lo que sabe el índice de
 * medios, que es más confiable: tiene el `alt_text` cargado en la biblioteca y
 * el `source_url` del archivo original, no el de la variante escalada que
 * WordPress mete en el cuerpo.
 */
function imagenDesde(cruda: Pick<ImagenCruda, 'src' | 'alt' | 'epigrafe' | 'wpId'>, contexto: Contexto): ImagenMigrada {
  const medio = cruda.wpId === null ? undefined : contexto.medios.get(cruda.wpId)
  const origen = medio?.source_url ?? urlOriginal(cruda.src)
  const ruta = rutaEnBucket(origen)

  const { epigrafe, credito } = partirEpigrafe(
    primerTexto(cruda.epigrafe, textoPlano(medio?.caption?.rendered ?? '')),
  )

  return {
    origen,
    ruta,
    // El alt escrito a mano gana: es el que se agregó justamente porque
    // WordPress no lo tenía.
    alt: primerTexto(contexto.opciones.alts[ruta], medio?.alt_text, cruda.alt),
    epigrafe,
    credito,
    wpId: cruda.wpId,
  }
}

/**
 * Resuelve cada imagen del cuerpo, o la descarta.
 *
 * Se descarta en dos casos y los dos se anotan:
 *
 * - **Sin `alt`.** Regla no negociable 4. La base ni siquiera la aceptaría
 *   (constraint `alt_requerido`).
 * - **Ya está como portada.** WordPress repite la imagen destacada como primer
 *   `<figure>` del cuerpo en las 53 crónicas: la página de la nota la mostraría
 *   dos veces, una arriba del título y otra tres párrafos abajo.
 *
 * La imagen se registra igual para que el script la suba: cuando se escriba el
 * `alt` a mano y se vuelva a correr, el archivo ya va a estar en el bucket.
 */
function crearResolverImagen(
  contexto: Contexto,
  registro: Registro,
  portadaWpId: number | null,
): (cruda: ImagenCruda) => AtributosImagen | null {
  return (cruda) => {
    if (portadaWpId !== null && cruda.wpId === portadaWpId) {
      registro.portadaRepetida = true
      return null
    }

    const imagen = imagenDesde(cruda, contexto)
    registro.imagenes.push(imagen)

    if (imagen.alt === '') {
      registro.sinAlt.push(imagen.ruta)
      return null
    }

    return {
      src: urlPublicaDeBucket(contexto.opciones.urlSupabase, imagen.ruta),
      alt: imagen.alt,
      epigrafe: imagen.epigrafe,
      credito: imagen.credito,
    }
  }
}

/** Lo que sale de una nota y además hace falta sumar sobre todas. */
interface PostTransformado {
  nota: NotaMigrada
  descartados: Record<string, number>
  categoriasSinMapear: readonly string[]
}

function transformarPost(post: PostWP, contexto: Contexto): PostTransformado {
  const advertencias: Advertencia[] = []
  const registro: Registro = { imagenes: [], sinAlt: [], portadaRepetida: false }

  // ── Título, fecha y temporada ──────────────────────────────
  const titulo = limpiarTitulo(post.title.rendered)
  if (!titulo.temporada) {
    advertencias.push({
      tipo: 'temporada-sin-detectar',
      detalle: 'El título no dice el torneo: hay que elegir la temporada a mano.',
    })
  }

  // ── Categoría ──────────────────────────────────────────────
  const slugsDeCategoria = post.categories
    .map((id) => contexto.categorias.get(id))
    .filter((slug): slug is string => slug !== undefined)

  const categoria = categoriaDesdeWordPress(slugsDeCategoria)
  if (categoria.sinMapear.length > 0) {
    advertencias.push({
      tipo: 'categoria-sin-mapear',
      detalle: `Sin equivalente en categoria_t: ${categoria.sinMapear.join(', ')}. Quedó en "${categoria.categoria}".`,
    })
  }

  // ── Portada ────────────────────────────────────────────────
  const medioPortada = post.featured_media === 0 ? undefined : contexto.medios.get(post.featured_media)

  let portada: ImagenMigrada | null = null
  if (medioPortada) {
    portada = imagenDesde(
      {
        src: medioPortada.source_url,
        alt: medioPortada.alt_text,
        epigrafe: textoPlano(medioPortada.caption?.rendered ?? ''),
        wpId: medioPortada.id,
      },
      contexto,
    )
    registro.imagenes.push(portada)
    if (portada.alt === '') registro.sinAlt.push(portada.ruta)
  }

  // ── Cuerpo ─────────────────────────────────────────────────
  const cuerpo = htmlATipTap(post.content.rendered, {
    resolverImagen: crearResolverImagen(contexto, registro, medioPortada?.id ?? null),
  })

  if (Object.keys(cuerpo.descartados).length > 0) {
    const detalle = Object.entries(cuerpo.descartados)
      .map(([tipo, cuantos]) => `${tipo}×${cuantos}`)
      .join(', ')
    advertencias.push({ tipo: 'nodos-descartados', detalle })
  }

  if (registro.portadaRepetida) {
    advertencias.push({
      tipo: 'portada-repetida-en-el-cuerpo',
      detalle: 'La imagen destacada también abría el cuerpo. Se dejó sólo como portada.',
    })
  }

  const secciones = seccionesDeDatosDeportivos(cuerpo.documento)
  if (secciones.length > 0) {
    advertencias.push({
      tipo: 'datos-deportivos-en-el-cuerpo',
      detalle: secciones.join(' · '),
    })
  }

  // ── Bajada ─────────────────────────────────────────────────
  // Tres fuentes, en orden de confianza: la escrita a mano en `bajadas.json`,
  // el extracto manual de WordPress y la meta description de Yoast. Las dos
  // últimas pasan por el mismo filtro; ninguna se acepta sólo por existir.
  const cuerpoPlano = textoPlano(post.content.rendered)
  const aMano = normalizarEspacios(contexto.opciones.bajadas[post.slug] ?? '')
  const delExtracto = bajadaDeExtracto(post.excerpt.rendered, cuerpoPlano)
  const deYoast = bajadaDeExtracto(
    primerTexto(post.yoast_head_json?.description, post.yoast_head_json?.og_description),
    cuerpoPlano,
  )
  const bajada = primerTexto(aMano, delExtracto.bajada, deYoast.bajada)

  if (bajada === '') {
    advertencias.push({
      tipo: 'bajada-faltante',
      detalle: `El extracto de WordPress no sirve (${delExtracto.motivo}). Hay que escribirla.`,
    })
  }

  // ── Alt pendiente ──────────────────────────────────────────
  const sinAlt = [...new Set(registro.sinAlt)]
  if (sinAlt.length > 0) {
    advertencias.push({ tipo: 'alt-faltante', detalle: sinAlt.join(', ') })
  }

  // Ninguna nota se publica con un `alt` pendiente (regla no negociable 4): la
  // imagen no se guarda —la base la rechazaría— y la nota espera en borrador en
  // vez de salir sin su foto.
  const estado: EstadoNota = post.status === 'publish' && sinAlt.length === 0 ? 'publicada' : 'borrador'

  return {
    nota: {
      wpId: post.id,
      slug: post.slug,
      urlVieja: post.link,
      titulo: titulo.titulo,
      tituloOriginal: titulo.original,
      bajada,
      cuerpo: cuerpo.documento,
      // Sin `alt` la portada no se guarda: la base la rechazaría. La nota queda
      // en borrador (arriba) hasta que se escriba. El archivo se sube igual, y
      // por eso sigue estando en `imagenes`.
      portada: portada && portada.alt !== '' ? portada : null,
      imagenes: registro.imagenes,
      categoria: categoria.categoria,
      temporada: titulo.temporada,
      fechaNumero: titulo.fechaNumero,
      etapa: titulo.etapa,
      autorSlug: contexto.opciones.autorSlug,
      estado,
      publicadaEn: aISO(post.date_gmt),
      advertencias,
      listaParaEscribir: bajada !== '',
    },
    descartados: cuerpo.descartados,
    categoriasSinMapear: categoria.sinMapear,
  }
}

export function transformarVolcado(
  volcado: VolcadoWP,
  opciones: OpcionesTransformar,
): ResultadoMigracion {
  const contexto: Contexto = {
    opciones,
    medios: new Map(volcado.medios.map((medio) => [medio.id, medio])),
    categorias: indiceDeCategorias(volcado.categorias),
  }

  const transformados = volcado.posts.map((post) => transformarPost(post, contexto))

  const imagenes = new Map<string, ImagenMigrada>()
  const descartados = new Map<string, number>()
  const categoriasSinMapear = new Set<string>()

  for (const { nota, ...resto } of transformados) {
    for (const imagen of nota.imagenes) {
      // Una misma foto puede aparecer en dos notas. Se queda la versión que
      // tenga el `alt` escrito, si alguna lo tiene.
      const anterior = imagenes.get(imagen.ruta)
      if (!anterior || (anterior.alt === '' && imagen.alt !== '')) {
        imagenes.set(imagen.ruta, imagen)
      }
    }

    for (const [tipo, cuantos] of Object.entries(resto.descartados)) {
      descartados.set(tipo, (descartados.get(tipo) ?? 0) + cuantos)
    }

    for (const slug of resto.categoriasSinMapear) categoriasSinMapear.add(slug)
  }

  return {
    notas: transformados.map(({ nota }) => nota),
    imagenes: [...imagenes.values()],
    categoriasSinMapear: [...categoriasSinMapear].sort(),
    descartados: Object.fromEntries(descartados),
  }
}
