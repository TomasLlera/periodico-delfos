import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { NotasRelacionadas } from '@/components/content/NotasRelacionadas'
import { PlanillaPartido } from '@/components/partido/PlanillaPartido'
import { etiquetaFecha, marcador } from '@/lib/formato'
import { jsonLdPartido, urlDePartido, urlOg } from '@/lib/seo'
import { getNotasDePartido } from '@/lib/supabase/queries/notas'
import { getPartidoPorSlug, getSlugsPartidos } from '@/lib/supabase/queries/partidos'
import { haySupabase } from '@/lib/supabase/server'
import type { PartidoCompleto } from '@/types'

/**
 * La ficha de un partido. Step 14 del Build Order.
 *
 * Server Component puro de datos: lee y le pasa el `PartidoCompleto` a
 * `<PlanillaPartido variante="completa" />`, que ya existía, está testeada y no
 * consulta nada. Por eso esta página es corta: el trabajo estaba hecho.
 *
 * **La planilla no es plegable acá.** En una crónica es un aparte y se pliega;
 * en esta página la planilla *es* el contenido, y esconderla detrás de un
 * acordeón no tendría sentido.
 *
 * Se la puede mirar con datos falsos en `/demo/partido`.
 */
export const revalidate = 60

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/** Sin proyecto de Supabase no se prerenderiza ninguna ficha, como en `/nota`. */
export async function generateStaticParams() {
  if (!haySupabase()) return []

  const partidos = await getSlugsPartidos()
  return partidos.map(({ slug }) => ({ slug }))
}

/** "Aldosivi 2-1 Morón · Fecha 12" o, sin resultado, "Aldosivi vs Morón". */
function titulo(partido: PartidoCompleto): string {
  const resultado =
    marcador(partido) ??
    `${partido.equipo_local.nombre_corto} vs ${partido.equipo_visitante.nombre_corto}`

  return `${resultado} · ${etiquetaFecha(partido)}`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  if (!haySupabase()) return { title: 'Partido' }

  const { slug } = await params
  const partido = await getPartidoPorSlug(slug)

  if (!partido) return { title: 'Partido no encontrado' }

  const nombre = titulo(partido)
  const url = urlDePartido(partido.slug, SITE_URL)
  const descripcion = `Planilla completa: goles, formaciones, cambios y tarjetas de ${partido.equipo_local.nombre} contra ${partido.equipo_visitante.nombre}.`

  return {
    title: nombre,
    description: descripcion,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: nombre,
      description: descripcion,
      url,
      // Un partido nunca tiene foto propia: siempre va la imagen generada.
      images: [
        {
          url: urlOg({ titulo: nombre, volanta: partido.temporada.nombre }, SITE_URL),
          alt: nombre,
        },
      ],
    },
    twitter: { card: 'summary_large_image', title: nombre, description: descripcion },
  }
}

export default async function PaginaPartido({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  // Sin proyecto de Supabase la ruta no puede resolver ningún slug. Sin esto,
  // el cliente se construye con las variables en `undefined` y la página
  // revienta con un 500 en lugar de decir que no existe.
  if (!haySupabase()) notFound()

  const { slug } = await params
  const partido = await getPartidoPorSlug(slug)

  if (!partido) notFound()

  const notas = await getNotasDePartido(partido.id)

  return (
    <>
      <Header />

      <main className="mx-auto max-w-[1200px] px-4 py-10">
        {/* El `<h1>` lo pone la planilla en su variante completa, con el
            marcador adentro: duplicarlo acá dejaría dos h1 en la página. */}
        <PlanillaPartido partido={partido} variante="completa" nivelTitulo={2} />

        <NotasRelacionadas notas={notas} titulo="Lo que se escribió sobre este partido" />
      </main>

      <script
        type="application/ld+json"
        // El JSON-LD va como texto: es un dato, no marcado, y Next no lo escapa.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdPartido(partido, SITE_URL)),
        }}
      />

      <Footer />
    </>
  )
}
