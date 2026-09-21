/**
 * Metadata y datos estructurados de las notas.
 *
 * Lógica pura: recibe la nota y la URL del sitio, y devuelve objetos. No lee
 * `process.env` ni consulta nada, así que se puede testear sin entorno.
 *
 * El sitio viejo se indexa hoy con títulos de 75 caracteres que Google trunca,
 * sin `NewsArticle` y sin canonical. Las tres cosas se arreglan acá.
 */

import type { Equipo, EstadoPartido, NotaConRelaciones, PartidoConEquipos } from '@/types'

export const NOMBRE_SITIO = 'Periódico Delfos'

/** URL absoluta de una nota. Es la canonical y la que va a las redes. */
export function urlDeNota(slug: string, urlSitio: string): string {
  return `${urlSitio.replace(/\/+$/, '')}/nota/${slug}`
}

/**
 * El JSON-LD `NewsArticle` de una nota.
 *
 * `headline` usa el título limpio —sin el sufijo de fecha y temporada que
 * arrastraba WordPress— porque Google lo corta cerca de los 110 caracteres y
 * el sufijo se comía la mitad útil de todos los titulares del sitio.
 *
 * `image` sólo se emite si la nota tiene portada: un `NewsArticle` con
 * `image: null` es peor que uno sin la propiedad.
 */
export function jsonLdNota(nota: NotaConRelaciones, urlSitio: string): Record<string, unknown> {
  const url = urlDeNota(nota.slug, urlSitio)

  const datos: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: nota.titulo,
    description: nota.bajada,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    inLanguage: 'es-AR',
    author: {
      '@type': 'Person',
      name: nota.autor.nombre,
      url: `${urlSitio.replace(/\/+$/, '')}/quienes-somos`,
    },
    publisher: { '@type': 'Organization', name: NOMBRE_SITIO },
  }

  if (nota.publicada_en) {
    datos.datePublished = nota.publicada_en
    // Sin `dateModified` Google asume que nunca se corrigió. Cuando no hubo
    // edición vale lo mismo que la publicación, y es cierto.
    datos.dateModified = nota.updated_at ?? nota.publicada_en
  }

  if (nota.imagen_portada) datos.image = [nota.imagen_portada]

  return datos
}

/**
 * La URL de la imagen OG generada, para las notas que no tienen portada.
 *
 * De las 70 notas que trajo la migración, muchas no tienen imagen: sin esto se
 * comparten como un rectángulo gris con el dominio. La genera `/api/og`.
 *
 * Los parámetros van con `encodeURIComponent` y no concatenados: los títulos de
 * este sitio tienen `&`, `?` y `#` —"Tiburonas 7-0 Laferrere: Semifinales"— y
 * cualquiera de los tres corta el querystring en el lugar equivocado.
 */
export function urlOg(
  { titulo, volanta }: { titulo: string; volanta?: string | null },
  urlSitio: string,
): string {
  const parametros = new URLSearchParams({ titulo })
  if (volanta) parametros.set('volanta', volanta)

  return `${urlSitio.replace(/\/+$/, '')}/api/og?${parametros.toString()}`
}

/**
 * Lo que toda página tiene que emitir en Open Graph y Next no hereda.
 *
 * **Una página que define `openGraph` pisa el del layout raíz entero**, no lo
 * completa: Next mergea la metadata campo por campo y `openGraph` es un campo.
 * El resultado era que `og:site_name` y `og:locale` estaban en la portada —la
 * única que no lo define— y faltaban en las notas, los partidos, las jugadoras
 * y los dos listados. Se encontró leyendo el HTML servido y no el código:
 * mirando los archivos parece que está puesto una vez y alcanza.
 *
 * Y toda página lleva imagen. Sin `images` el enlace se comparte como un
 * rectángulo gris con el dominio, que es exactamente lo que hace hoy el sitio
 * de WordPress. Cuando no hay foto propia va la que genera `/api/og`, que ya
 * existía para las notas sin portada.
 */
export function openGraphBase(
  {
    titulo,
    descripcion,
    volanta,
    imagen,
    alt,
  }: {
    titulo: string
    descripcion?: string | null
    /** La volanta de la imagen generada. Se ignora si hay `imagen`. */
    volanta?: string | null
    imagen?: string | null
    alt?: string | null
  },
  urlSitio: string,
) {
  return {
    siteName: NOMBRE_SITIO,
    locale: 'es_AR',
    title: titulo,
    description: descripcion ?? undefined,
    images: [
      imagen
        ? { url: imagen, alt: alt ?? titulo }
        : { url: urlOg({ titulo, volanta }, urlSitio), alt: titulo },
    ],
  }
}

/** URL absoluta de un partido. */
export function urlDePartido(slug: string, urlSitio: string): string {
  return `${urlSitio.replace(/\/+$/, '')}/partido/${slug}`
}

/**
 * El JSON-LD `SportsEvent` de un partido.
 *
 * Es lo que hace que un partido pueda aparecer en Google como evento y no como
 * una página cualquiera. El sitio viejo no emite nada de esto.
 *
 * `eventStatus` se mapea al vocabulario de schema.org y no se inventa: sólo
 * `postergado` y `suspendido` tienen término propio; `programado`, `en_curso` y
 * `finalizado` son todos `EventScheduled`, que es lo que schema.org entiende
 * por "el evento ocurre como estaba previsto".
 */
const ESTADO_SCHEMA: Record<EstadoPartido, string> = {
  programado: 'https://schema.org/EventScheduled',
  en_curso: 'https://schema.org/EventScheduled',
  finalizado: 'https://schema.org/EventScheduled',
  postergado: 'https://schema.org/EventPostponed',
  suspendido: 'https://schema.org/EventCancelled',
}

function equipoSchema(equipo: Equipo): Record<string, unknown> {
  const datos: Record<string, unknown> = { '@type': 'SportsTeam', name: equipo.nombre }
  if (equipo.escudo_url) datos.logo = equipo.escudo_url
  return datos
}

export function jsonLdPartido(
  partido: PartidoConEquipos,
  urlSitio: string,
): Record<string, unknown> {
  const local = partido.equipo_local
  const visitante = partido.equipo_visitante

  const datos: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${local.nombre} vs ${visitante.nombre}`,
    startDate: partido.fecha_hora,
    eventStatus: ESTADO_SCHEMA[partido.estado],
    url: urlDePartido(partido.slug, urlSitio),
    inLanguage: 'es-AR',
    homeTeam: equipoSchema(local),
    awayTeam: equipoSchema(visitante),
    competitor: [equipoSchema(local), equipoSchema(visitante)],
    superEvent: { '@type': 'SportsOrganization', name: partido.temporada.nombre },
  }

  // La cancha sólo se emite si está cargada: un `Place` sin nombre no sirve de
  // nada y ensucia el dato estructurado.
  if (partido.cancha) {
    datos.location = { '@type': 'Place', name: partido.cancha }
  }

  return datos
}
