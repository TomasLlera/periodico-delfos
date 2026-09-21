import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FormularioJugadora } from '@/components/admin/FormularioJugadora'
import { nombreCompleto } from '@/lib/plantel'
import { getJugadoraPorId } from '@/lib/supabase/queries/jugadoras'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const jugadora = await getJugadoraPorId((await params).id)
  return { title: jugadora ? nombreCompleto(jugadora) : 'Jugadora' }
}

/**
 * Editar una ficha.
 *
 * **No hay botón de borrar**, al revés que en equipos y temporadas: `eventos` y
 * `formaciones` referencian a la jugadora, y borrarla dejaría la planilla de la
 * fecha 4 con un hueco donde había un gol. La baja es la casilla "está en el
 * club", que está adentro del formulario.
 */
export default async function EditarJugadora({ params }: Params) {
  const jugadora = await getJugadoraPorId((await params).id)

  if (!jugadora) notFound()

  return (
    <main className="mx-auto max-w-[700px] px-4 py-8">
      <h1 className="titular mb-6 text-[1.6rem]">{nombreCompleto(jugadora)}</h1>
      <FormularioJugadora jugadora={jugadora} />
    </main>
  )
}
