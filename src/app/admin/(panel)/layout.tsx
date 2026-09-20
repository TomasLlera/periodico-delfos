import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { BarraAdmin } from '@/components/admin/BarraAdmin'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'

/**
 * El panel, y el segundo control de acceso.
 *
 * El middleware ya mandó al login a quien no tiene sesión, pero acá se chequea
 * otra vez y se chequea **otra cosa**: que el usuario tenga fila en `autores`.
 * Tener sesión de Supabase Auth no es ser el autor del medio, y es el mismo
 * criterio que usa `es_autor()` en RLS (`0008_rls.sql`). Sin esto, un usuario
 * de Auth sin fila vería un panel completo que después no puede escribir nada.
 *
 * El blueprint § 9 lo pide explícito: "el layout del admin re-verifica en el
 * servidor; el middleware solo no alcanza".
 *
 * El grupo `(panel)` existe para dejar `/admin/login` afuera de este layout, que
 * si no se redirigiría a sí mismo para siempre. No cambia ninguna URL.
 */
export const metadata: Metadata = {
  title: { default: 'Redacción', template: '%s · Redacción' },
  robots: { index: false, follow: false },
}

export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
  const autor = await getAutorDeLaSesion()

  if (!autor) redirect('/admin/login')

  return (
    <div className="min-h-dvh bg-papel">
      <BarraAdmin autor={autor} />
      {children}
    </div>
  )
}
