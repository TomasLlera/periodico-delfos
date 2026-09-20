import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getNotasDelAdmin } from '@/lib/supabase/queries/notas'
import { FilaNota } from './FilaNota'

/**
 * El listado del panel: todo lo que escribió Charlie, borradores incluidos.
 *
 * Dinámica y sin ISR, al revés que todo el sitio público. Acá el contenido
 * cambia porque el que mira es el que lo edita: servir una versión cacheada de
 * 60 segundos mostraría la nota que se acaba de guardar como si no existiera.
 *
 * Los borradores van arriba, siempre. Son en lo que se está trabajando, y lo
 * publicado ya está resuelto.
 */
export const dynamic = 'force-dynamic'

export default async function Panel() {
  const notas = await getNotasDelAdmin()

  const borradores = notas.filter((n) => n.estado === 'borrador')
  const resto = notas.filter((n) => n.estado !== 'borrador')

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <h1 className="titular text-[1.6rem]">Notas</h1>

        <Link
          href="/admin/notas/nueva"
          className="tactil ml-auto flex items-center gap-2 bg-amarillo px-4 font-display text-[0.9rem] font-extrabold text-negro-cancha hover:bg-amarillo/90"
        >
          <Plus size={16} aria-hidden="true" />
          Nota nueva
        </Link>
      </div>

      {notas.length === 0 && (
        <p className="border-l-2 border-linea-fuerte bg-papel-alt px-4 py-3 text-[0.95rem]">
          Todavía no hay ninguna nota. La primera se escribe desde{' '}
          <Link href="/admin/notas/nueva" className="underline underline-offset-4">
            Nota nueva
          </Link>
          .
        </p>
      )}

      {borradores.length > 0 && (
        <section className="mb-8">
          <h2 className="meta mb-2 text-gris">En borrador · {borradores.length}</h2>
          <ul>
            {borradores.map((nota) => (
              <FilaNota key={nota.id} nota={nota} />
            ))}
          </ul>
        </section>
      )}

      {resto.length > 0 && (
        <section>
          <h2 className="meta mb-2 text-gris">Publicadas · {resto.length}</h2>
          <ul>
            {resto.map((nota) => (
              <FilaNota key={nota.id} nota={nota} />
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
