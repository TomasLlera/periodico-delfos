import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { borrarTemporada } from '@/actions/temporadas'
import { BotonBorrar } from '@/components/admin/BotonBorrar'
import { FormularioTemporada } from '@/components/admin/FormularioTemporada'
import { getTemporadaActiva, getTemporadaPorId } from '@/lib/supabase/queries/temporadas'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const temporada = await getTemporadaPorId((await params).id)
  return { title: temporada ? temporada.nombre : 'Temporada' }
}

export default async function EditarTemporada({ params }: Params) {
  const { id } = await params
  const [temporada, activa] = await Promise.all([getTemporadaPorId(id), getTemporadaActiva()])

  if (!temporada) notFound()

  return (
    <main className="mx-auto max-w-[700px] px-4 py-8">
      <h1 className="titular mb-6 text-[1.6rem]">{temporada.nombre}</h1>

      <FormularioTemporada
        temporada={temporada}
        activaDeHoy={activa}
        anioDeHoy={new Date().getFullYear()}
      />

      <div className="mt-8 border-t border-linea pt-4">
        <BotonBorrar
          que={`la temporada ${temporada.nombre}`}
          consecuencia="Se lleva su plantel y su tabla de posiciones. Si ya tiene partidos cargados, no se va a poder."
          borrar={async () => {
            'use server'
            return borrarTemporada(id)
          }}
          volverA="/admin/temporadas"
        />
      </div>
    </main>
  )
}
