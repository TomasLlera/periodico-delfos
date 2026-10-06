import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { FormularioSponsor } from '@/components/admin/FormularioSponsor'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'
import { getSponsorsDelAdmin } from '@/lib/supabase/queries/sponsors'

/**
 * Editar un espacio de publicidad.
 *
 * **Lee la lista entera y busca el id acá**, en vez de una query por id. Son
 * unas pocas filas —un medio chico no vende cincuenta espacios— y así hay una
 * sola query de sponsors en todo el panel, que además es la que ya respeta el
 * permiso de editor. Una segunda query sería una segunda política que mantener.
 */
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  const sponsor = (await getSponsorsDelAdmin()).find((s) => s.id === id)
  return { title: sponsor ? sponsor.nombre : 'Sponsor' }
}

export default async function EditarSponsor({ params }: Params) {
  const yo = await getAutorDeLaSesion()
  if (!yo) redirect('/admin/login')
  if (yo.rol !== 'editor') redirect('/admin')

  const { id } = await params
  const sponsor = (await getSponsorsDelAdmin()).find((s) => s.id === id)

  // Cubre los dos casos que desde afuera son el mismo: que no exista, y que
  // exista y RLS no lo deje ver.
  if (!sponsor) notFound()

  return (
    <main className="mx-auto max-w-[700px] px-4 py-8">
      <h1 className="titular mb-6 text-[1.6rem]">{sponsor.nombre}</h1>
      <FormularioSponsor sponsor={sponsor} />
    </main>
  )
}
