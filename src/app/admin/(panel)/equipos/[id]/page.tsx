import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { borrarEquipo } from '@/actions/equipos'
import { BotonBorrar } from '@/components/admin/BotonBorrar'
import { FormularioEquipo } from '@/components/admin/FormularioEquipo'
import { getEquipoAldosivi, getEquipoPorId } from '@/lib/supabase/queries/equipos'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const equipo = await getEquipoPorId((await params).id)
  return { title: equipo ? equipo.nombre_corto : 'Equipo' }
}

export default async function EditarEquipo({ params }: Params) {
  const { id } = await params
  const [equipo, aldosivi] = await Promise.all([getEquipoPorId(id), getEquipoAldosivi()])

  if (!equipo) notFound()

  return (
    <main className="mx-auto max-w-[700px] px-4 py-8">
      <h1 className="titular mb-6 text-[1.6rem]">{equipo.nombre_corto}</h1>

      <FormularioEquipo equipo={equipo} aldosiviDeHoy={aldosivi} />

      {/* El borrado va abajo del formulario y no adentro de su barra: es una
          acción de otra naturaleza, y las foreign keys de `partidos` y
          `tabla_posiciones` lo van a rechazar apenas el equipo haya jugado. */}
      <div className="mt-8 border-t border-linea pt-4">
        <BotonBorrar
          que={`el equipo ${equipo.nombre_corto}`}
          consecuencia="Sólo se puede si todavía no jugó ningún partido ni está en la tabla."
          borrar={async () => {
            'use server'
            return borrarEquipo(id)
          }}
          volverA="/admin/equipos"
        />
      </div>
    </main>
  )
}
