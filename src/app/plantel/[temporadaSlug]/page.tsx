import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { GrillaPlantel } from '@/components/plantel/GrillaPlantel'
import { openGraphBase } from '@/lib/seo'
import { getPlantel } from '@/lib/supabase/queries/jugadoras'
import { getSlugsTemporadas, getTemporadaPorSlug } from '@/lib/supabase/queries/temporadas'
import { haySupabase } from '@/lib/supabase/server'
import { urlDelSitio } from '@/lib/sitio'

/**
 * El plantel de una temporada, agrupado por puesto (blueprint 7.5). Step 14.
 *
 * Está scopeado por temporada y no es una sola página de "plantel" porque el
 * plantel cambia todos los años y el de 2024 no deja de existir cuando empieza
 * el 2026: cada temporada es su propia página indexable. `/plantel` a secas
 * redirige a la temporada en curso.
 *
 * Es la puerta a las fichas de jugadora, que son ~32 URLs de contenido único
 * que hoy no existen en el sitio viejo.
 */
export const revalidate = 60

const SITE_URL = urlDelSitio()

type Params = { params: Promise<{ temporadaSlug: string }> }

/** Sin proyecto de Supabase no se prerenderiza ninguna, como en `/nota`. */
export async function generateStaticParams() {
  if (!haySupabase()) return []

  const temporadas = await getSlugsTemporadas()
  return temporadas.map(({ slug }) => ({ temporadaSlug: slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  if (!haySupabase()) return { title: 'Plantel' }

  const { temporadaSlug } = await params
  const temporada = await getTemporadaPorSlug(temporadaSlug)

  if (!temporada) return { title: 'Plantel no encontrado' }

  const titulo = `Plantel · ${temporada.nombre}`
  const descripcion = `Las jugadoras de Aldosivi en ${temporada.nombre}, agrupadas por puesto, con la ficha de cada una.`

  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: `${SITE_URL.replace(/\/+$/, '')}/plantel/${temporada.slug}` },
    openGraph: {
      // La volanta es la temporada y no 'Plantel': el título de la tarjeta ya
      // empieza con esa palabra y repetirla arriba se lee como un error.
      ...openGraphBase({ titulo, descripcion, volanta: temporada.nombre }, SITE_URL),
      type: 'website',
    },
  }
}

export default async function PaginaPlantel({ params }: Params) {
  if (!haySupabase()) notFound()

  const { temporadaSlug } = await params
  const temporada = await getTemporadaPorSlug(temporadaSlug)

  if (!temporada) notFound()

  const plantel = await getPlantel(temporada.id)

  return (
    <>
      <Header />

      <main className="contenedor py-10">
        <div className="border-b-[3px] border-tinta pb-3">
          <p className="meta">
            {temporada.nombre}
            {plantel.length > 0 &&
              ` · ${plantel.length} ${plantel.length === 1 ? 'integrante' : 'integrantes'}`}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <h1 className="marca text-[1.8rem] uppercase md:text-[2.3rem]">Plantel</h1>
            <Link
              href={`/temporada/${temporada.slug}`}
              className="shrink-0 font-display text-[0.85rem] font-bold text-verde-600 underline underline-offset-[3px]"
            >
              Fixture y tabla →
            </Link>
          </div>
        </div>

        <div className="mt-10">
          {plantel.length === 0 ? (
            <div className="max-w-medida border-l-4 border-verde-600 bg-papel-alt py-6 pl-5">
              <p className="font-body text-[1.05rem] leading-relaxed text-tinta-suave">
                Todavía no hay jugadoras cargadas en {temporada.nombre}.
              </p>
              <p className="mt-3 font-body text-gris">
                El plantel se carga desde el admin, y de ahí salen la ficha de
                cada jugadora y sus estadísticas.
              </p>
            </div>
          ) : (
            <GrillaPlantel plantel={plantel} />
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
