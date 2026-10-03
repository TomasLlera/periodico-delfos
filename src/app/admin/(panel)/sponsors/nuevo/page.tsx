import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { FormularioSponsor } from '@/components/admin/FormularioSponsor'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'

/** Un espacio de publicidad nuevo. El mismo portero que el listado: editores. */
export const metadata: Metadata = { title: 'Sponsor nuevo' }
export const dynamic = 'force-dynamic'

export default async function SponsorNuevo() {
  const yo = await getAutorDeLaSesion()
  if (!yo) redirect('/admin/login')
  if (yo.rol !== 'editor') redirect('/admin')

  return (
    <main className="mx-auto max-w-[700px] px-4 py-8">
      <h1 className="titular mb-6 text-[1.6rem]">Sponsor nuevo</h1>
      <FormularioSponsor sponsor={null} />
    </main>
  )
}
