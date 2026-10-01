import { redirect } from 'next/navigation'
import { FormularioPerfil } from '@/components/admin/FormularioPerfil'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'

/**
 * El perfil de quien está logueado.
 *
 * Sin autor en la sesión vuelve al login: es la misma puerta que usa el resto
 * del panel, y acá importa más que en ninguna otra pantalla porque esta edita
 * exactamente la fila de quien entró.
 */
export const metadata = {
  title: 'Mi perfil · Panel',
  robots: { index: false, follow: false },
}

export default async function PaginaPerfil() {
  const autor = await getAutorDeLaSesion()
  if (!autor) redirect('/admin/login')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="titular text-[28px]">Mi perfil</h1>
        <p className="mt-1 font-body text-text-muted">
          Lo que se ve en la firma de cada nota y en la caja del pie.
        </p>
      </div>

      <FormularioPerfil autor={autor} />
    </div>
  )
}
