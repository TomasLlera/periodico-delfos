/**
 * Metadata y datos estructurados de las notas.
 *
 * Lógica pura: recibe la nota y la URL del sitio, y devuelve objetos. No lee
 * `process.env` ni consulta nada, así que se puede testear sin entorno.
 *
 * El sitio viejo se indexa hoy con títulos de 75 caracteres que Google trunca,
 * sin `NewsArticle` y sin canonical. Las tres cosas se arreglan acá.
 */

import type { NotaConRelaciones } from '@/types'

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
