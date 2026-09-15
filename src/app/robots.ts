import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/**
 * `/admin` y `/demo` quedan fuera del índice.
 *
 * `/demo` es tan importante como `/admin`: son las páginas con datos
 * inventados —marcadores, goles, posiciones— y que se indexen sería publicar
 * datos deportivos falsos con el dominio del medio. Cada página de demo además
 * lleva su propio `robots: { index: false }`, así que están tapadas por dos
 * lados; esto es lo que además evita que las rastreen.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/admin/', '/demo', '/demo/', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
