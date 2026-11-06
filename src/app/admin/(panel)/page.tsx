import Link from 'next/link'
import { Plus } from 'lucide-react'
import { aniosDeNotas, filtrarNotas, leerFiltro, type ParametrosFiltro } from '@/lib/filtro-notas'
import { getNotasDelAdmin } from '@/lib/supabase/queries/notas'
import { FilaNota } from './FilaNota'
import { FiltroNotas } from './FiltroNotas'

/**
 * El listado del panel: todo lo que escribió Charlie, borradores incluidos.
 *
 * Dinámica y sin ISR, al revés que todo el sitio público. Acá el contenido
 * cambia porque el que mira es el que lo edita: servir una versión cacheada de
 * 60 segundos mostraría la nota que se acaba de guardar como si no existiera.
 *
 * Los borradores van arriba, siempre. Son en lo que se está trabajando, y lo
 * publicado ya está resuelto.
 *
 * **El filtro llega por la URL** y lo aplica `filtrarNotas()`, que es puro y
 * está testeado. Los años del `<select>` salen de las notas sin filtrar: si
 * salieran de las filtradas, elegir 2024 dejaría 2024 como única opción y no
 * habría forma de volver a otro año sin limpiar todo.
 */
export const dynamic = 'force-dynamic'

type Params = { searchParams: Promise<ParametrosFiltro> }

export default async function Panel({ searchParams }: Params) {
  const [todas, parametros] = await Promise.all([getNotasDelAdmin(), searchParams])

  const filtro = leerFiltro(parametros)
  const notas = filtrarNotas(todas, filtro)

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

      {/* El filtro se dibuja sólo si hay algo que filtrar. Con la base vacía
          —o con tres notas— es un control que estorba más de lo que ayuda. */}
      {todas.length > 0 && (
        <FiltroNotas filtro={filtro} anios={aniosDeNotas(todas)} cuantas={notas.length} />
      )}

      {todas.length === 0 && (
        <p className="border-l-2 border-border-control bg-bg-muted px-4 py-3 text-[0.95rem]">
          Todavía no hay ninguna nota. La primera se escribe desde{' '}
          <Link href="/admin/notas/nueva" className="underline underline-offset-4">
            Nota nueva
          </Link>
          .
        </p>
      )}

      {/* Que el filtro no haya encontrado nada lo dice el propio filtro, al
          lado del botón de limpiar, y no se repite acá: sin filtro puesto
          `notas` es `todas`, así que la lista vacía sólo puede venir de la base
          vacía —el aviso de arriba— o de un filtro que no encontró nada. */}

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
