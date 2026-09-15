import type { Metadata } from 'next'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { CabeceraBloque } from '@/components/portada/CabeceraBloque'
import { LARGO_MINIMO, terminoBuscado } from '@/lib/busqueda'
import { etiquetaCategoria, fechaCorta } from '@/lib/formato'
import { buscarNotas } from '@/lib/supabase/queries/notas'
import { haySupabase } from '@/lib/supabase/server'
import type { ResultadoBusqueda } from '@/types'

/**
 * El buscador. Hasta ahora `/buscar` daba 404, y el header linkea a esta ruta
 * desde **todas** las páginas del sitio.
 *
 * **Es un Server Component y el formulario no lleva JavaScript.** El blueprint
 * permite que el buscador sea cliente, pero un `<form method="get">` que apunta
 * a esta misma ruta hace exactamente lo mismo, anda con JS desactivado y deja
 * la búsqueda en la URL —que se puede compartir y queda en el historial—. Se
 * vuelve cliente el día que haga falta autocompletado, no antes.
 *
 * **No se indexa.** Una página de resultados de búsqueda en el índice de Google
 * es contenido generado por quien la visite, y termina en el índice con
 * cualquier término que a alguien se le ocurra escribir.
 */
export const metadata: Metadata = {
  title: 'Buscar',
  robots: { index: false, follow: true },
}

type Params = { searchParams: Promise<{ q?: string | string[] }> }

export default async function Buscar({ searchParams }: Params) {
  const pedido = terminoBuscado((await searchParams).q)

  const resultados: ResultadoBusqueda[] =
    pedido.estado === 'listo' && haySupabase() ? await buscarNotas(pedido.termino) : []

  return (
    <>
      <Header />

      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <CabeceraBloque id="buscar" titulo="Buscar" nivel={1} />

        {/* `action` a esta misma ruta y `method="get"`: el término queda en la
            URL, así que un resultado se puede compartir y volver a cargar. */}
        <form action="/buscar" method="get" role="search" className="flex max-w-[640px] gap-2">
          <label htmlFor="q" className="sr-only">
            Buscar crónicas y jugadoras
          </label>
          <div className="tactil flex flex-1 items-center gap-2 border border-linea-fuerte bg-tarjeta px-3">
            <Search size={18} aria-hidden="true" className="shrink-0 text-gris" />
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={pedido.estado === 'listo' ? pedido.termino : ''}
              placeholder="Crónicas, jugadoras, rivales…"
              className="w-full bg-transparent py-2 font-display text-[0.95rem] outline-none placeholder:text-gris-tenue"
            />
          </div>
          <button
            type="submit"
            className="tactil shrink-0 bg-amarillo px-5 font-display text-[0.9rem] font-extrabold text-negro-cancha hover:bg-amarillo/90"
          >
            Buscar
          </button>
        </form>

        <div className="mt-10">
          <Estado pedido={pedido} resultados={resultados} />
        </div>
      </main>

      <Footer />
    </>
  )
}

/**
 * Los cuatro estados se escriben, no se omiten: sin esto, "no busqué nada",
 * "escribí una letra sola", "no hay nada que coincida" y "la base no está" se
 * ven todos igual, como una página en blanco.
 */
function Estado({
  pedido,
  resultados,
}: {
  pedido: ReturnType<typeof terminoBuscado>
  resultados: readonly ResultadoBusqueda[]
}) {
  if (pedido.estado === 'vacio') {
    return (
      <p className="font-body text-gris">
        Escribí algo para buscar entre las notas publicadas. La búsqueda mira el
        título y la bajada.
      </p>
    )
  }

  if (pedido.estado === 'corto') {
    return (
      <p className="font-body text-gris">
        Escribí al menos {LARGO_MINIMO} caracteres.
      </p>
    )
  }

  if (resultados.length === 0) {
    return (
      <div className="border-l-4 border-verde-600 bg-papel-alt py-6 pl-5">
        <p className="font-body text-gris">
          No hay notas que coincidan con <strong className="text-tinta">{pedido.termino}</strong>.
        </p>
        <p className="mt-2 font-body text-gris">
          Probá con menos palabras, o mirá{' '}
          <Link href="/cronicas" className="text-verde-600 underline underline-offset-2">
            todas las crónicas
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <section aria-label="Resultados">
      <p className="meta">
        {resultados.length} {resultados.length === 1 ? 'resultado' : 'resultados'} para{' '}
        {pedido.termino}
      </p>

      <ul className="mt-5">
        {resultados.map((nota) => (
          <li key={nota.id} className="group border-b border-linea py-5">
            <p className="flex flex-wrap items-center gap-x-3 font-display text-[0.7rem] font-extrabold uppercase tracking-[0.1em] text-verde-600">
              {etiquetaCategoria(nota.categoria)}
              {nota.publicada_en && (
                <span className="dato font-normal tracking-normal text-gris">
                  {fechaCorta(nota.publicada_en)}
                </span>
              )}
            </p>

            <h2 className="marca mt-2 text-[1.3rem] leading-[1.15]">
              <Link href={`/nota/${nota.slug}`} className="group-hover:text-verde-600">
                {nota.titulo}
              </Link>
            </h2>

            <p className="mt-1 max-w-medida font-body text-[0.95rem] leading-snug text-tinta-suave">
              {nota.bajada}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
