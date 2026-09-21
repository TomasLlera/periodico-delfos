import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PlanillaCarga } from '@/components/admin/PlanillaCarga'
import { RecordatorioTabla } from '@/components/admin/RecordatorioTabla'
import { fechasSinTabla } from '@/lib/entidades/tabla'
import { etiquetaDePartido } from '@/lib/partido'
import { getPartidoPorId } from '@/lib/supabase/queries/partidos'
import { getFechasConTabla } from '@/lib/supabase/queries/temporadas'

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

  // El recordatorio de la tabla. Acá es donde se aprieta "Finalizar partido",
  // así que es el momento exacto en que aparece: la pantalla se refresca con
  // el partido ya finalizado y el aviso ya está.
  const cargadas = await getFechasConTabla(partido.temporada_id)
  const pendientes = fechasSinTabla([partido], cargadas)

  return (
    <main className="mx-auto max-w-[900px] px-4 py-6">
      <h1 className="titular mb-1 text-[1.4rem]">{etiquetaDePartido(partido)}</h1>
      <p className="meta mb-5 text-gris">{partido.cancha ?? 'Sin cancha cargada'}</p>

      {pendientes.length > 0 && (
        <div className="mb-5">
          <RecordatorioTabla temporadaId={partido.temporada_id} fechas={pendientes} />
        </div>
      )}

      <PlanillaCarga partido={partido} />
    </main>
  )
}
