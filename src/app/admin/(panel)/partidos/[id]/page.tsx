import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ClipboardList, Users } from 'lucide-react'
import { borrarPartido } from '@/actions/partidos'
import { BotonBorrar } from '@/components/admin/BotonBorrar'
import { FormularioPartido } from '@/components/admin/FormularioPartido'
import { isoALocal } from '@/lib/entidades/campos'
import { etiquetaDePartido } from '@/lib/partido'
import { getEquipos } from '@/lib/supabase/queries/equipos'
import { getPartidoPorId } from '@/lib/supabase/queries/partidos'
import { getTemporadaActiva, getTemporadas } from '@/lib/supabase/queries/temporadas'

/**
 * La ficha de un partido ya creado.
 *
 * Es la pantalla intermedia que faltaba entre el listado y la planilla: acá se
 * corrige la hora, la cancha o el estado, y desde acá se entra a la formación
 * —quiénes juegan— y a la planilla —qué pasó—. El orden importa: la planilla
 * dibuja su grilla con las titulares, así que sin formación no se puede cargar
 * un gol.
 */
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const partido = await getPartidoPorId((await params).id)
  return { title: partido ? etiquetaDePartido(partido) : 'Partido' }
}

export default async function EditarPartido({ params }: Params) {
  const { id } = await params
  const [partido, temporadas, equipos, activa] = await Promise.all([
    getPartidoPorId(id),
    getTemporadas(),
    getEquipos(),
    getTemporadaActiva(),
  ])

  if (!partido) notFound()

  return (
    <main className="mx-auto max-w-[700px] px-4 py-8">
      <h1 className="titular mb-1 text-[1.4rem]">{etiquetaDePartido(partido)}</h1>
      <p className="meta mb-5 text-gris">
        {partido.formaciones.length} en la formación · {partido.eventos.length} eventos cargados
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href={`/admin/partidos/${id}/formacion`}
          className="tactil flex items-center gap-2 border border-linea-fuerte px-4 font-display text-[0.9rem] font-bold hover:bg-papel-alt"
        >
          <Users size={16} aria-hidden="true" />
          Formación
        </Link>

        <Link
          href={`/admin/partidos/${id}/planilla`}
          className="tactil flex items-center gap-2 bg-verde-900 px-4 font-display text-[0.9rem] font-extrabold text-white hover:bg-verde-600"
        >
          <ClipboardList size={16} aria-hidden="true" />
          Planilla
        </Link>
      </div>

      <FormularioPartido
        partido={partido}
        temporadas={temporadas}
        equipos={equipos}
        fechaHoraInicial={isoALocal(partido.fecha_hora)}
        temporadaActivaId={activa?.id ?? null}
      />

      <div className="mt-8 border-t border-linea pt-4">
        <BotonBorrar
          que="este partido"
          consecuencia="Sólo se puede mientras no tenga formación ni eventos cargados."
          borrar={async () => {
            'use server'
            return borrarPartido(id)
          }}
          volverA="/admin/partidos"
        />
      </div>
    </main>
  )
}
