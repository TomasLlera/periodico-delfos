import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PlanillaCarga } from '@/components/admin/PlanillaCarga'
import { etiquetaDePartido } from '@/lib/partido'
import { getPartidoPorId } from '@/lib/supabase/queries/partidos'

/**
 * La planilla de carga de un partido.
 *
 * Dinámica y sin cache: acá el que mira es el que escribe, y servir una versión
 * de hace un minuto mostraría el gol que se acaba de cargar como si no
 * existiera.
 */
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const partido = await getPartidoPorId((await params).id)
  return { title: partido ? etiquetaDePartido(partido) : 'Planilla' }
}

export default async function Planilla({ params }: Params) {
  const partido = await getPartidoPorId((await params).id)

  if (!partido) notFound()

  return (
    <main className="mx-auto max-w-[900px] px-4 py-6">
      <h1 className="titular mb-1 text-[1.4rem]">{etiquetaDePartido(partido)}</h1>
      <p className="meta mb-5 text-gris">{partido.cancha ?? 'Sin cancha cargada'}</p>

      <PlanillaCarga partido={partido} />
    </main>
  )
}
