import type { MetadataRoute } from 'next'
import { getSlugsJugadoras } from '@/lib/supabase/queries/jugadoras'
import { getSlugsNotas } from '@/lib/supabase/queries/notas'
import { getSlugsPartidos } from '@/lib/supabase/queries/partidos'
import { getSlugsTemporadas } from '@/lib/supabase/queries/temporadas'
import { haySupabase } from '@/lib/supabase/server'
import { urlDelSitio } from '@/lib/sitio'

const SITE_URL = urlDelSitio()

/**
 * Las rutas que existen aunque la base esté vacía. No llevan `lastModified`:
 * inventar una fecha de modificación es peor que no darla, porque un buscador
 * la usa para decidir cuándo volver.
 */
const FIJAS = [
  { ruta: '/', priority: 1 },
  { ruta: '/cronicas', priority: 0.8 },
  { ruta: '/analisis', priority: 0.8 },
  { ruta: '/quienes-somos', priority: 0.5 },
] as const

/**
 * El sitemap.
 *
 * **Tiene que funcionar sin proyecto de Supabase**, como `generateStaticParams`
 * de `/nota/[slug]`: si la base no está, salen las rutas fijas y nada más. Un
 * sitemap que revienta el build es peor que uno corto.
 *
 * `/contacto` y `/privacidad` **no están todavía**: las rutas no existen y un
 * sitemap que apunta a un 404 le enseña al crawler a desconfiar del archivo.
 * Entran cuando entren las páginas.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL.replace(/\/+$/, '')

  const fijas: MetadataRoute.Sitemap = FIJAS.map(({ ruta, priority }) => ({
    url: `${base}${ruta}`,
    changeFrequency: ruta === '/' ? 'daily' : 'weekly',
    priority,
  }))

  if (!haySupabase()) return fijas

  const [notas, partidos, jugadoras, temporadas] = await Promise.all([
    getSlugsNotas(),
    getSlugsPartidos(),
    getSlugsJugadoras(),
    getSlugsTemporadas(),
  ])

  return [
    ...fijas,
    ...notas.map(({ slug, updated_at }) => ({
      url: `${base}/nota/${slug}`,
      lastModified: new Date(updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    })),
    ...partidos.map(({ slug }) => ({
      url: `${base}/partido/${slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...jugadoras.map(({ slug }) => ({
      url: `${base}/jugadora/${slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    // Las dos páginas de cada temporada. La de temporada cambia cada fecha
    // —fixture, tabla y goleadoras— y el plantel casi nunca.
    ...temporadas.flatMap(({ slug }) => [
      {
        url: `${base}/temporada/${slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      },
      {
        url: `${base}/plantel/${slug}`,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      },
    ]),
  ]
}
