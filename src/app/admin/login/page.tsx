import type { Metadata } from 'next'
import Link from 'next/link'
import { FormularioLogin } from './FormularioLogin'

/**
 * La puerta del admin.
 *
 * Vive fuera del grupo `(panel)` a propósito: el layout del panel exige sesión
 * y redirige acá si no la hay, así que si esta página estuviera adentro se
 * redirigiría a sí misma para siempre. Los grupos de rutas no cambian la URL,
 * así que `/admin/login` sigue siendo `/admin/login`.
 *
 * No lleva el `<Header />` del sitio: el admin es otra cosa y su chrome es el
 * del panel. Lo único que comparte es el tema.
 */
export const metadata: Metadata = {
  title: 'Entrar',
  robots: { index: false, follow: false },
}

type Params = { searchParams: Promise<{ volver?: string; error?: string }> }

export default async function Login({ searchParams }: Params) {
  const { volver, error } = await searchParams

  return (
    <main className="mx-auto flex min-h-dvh max-w-[420px] flex-col justify-center px-4 py-10">
      <Link href="/" className="marca mb-1 text-[1.6rem] text-verde-900">
        Periódico Delfos
      </Link>
      <p className="mb-8 text-[0.9rem] text-gris">Panel de redacción</p>

      {error === 'link' && (
        <p role="alert" className="mb-4 border-l-2 border-roja bg-papel-alt px-3 py-2 text-[0.9rem]">
          Ese link no sirve más. Los links valen una hora y un solo uso: pedí uno nuevo.
        </p>
      )}

      <FormularioLogin volver={volver?.startsWith('/admin') ? volver : '/admin'} />

      <Link href="/" className="mt-8 text-[0.85rem] text-gris underline-offset-4 hover:underline">
        Volver al sitio
      </Link>
    </main>
  )
}
