import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { FixtureTemporada } from '@/components/temporada/FixtureTemporada'
import { ListaGoleadoras } from '@/components/temporada/ListaGoleadoras'
import { PestanasTemporada } from '@/components/temporada/PestanasTemporada'
import { TablaPosiciones } from '@/components/temporada/TablaPosiciones'
import { openGraphBase } from '@/lib/seo'
import { pestanaPedida } from '@/lib/temporada'
import { getPartidosTemporada } from '@/lib/supabase/queries/partidos'
import {
  getGoleadoras,
  getTablaPosiciones,
  getTemporadaPorSlug,
} from '@/lib/supabase/queries/temporadas'
import { haySupabase } from '@/lib/supabase/server'

/**
 * La temporada: fixture, tabla y goleadoras (blueprint 7.5). Step 14.
 *
 * **Cada vista carga sólo su propia query.** Es la ventaja de tener las
 * pestañas en la URL y no en el cliente: entrar al fixture no pide la tabla ni
 * las goleadoras. Con pestañas de JavaScript habría que traer las tres cosas
 * en cada visita para poder cambiar sin recargar.
 *
 * Es dinámica, no prerenderizada: lee `searchParams`, que es lo que saca a una
 * página del prerender. El blueprint ya la tenía como ISR y no como SSG.
 */
export const revalidate = 60

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

type Params = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ ver?: string | string[] }>
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  if (!haySupabase()) return { title: 'Temporada' }

  const { slug } = await params
  const temporada = await getTemporadaPorSlug(slug)

  if (!temporada) return { title: 'Temporada no encontrada' }

  const descripcion = `Fixture, tabla de posiciones y goleadoras de Aldosivi en ${temporada.nombre}.`

  return {
    title: temporada.nombre,
    description: descripcion,
    // La canonical es la ruta pelada: las tres pestañas son la misma página
    // con `?ver=`, y sin esto se indexarían como tres URLs distintas.
    alternates: { canonical: `${SITE_URL.replace(/\/+$/, '')}/temporada/${temporada.slug}` },
    openGraph: {
      ...openGraphBase(
        { titulo: temporada.nombre, descripcion, volanta: 'Temporada' },
        SITE_URL,
      ),
      type: 'website',
    },
  }
}

export default async function PaginaTemporada({ params, searchParams }: Params) {
  if (!haySupabase()) notFound()

  const { slug } = await params
  const temporada = await getTemporadaPorSlug(slug)

  if (!temporada) notFound()

  const pestana = pestanaPedida((await searchParams).ver)

  const contexto = [
    temporada.division,
    temporada.zona,
    temporada.activa ? 'En curso' : null,
  ].filter((parte): parte is string => Boolean(parte))

  return (
    <>
      <Header />

      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <div className="border-b-[3px] border-tinta pb-3">
          <p className="meta">{contexto.join(' · ')}</p>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <h1 className="marca text-[1.8rem] uppercase md:text-[2.3rem]">
              {temporada.nombre}
            </h1>
            <Link
              href={`/plantel/${temporada.slug}`}
              className="shrink-0 font-display text-[0.85rem] font-bold text-verde-600 underline underline-offset-[3px]"
            >
              Ver el plantel →
            </Link>
          </div>
        </div>

        <div className="mt-6">
          <PestanasTemporada slug={temporada.slug} actual={pestana} />
        </div>

        <div className="mt-8">
          {pestana === 'fixture' && <Fixture temporadaId={temporada.id} nombre={temporada.nombre} />}
          {pestana === 'tabla' && <Tabla temporadaId={temporada.id} nombre={temporada.nombre} />}
          {pestana === 'goleadoras' && (
            <Goleadoras temporadaId={temporada.id} nombre={temporada.nombre} />
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}

/**
 * Las tres vistas quedan como componentes de página —no en `src/components/`—
 * porque son sólo la consulta: el dibujo está en los componentes puros, que no
 * consultan nada y se pueden mirar en `/demo/temporada`.
 */
async function Fixture({ temporadaId, nombre }: { temporadaId: string; nombre: string }) {
  const partidos = await getPartidosTemporada(temporadaId)
  return <FixtureTemporada partidos={partidos} temporada={nombre} />
}

async function Tabla({ temporadaId, nombre }: { temporadaId: string; nombre: string }) {
  const { filas, fecha } = await getTablaPosiciones(temporadaId)
  return <TablaPosiciones filas={filas} fecha={fecha} temporada={nombre} />
}

/** 25 y no las 5 de la portada: acá la lista completa es el contenido. */
async function Goleadoras({ temporadaId, nombre }: { temporadaId: string; nombre: string }) {
  const goleadoras = await getGoleadoras(temporadaId, 25)
  return <ListaGoleadoras goleadoras={goleadoras} temporada={nombre} />
}
