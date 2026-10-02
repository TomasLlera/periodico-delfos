import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { NotasRelacionadas } from '@/components/content/NotasRelacionadas'
import { PlanillaPartido } from '@/components/partido/PlanillaPartido'
import { TablaPosiciones } from '@/components/temporada/TablaPosiciones'
import { etiquetaFecha, marcador } from '@/lib/formato'
import { jsonLdPartido, openGraphBase, urlDePartido } from '@/lib/seo'
import { getNotasDePartido } from '@/lib/supabase/queries/notas'
import { getPartidoPorSlug, getSlugsPartidos } from '@/lib/supabase/queries/partidos'
import { getTablaPosiciones } from '@/lib/supabase/queries/temporadas'
import { haySupabase } from '@/lib/supabase/server'
import type { PartidoCompleto } from '@/types'
import { urlDelSitio } from '@/lib/sitio'

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

const SITE_URL = urlDelSitio()

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
      // Un partido nunca tiene foto propia: siempre va la imagen generada.
      ...openGraphBase(
        { titulo: nombre, descripcion, volanta: partido.temporada.nombre },
        SITE_URL,
      ),
      type: 'article',
      url,
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

  // La tabla **de esa fecha**, no la de hoy. Es lo que convierte el archivo en
  // algo que se puede recorrer: entrar a la fecha 4 de 2024 y ver cómo estaba
  // el campeonato ese día, en lugar de la foto final que ya se sabe. Lo pidió
  // Charlie y los datos estaban: `tabla_posiciones` guarda una fila por equipo
  // y por fecha desde la migración 0004, y `getTablaPosiciones()` ya recibía el
  // número de fecha; nadie se la había pedido con uno.
  //
  // Sin `fecha_numero` —un amistoso— o sin tabla cargada para esa fecha, la
  // query devuelve vacío y el bloque no se dibuja.
  const [notas, tabla] = await Promise.all([
    getNotasDePartido(partido.id),
    partido.fecha_numero
      ? getTablaPosiciones(partido.temporada.id, partido.fecha_numero)
      : Promise.resolve({ filas: [], fecha: null }),
  ])

  return (
    <>
      <Header />

      <main className="mx-auto max-w-[1200px] px-4 py-10">
        {/* El `<h1>` lo pone la planilla en su variante completa, con el
            marcador adentro: duplicarlo acá dejaría dos h1 en la página. */}
        <PlanillaPartido partido={partido} variante="completa" nivelTitulo={2} />

        {tabla.filas.length > 0 && (
          <section aria-labelledby="tabla-a-la-fecha" className="mt-12">
            <h2 id="tabla-a-la-fecha" className="titular text-[22px]">
              La tabla después de esta fecha
            </h2>
            <p className="mt-1 font-body text-[0.9rem] text-text-muted">
              Cómo quedaba el campeonato una vez jugada la fecha {tabla.fecha}.
            </p>

            <div className="mt-4">
              <TablaPosiciones
                filas={tabla.filas}
                fecha={tabla.fecha}
                temporada={partido.temporada.nombre}
              />
            </div>
          </section>
        )}

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
