import type { Metadata } from 'next'
import { FormularioTemporada } from '@/components/admin/FormularioTemporada'
import { getTemporadaActiva } from '@/lib/supabase/queries/temporadas'

export const metadata: Metadata = { title: 'Temporada nueva' }
export const dynamic = 'force-dynamic'

export default async function TemporadaNueva() {
  const activa = await getTemporadaActiva()

  return (
    <main className="mx-auto max-w-[700px] px-4 py-8">
      <h1 className="titular mb-6 text-[1.6rem]">Temporada nueva</h1>

      {/* El año sale del reloj del servidor y viaja como número: calcularlo en
          el cliente daría un valor distinto al del HTML si el navegador está
          en otro huso, y React lo marcaría como error de hidratación. */}
      <FormularioTemporada
        temporada={null}
        activaDeHoy={activa}
        anioDeHoy={new Date().getFullYear()}
      />
    </main>
  )
}
