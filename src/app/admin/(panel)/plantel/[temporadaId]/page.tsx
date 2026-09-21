import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EditorPlantel } from '@/components/admin/EditorPlantel'
import { getJugadoras, getPlantel } from '@/lib/supabase/queries/jugadoras'
import { getTemporadaPorId } from '@/lib/supabase/queries/temporadas'

/**
 * El plantel de una temporada.
 *
 * Se entra desde el listado de temporadas, que es donde ya se sabe de cuál:
 * una pantalla `/admin/plantel` suelta obligaría a elegirla de nuevo.
 */
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ temporadaId: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const temporada = await getTemporadaPorId((await params).temporadaId)
  return { title: temporada ? `Plantel · ${temporada.nombre}` : 'Plantel' }
}

export default async function PlantelDeTemporada({ params }: Params) {
  const { temporadaId } = await params
  const temporada = await getTemporadaPorId(temporadaId)

  if (!temporada) notFound()

  const [plantel, jugadoras] = await Promise.all([getPlantel(temporadaId), getJugadoras()])

  return (
    <main className="mx-auto max-w-[900px] px-4 py-8">
      <h1 className="titular mb-1 text-[1.4rem]">Plantel</h1>
      <p className="meta mb-5 text-gris">
        {temporada.nombre} · {plantel.length} jugadoras
      </p>

      {jugadoras.length === 0 ? (
        <p className="border-l-2 border-linea-fuerte bg-papel-alt px-4 py-3 text-[0.95rem]">
          Todavía no hay ninguna ficha de jugadora cargada. Se crean en{' '}
          <Link href="/admin/jugadoras" className="underline underline-offset-4">
            Jugadoras
          </Link>{' '}
          y desde acá se suman al plantel del año.
        </p>
      ) : (
        <EditorPlantel temporadaId={temporadaId} plantel={plantel} jugadoras={jugadoras} />
      )}
    </main>
  )
}
