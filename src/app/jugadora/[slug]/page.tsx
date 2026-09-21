import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { NotasRelacionadas } from '@/components/content/NotasRelacionadas'
import { CabeceraJugadora } from '@/components/jugadora/CabeceraJugadora'
import { ListaGoles } from '@/components/jugadora/ListaGoles'
import {
  TablaEstadisticas,
  type FilaEstadistica,
} from '@/components/jugadora/TablaEstadisticas'
import { totalesJugadora } from '@/lib/jugadora'
import { nombreCompleto, puestoEnTemporada } from '@/lib/plantel'
import { openGraphBase } from '@/lib/seo'
import {
  getEstadisticasJugadora,
  getGolesDeJugadora,
  getJugadoraPorSlug,
  getPlantel,
  getSlugsJugadoras,
} from '@/lib/supabase/queries/jugadoras'
import { getNotasDeJugadora } from '@/lib/supabase/queries/notas'
import { getTemporadaActiva, getTemporadas } from '@/lib/supabase/queries/temporadas'
import { haySupabase } from '@/lib/supabase/server'
import type { Temporada } from '@/types'

/**
 * La ficha de una jugadora (blueprint 7.5). Step 14.
 *
 * **Son ~32 páginas de contenido único que hoy no existen.** En el sitio viejo
 * no hay forma de contestar "¿cuántos goles lleva y a quién se los hizo?" sin
 * leer las once crónicas: acá está en una tabla que se calcula sola desde las
 * planillas (regla no negociable 2).
 *
 * Nada de esta página se escribe a mano: las estadísticas salen de la vista
 * `estadisticas_jugadora` y los goles de los eventos de cada partido.
 */
export const revalidate = 60

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

type Params = { params: Promise<{ slug: string }> }

/** Sin proyecto de Supabase no se prerenderiza ninguna, como en `/nota`. */
export async function generateStaticParams() {
  if (!haySupabase()) return []

  const jugadoras = await getSlugsJugadoras()
  return jugadoras.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  if (!haySupabase()) return { title: 'Jugadora' }

  const { slug } = await params
  const jugadora = await getJugadoraPorSlug(slug)

  if (!jugadora) return { title: 'Jugadora no encontrada' }

  const nombre = nombreCompleto(jugadora)
  const totales = totalesJugadora(await getEstadisticasJugadora(jugadora.id))

  // La descripción se arma con los números que hay, no con adjetivos: es lo
  // que distingue una ficha útil de un relleno de SEO.
  const descripcion = `${nombre} en Aldosivi: ${totales.partidos} ${
    totales.partidos === 1 ? 'partido' : 'partidos'
  }, ${totales.goles} ${totales.goles === 1 ? 'gol' : 'goles'} y las notas donde aparece.`

  return {
    title: nombre,
    description: descripcion,
    alternates: { canonical: `${SITE_URL.replace(/\/+$/, '')}/jugadora/${jugadora.slug}` },
    openGraph: {
      // La foto de la jugadora si la hay; si no, la imagen generada, que es
      // mejor que el rectángulo gris con el dominio. Lo resuelve el helper.
      ...openGraphBase(
        {
          titulo: nombre,
          descripcion,
          volanta: 'Plantel',
          imagen: jugadora.foto_url,
          alt: `Foto de ${nombre}`,
        },
        SITE_URL,
      ),
      type: 'profile',
    },
  }
}

export default async function PaginaJugadora({ params }: Params) {
  if (!haySupabase()) notFound()

  const { slug } = await params
  const jugadora = await getJugadoraPorSlug(slug)

  if (!jugadora) notFound()

  const [estadisticas, goles, notas, temporadas, temporadaActiva] = await Promise.all([
    getEstadisticasJugadora(jugadora.id),
    getGolesDeJugadora(jugadora.id),
    getNotasDeJugadora(jugadora.id),
    getTemporadas(),
    getTemporadaActiva(),
  ])

  // El dorsal y la cinta salen del plantel de la temporada en curso: son de la
  // temporada, no de la jugadora, y pueden cambiar de un año al otro.
  const plantelActual = temporadaActiva ? await getPlantel(temporadaActiva.id) : []
  const enPlantel = plantelActual.find((fila) => fila.id === jugadora.id) ?? null

  const porId = new Map<string, Temporada>(temporadas.map((t) => [t.id, t]))

  // Se ordena por el año de la temporada y no por su nombre: "Primera B 2026"
  // y "Primera C 2024" no se ordenan solas alfabéticamente, y la más nueva va
  // arriba.
  const filas: FilaEstadistica[] = estadisticas
    .map((fila) => ({ fila, temporada: porId.get(fila.temporada_id) ?? null }))
    .sort((a, b) => (b.temporada?.anio ?? 0) - (a.temporada?.anio ?? 0))
    .map(({ fila, temporada }) => ({
      estadisticas: fila,
      temporadaNombre: temporada?.nombre ?? 'Temporada',
      temporadaSlug: temporada?.slug ?? null,
    }))

  const nombre = nombreCompleto(jugadora)

  return (
    <>
      <Header />

      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <CabeceraJugadora
          jugadora={jugadora}
          puesto={enPlantel ? puestoEnTemporada(enPlantel) : jugadora.posicion}
          dorsal={enPlantel?.dorsal ?? null}
          capitana={enPlantel?.capitana ?? false}
          temporadaActual={enPlantel ? (temporadaActiva?.nombre ?? null) : null}
          totales={totalesJugadora(estadisticas)}
          hoy={new Date()}
        />

        <section aria-labelledby="estadisticas" className="mt-12">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-7 w-2.5 shrink-0 rounded-sm bg-verde-600" />
            <h2 id="estadisticas" className="titular text-[22px]">
              Temporada a temporada
            </h2>
          </div>

          <div className="mt-5">
            <TablaEstadisticas filas={filas} />
          </div>
        </section>

        <section aria-labelledby="goles" className="mt-12">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-7 w-2.5 shrink-0 rounded-sm bg-verde-600" />
            <h2 id="goles" className="titular text-[22px]">
              Sus goles
            </h2>
            {goles.length > 0 && (
              <span className="dato text-[0.8rem] text-gris">{goles.length}</span>
            )}
          </div>

          <div className="mt-5 max-w-[720px]">
            <ListaGoles goles={goles} />
          </div>
        </section>

        <NotasRelacionadas notas={notas} titulo={`Notas donde aparece ${nombre}`} />
      </main>

      <Footer />
    </>
  )
}
