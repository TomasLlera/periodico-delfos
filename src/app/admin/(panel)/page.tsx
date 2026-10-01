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
  // Las programadas van en su propio grupo y ordenadas por cuándo salen: bajo
  // el título «Publicadas» decían que ya estaban en el sitio, y en el orden de
  // último cambio no se veía cuál es la próxima en salir.
  const programadas = notas
    .filter((n) => n.estado === 'programada')
    .sort((a, b) => (a.publicar_en ?? '').localeCompare(b.publicar_en ?? ''))
  const resto = notas.filter((n) => n.estado !== 'borrador' && n.estado !== 'programada')

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <h1 className="titular text-[1.6rem]">Notas</h1>

        <Link
          href="/admin/notas/nueva"
          className="tactil ml-auto flex items-center gap-2 bg-accent px-4 font-display text-[0.9rem] font-extrabold text-accent-contrast hover:bg-accent/90"
        >
          <Plus size={16} aria-hidden="true" />
          Nota nueva
        </Link>
      </div>

      {notas.length === 0 && (
        <p className="border-l-2 border-border-control bg-bg-muted px-4 py-3 text-[0.95rem]">
          Todavía no hay ninguna nota. La primera se escribe desde{' '}
          <Link href="/admin/notas/nueva" className="underline underline-offset-4">
            Nota nueva
          </Link>
          .
        </p>
      )}

      {borradores.length > 0 && (
        <section className="mb-8">
          <h2 className="meta mb-2 text-text-muted">En borrador · {borradores.length}</h2>
          <ul>
            {borradores.map((nota) => (
              <FilaNota key={nota.id} nota={nota} />
            ))}
          </ul>
        </section>
      )}

      {programadas.length > 0 && (
        <section className="mb-8">
          <h2 className="meta mb-2 text-text-muted">Programadas · {programadas.length}</h2>
          <ul>
            {programadas.map((nota) => (
              <FilaNota key={nota.id} nota={nota} />
            ))}
          </ul>
        </section>
      )}

      {resto.length > 0 && (
        <section>
          <h2 className="meta mb-2 text-text-muted">Publicadas · {resto.length}</h2>
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
