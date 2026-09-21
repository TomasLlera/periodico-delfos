/**
 * La página de una nota. Step 8 del Build Order.
 *
 * Server Component puro de datos: lee, resuelve las planillas embebidas y le
 * pasa todo a `<ArticuloNota />`, que no consulta nada. La separación es lo que
 * permite mirar el artículo con datos falsos en `/demo/articulo`.
 *
 * SSG + ISR 60s (blueprint 7.1): las notas se prerrenderizan y se revalidan
 * solas; al publicar, el Server Action además revalida la ruta a mano.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArticuloNota } from '@/components/content/ArticuloNota'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { etiquetaCategoria } from '@/lib/formato'
import { jsonLdNota, openGraphBase, urlDeNota } from '@/lib/seo'
import { getNotaPorSlug, getNotasRelacionadas, getSlugsNotas } from '@/lib/supabase/queries/notas'
import { getPartidosPorIds } from '@/lib/supabase/queries/partidos'
import { haySupabase } from '@/lib/supabase/server'
import { mapaDePartidos } from '@/lib/tiptap/render'
import { partidoIdsDelCuerpo } from '@/lib/tiptap/esquema'

export const revalidate = 60

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/**
 * Sin proyecto de Supabase no se prerenderiza ninguna nota y cada una se
 * sirve a demanda (`dynamicParams` queda en su valor por omisión). El build no
 * puede depender de que haya una base alcanzable: hoy no la hay.
 */
export async function generateStaticParams() {
  if (!haySupabase()) return []

  const notas = await getSlugsNotas()
  return notas.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  if (!haySupabase()) return { title: 'Nota' }

  const { slug } = await params
  const nota = await getNotaPorSlug(slug)

  if (!nota) return { title: 'Nota no encontrada' }

  const url = urlDeNota(nota.slug, SITE_URL)

  return {
    title: nota.titulo,
    description: nota.bajada,
    alternates: { canonical: url },
    openGraph: {
      // `imagen_alt` es obligatorio en la base, así que si hay portada hay alt.
      // Las notas que no la tienen —son varias de las 70 que trajo la
      // migración— se comparten con la imagen que genera `/api/og`, en lugar
      // del rectángulo gris con el dominio que muestran hoy.
      ...openGraphBase(
        {
          titulo: nota.titulo,
          descripcion: nota.bajada,
          volanta: etiquetaCategoria(nota.categoria),
          imagen: nota.imagen_portada,
          alt: nota.imagen_alt,
        },
        SITE_URL,
      ),
      type: 'article',
      url,
      publishedTime: nota.publicada_en ?? undefined,
      authors: [nota.autor.nombre],
    },
    twitter: {
      // Siempre grande: ahora siempre hay una imagen de 1200×630.
      card: 'summary_large_image',
      title: nota.titulo,
      description: nota.bajada,
    },
  }
}

export default async function PaginaNota({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  // Sin proyecto de Supabase la ruta no puede resolver ningún slug. Sin esto,
  // el cliente se construye con las variables en `undefined` y la página
  // revienta con un 500 en lugar de decir que no existe.
  if (!haySupabase()) notFound()

  const { slug } = await params
  const nota = await getNotaPorSlug(slug)

  // Una nota en borrador no es legible ni siquiera con el link: la query filtra
  // por `estado = 'publicada'` y RLS lo vuelve a exigir del lado de la base.
  if (!nota) notFound()

  // Las planillas embebidas en el cuerpo, más la del partido de la nota, en una
  // sola consulta: los ids se juntan antes de pedir nada.
  const idsDelCuerpo = partidoIdsDelCuerpo(nota.cuerpo)
  const ids = [...new Set([...idsDelCuerpo, ...(nota.partido_id ? [nota.partido_id] : [])])]

  const [partidos, relacionadas] = await Promise.all([
    getPartidosPorIds(ids),
    getNotasRelacionadas(nota),
  ])

  const porId = mapaDePartidos(partidos)

  return (
    <>
      <Header />

      <main>
        <ArticuloNota
          nota={nota}
          url={urlDeNota(nota.slug, SITE_URL)}
          partidos={porId}
          partidoDeLaNota={nota.partido_id ? (porId.get(nota.partido_id) ?? null) : null}
          relacionadas={relacionadas}
        />
      </main>

      <Footer />

      {/* El JSON-LD va con el contenido, no en `metadata`: Next no tiene una
          API para datos estructurados y este es el camino que documenta. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdNota(nota, SITE_URL)) }}
      />
    </>
  )
}
