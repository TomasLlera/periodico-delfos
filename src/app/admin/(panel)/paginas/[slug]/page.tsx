import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { FormularioPagina } from '@/components/admin/FormularioPagina'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'
import { getPagina } from '@/lib/supabase/queries/paginas'

/** Editar el texto de una página fija. El mismo portero: sólo editores. */
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const pagina = await getPagina((await params).slug)
  return { title: pagina ? pagina.titulo : 'Página' }
}

export default async function EditarPagina({ params }: Params) {
  const yo = await getAutorDeLaSesion()
  if (!yo) redirect('/admin/login')
  if (yo.rol !== 'editor') redirect('/admin')

  const pagina = await getPagina((await params).slug)
  if (!pagina) notFound()

  return (
    <main className="mx-auto max-w-[900px] px-4 py-8">
      <h1 className="titular mb-6 text-[1.6rem]">{pagina.titulo}</h1>
      <FormularioPagina pagina={pagina} />
    </main>
  )
}
