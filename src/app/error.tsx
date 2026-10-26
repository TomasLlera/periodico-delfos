'use client'

import { RotateCcw } from 'lucide-react'
import Link from 'next/link'

/**
 * Cuando una página revienta y no hay copia guardada que mostrar.
 *
 * **Con la base caída, casi nadie llega acá.** Las queries tiran cuando
 * Supabase falla (`lib/supabase/exigir.ts`) y, si eso pasa al regenerar una
 * página ya publicada, Next sigue sirviendo la última versión buena. Esto sale
 * sólo cuando no hay ninguna: una página que se pide por primera vez, `/buscar`,
 * o el panel.
 *
 * Antes no existía, y la falla se veía como la pantalla genérica de Next: una
 * línea en inglés y ningún botón (regla no negociable 9).
 *
 * No lleva el `Header`: es un Server Component y esto tiene que ser cliente.
 * El link a la portada alcanza para salir.
 */

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorDelSitio({ error, reset }: Props) {
  return (
    <main className="mx-auto flex max-w-[900px] flex-col gap-4 px-4 py-8">
      <h1 className="titular text-[1.6rem]">Algo salió mal</h1>
      <p className="max-w-[60ch] text-text-soft">
        No pudimos cargar esta página. Puede ser un problema momentáneo: probá de nuevo en un rato.
      </p>
      {error.digest && (
        <p className="meta text-text-muted">Código para reportarlo: {error.digest}</p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="tactil flex items-center gap-2 bg-text px-5 font-display text-[0.9rem] font-extrabold text-bg hover:bg-text/85"
        >
          <RotateCcw size={16} aria-hidden="true" />
          Reintentar
        </button>
        <Link href="/" className="tactil flex items-center text-accent-text underline">
          Ir a la portada
        </Link>
      </div>
    </main>
  )
}
