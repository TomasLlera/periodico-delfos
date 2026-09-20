import type { Metadata } from 'next'
import { FormularioEquipo } from '@/components/admin/FormularioEquipo'
import { getEquipoAldosivi } from '@/lib/supabase/queries/equipos'

/** Un equipo nuevo. Casi siempre un rival; el propio ya está cargado. */
export const metadata: Metadata = { title: 'Equipo nuevo' }
export const dynamic = 'force-dynamic'

export default async function EquipoNuevo() {
  // Para avisar a quién le saca la marca si se tilda "es el equipo propio".
  const aldosivi = await getEquipoAldosivi()

  return (
    <main className="mx-auto max-w-[700px] px-4 py-8">
      <h1 className="titular mb-6 text-[1.6rem]">Equipo nuevo</h1>
      <FormularioEquipo equipo={null} aldosiviDeHoy={aldosivi} />
    </main>
  )
}
