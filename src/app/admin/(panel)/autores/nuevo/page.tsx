import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { FormularioAutorNuevo } from '@/components/admin/FormularioAutorNuevo'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'

/**
 * Una cuenta nueva del panel.
 *
 * El mismo portero que el listado: sólo editores. Hasta ahora esto se hacía
 * creando el usuario a mano en Supabase Auth y después insertando la fila de
 * `autores` con SQL, copiando el UUID de una pantalla a la otra. Lo pidió
 * Charlie.
 */
export const metadata: Metadata = { title: 'Cuenta nueva' }
export const dynamic = 'force-dynamic'

export default async function AutorNuevo() {
  const yo = await getAutorDeLaSesion()
  if (!yo) redirect('/admin/login')
  if (yo.rol !== 'editor') redirect('/admin')

  return (
    <main className="mx-auto max-w-[700px] px-4 py-8">
      <h1 className="titular mb-6 text-[1.6rem]">Cuenta nueva</h1>
      <FormularioAutorNuevo nombreDelEditor={yo.nombre} />
    </main>
  )
}
