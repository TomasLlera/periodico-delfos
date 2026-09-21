import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ClipboardList } from 'lucide-react'
import { EditorFormacion } from '@/components/admin/EditorFormacion'
import { etiquetaDePartido } from '@/lib/partido'
import { getPlantel } from '@/lib/supabase/queries/jugadoras'
import { getPartidoPorId } from '@/lib/supabase/queries/partidos'

/**
 * La formación de un partido: el paso que va entre crearlo y cargar la
 * planilla.
 *
 * El blueprint no le dio un Step propio —la da por supuesta dentro de la
 * planilla del Step 13— pero sin ella la cadena se corta: `PlanillaCarga`
 * arma la grilla con `enCancha()`, que arranca de las titulares de
 * `formaciones`. Un partido creado desde el panel y sin esta pantalla abre la
 * planilla sin ninguna jugadora que tocar.
 */
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const partido = await getPartidoPorId((await params).id)
  return { title: partido ? `Formación · ${etiquetaDePartido(partido)}` : 'Formación' }
}

export default async function Formacion({ params }: Params) {
  const { id } = await params
  const partido = await getPartidoPorId(id)

  if (!partido) notFound()

  // El plantel de la temporada del partido, que es el universo de quién puede
  // jugarlo. Las que ya están en la formación y salieron del plantel las suma
  // `filasDeConvocatoria()`.
  const plantel = await getPlantel(partido.temporada_id)

  return (
    <main className="mx-auto max-w-[700px] px-4 py-6">
      <h1 className="titular mb-1 text-[1.4rem]">Formación</h1>
      <p className="meta mb-5 text-gris">{etiquetaDePartido(partido)}</p>

      <EditorFormacion
        partidoId={id}
        plantel={plantel}
        formacion={partido.formaciones}
      />

      <div className="mt-8 border-t border-linea pt-4">
        <Link
          href={`/admin/partidos/${id}/planilla`}
          className="tactil inline-flex items-center gap-2 font-display text-[0.9rem] font-bold underline-offset-4 hover:underline"
        >
          <ClipboardList size={16} aria-hidden="true" />
          Ir a la planilla
        </Link>
      </div>
    </main>
  )
}
