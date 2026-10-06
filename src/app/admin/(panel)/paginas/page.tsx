import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ExternalLink, Pencil } from 'lucide-react'
import { Aviso } from '@/components/admin/Aviso'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'
import { getPaginasDelAdmin } from '@/lib/supabase/queries/paginas'

/**
 * Las páginas fijas del sitio.
 *
 * **No hay botón de "página nueva", y no es un olvido.** Cada fila corresponde a
 * una ruta que ya existe en `src/app/`: crear una desde acá dejaría un texto que
 * nadie puede ver, porque la ruta no existiría. Las páginas las agrega el
 * código; esta pantalla edita lo que dicen.
 *
 * **Sólo editores.** Es el texto institucional del medio, no una nota firmada.
 */
export const metadata: Metadata = { title: 'Páginas' }
export const dynamic = 'force-dynamic'

export default async function Paginas() {
  const yo = await getAutorDeLaSesion()
  if (!yo) redirect('/admin/login')
  if (yo.rol !== 'editor') redirect('/admin')

  const paginas = await getPaginasDelAdmin()

  return (
    <main className="mx-auto max-w-[900px] px-4 py-8">
      <h1 className="titular mb-6 text-[1.6rem]">Páginas</h1>

      {paginas.length === 0 ? (
        <Aviso>
          No hay páginas cargadas. Si esto se ve vacío y el sitio igual muestra
          «Quiénes somos», falta aplicar la migración <strong>0018</strong>.
        </Aviso>
      ) : (
        <ul>
          {paginas.map((pagina) => (
            <li
              key={pagina.slug}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border py-3"
            >
              <Link
                href={`/admin/paginas/${pagina.slug}`}
                className="font-display text-[1rem] font-bold underline-offset-4 hover:underline"
              >
                {pagina.titulo}
              </Link>

              <span className="text-[0.85rem] text-text-muted">/{pagina.slug}</span>

              <span className="ml-auto flex items-center gap-3 text-[0.85rem] text-text-muted">
                {/* Ver cómo quedó, en el sitio y no en una previa: una página
                    fija cambia una vez por año y mirarla de verdad cuesta un
                    click. */}
                <Link
                  href={`/${pagina.slug}`}
                  target="_blank"
                  className="tactil flex items-center gap-1 hover:underline"
                >
                  Ver
                  <ExternalLink size={14} aria-hidden="true" />
                </Link>

                <Link
                  href={`/admin/paginas/${pagina.slug}`}
                  className="tactil flex items-center gap-1 hover:underline"
                >
                  <Pencil size={14} aria-hidden="true" />
                  Editar
                </Link>
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-[0.85rem] text-text-muted">
        Acá se edita el texto, no se crean páginas: cada una corresponde a una
        dirección que ya existe en el sitio.
      </p>
    </main>
  )
}
