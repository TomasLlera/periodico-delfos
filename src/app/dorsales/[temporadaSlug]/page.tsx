import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { TablaDorsales } from '@/components/dorsales/TablaDorsales'
import { conPlantelCompleto, dorsalesDistintos, dorsalesPorJugadora } from '@/lib/dorsales'
import { openGraphBase } from '@/lib/seo'
import {
  getDorsalesDeTemporada,
  getPartidosConFormacion,
  getPlantelParaDorsales,
  getTemporadasConDatos,
} from '@/lib/supabase/queries/dorsales'
import { getSlugsTemporadas, getTemporadaPorSlug } from '@/lib/supabase/queries/temporadas'
import { haySupabase } from '@/lib/supabase/server'
import { urlDelSitio } from '@/lib/sitio'

/**
 * Los dorsales de un campeonato: quién usó qué número y en cuántos partidos.
 *
 * Es el pedido de Carlos, y sólo se puede contestar desde que la `0020` movió
 * el número de `plantel` a `formaciones`. Antes "el dorsal de Cortadi" era un
 * campo que alguien escribía una vez al año; ahora es lo que pasó partido a
 * partido, que es más trabajo de cargar y es el único dato que resiste que
 * alguien lo compare con la foto del programa.
 *
 * Scopeada por temporada por lo mismo que `/plantel/[temporadaSlug]`: el 2024
 * no deja de existir cuando empieza el 2026, y cada campeonato es su propia
 * URL indexable.
 */
export const revalidate = 60

const SITE_URL = urlDelSitio()

type Params = { params: Promise<{ temporadaSlug: string }> }

/** Sin proyecto de Supabase no se prerenderiza ninguna, como en `/plantel`. */
export async function generateStaticParams() {
  if (!haySupabase()) return []

  const temporadas = await getSlugsTemporadas()
  return temporadas.map(({ slug }) => ({ temporadaSlug: slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  if (!haySupabase()) return { title: 'Dorsales' }

  const { temporadaSlug } = await params
  const temporada = await getTemporadaPorSlug(temporadaSlug)

  if (!temporada) return { title: 'Dorsales no encontrados' }

  const titulo = `Dorsales · ${temporada.nombre}`
  const descripcion = `Con qué número jugó cada jugadora de Aldosivi en ${temporada.nombre}, y en cuántos partidos usó cada uno.`

  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: `${SITE_URL.replace(/\/+$/, '')}/dorsales/${temporada.slug}` },
    openGraph: {
      ...openGraphBase({ titulo, descripcion, volanta: temporada.nombre }, SITE_URL),
      type: 'website',
    },
  }
}

export default async function DorsalesDeTemporada({ params }: Params) {
  if (!haySupabase()) notFound()

  const { temporadaSlug } = await params
  const temporada = await getTemporadaPorSlug(temporadaSlug)

  if (!temporada) notFound()

  const [crudos, partidosCargados, plantel, temporadas] = await Promise.all([
    getDorsalesDeTemporada(temporada.id),
    getPartidosConFormacion(temporada.id),
    getPlantelParaDorsales(temporada.id),
    getTemporadasConDatos(),
  ])

  // El plantel entero, no sólo las convocadas: nueve jugadoras de Primera B
  // 2026 no entraron en ninguna planilla y no figuraban en esta página.
  const filas = conPlantelCompleto(dorsalesPorJugadora(crudos), plantel)
  const numeros = dorsalesDistintos(filas)
  const convocadas = filas.filter((fila) => fila.partidos > 0).length
  const otras = temporadas.filter((otra) => otra.slug !== temporada.slug)

  return (
    <>
      <Header />

      <main className="contenedor py-10">
        <div className="border-b-[3px] border-border-strong pb-3">
          <Link
            href="/dorsales"
            className="meta inline-block text-text-muted underline underline-offset-[3px] hover:text-accent-text"
          >
            ← Dorsales
          </Link>

          <p className="meta mt-2">
            {temporada.nombre}
            {filas.length > 0 &&
              ` · ${filas.length} ${filas.length === 1 ? 'jugadora' : 'jugadoras'}`}
            {convocadas > 0 && convocadas < filas.length && ` · ${convocadas} convocadas`}
            {numeros > 0 && ` · ${numeros} ${numeros === 1 ? 'número' : 'números'}`}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <h1 className="marca text-[1.8rem] uppercase md:text-[2.3rem]">Dorsales</h1>
            <Link
              href={`/plantel/${temporada.slug}`}
              className="shrink-0 font-display text-[0.85rem] font-bold text-accent-text underline underline-offset-[3px]"
            >
              Plantel →
            </Link>
          </div>
        </div>

        <div className="mt-10">
          {filas.length === 0 ? (
            <div className="max-w-medida border-l-4 border-accent bg-bg-muted py-6 pl-5">
              <p className="font-body text-[1.05rem] leading-relaxed text-text-soft">
                Todavía no hay formaciones cargadas en {temporada.nombre}. El número de cada
                jugadora sale de la planilla de cada partido, así que aparece acá en cuanto se
                carga la primera.
              </p>

              <p className="mt-4 font-body text-text-muted">
                Mientras tanto está{' '}
                <Link
                  href={`/plantel/${temporada.slug}`}
                  className="text-accent-text underline underline-offset-2"
                >
                  el plantel de la temporada
                </Link>
                .
              </p>
            </div>
          ) : (
            <TablaDorsales
              filas={filas}
              temporada={temporada.nombre}
              partidosCargados={partidosCargados}
            />
          )}
        </div>

        {/* Cambiar de campeonato sin volver al índice. Antes de esto, una vez
            adentro de una temporada la única salida era el botón atrás del
            navegador: el encabezado sólo ofrecía el plantel. */}
        {otras.length > 0 && (
          <nav aria-label="Otros campeonatos" className="mt-12 border-t border-border pt-6">
            <p className="meta text-text-muted">Otros campeonatos</p>

            <ul className="mt-3 flex flex-wrap gap-2">
              {otras.map((otra) => (
                <li key={otra.id}>
                  <Link
                    href={`/dorsales/${otra.slug}`}
                    className="tactil inline-block border border-border px-3 py-2 font-display text-[0.9rem] font-bold hover:border-accent"
                  >
                    {otra.nombre}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </main>

      <Footer />
    </>
  )
}
