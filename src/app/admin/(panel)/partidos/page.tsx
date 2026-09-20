import type { Metadata } from 'next'
import Link from 'next/link'
import { ClipboardList } from 'lucide-react'
import { etiquetaDePartido } from '@/lib/partido'
import { getPartidosParaEditor } from '@/lib/supabase/queries/partidos'

/**
 * Los partidos, para entrar a cargar uno.
 *
 * **No se puede crear un partido desde acá todavía**: eso es el Step 12 —el
 * CRUD de entidades— que no está hecho. Hoy los partidos entran por SQL, como
 * el de la fecha 4 en `supabase/datos/`. Esta pantalla es sólo la puerta a la
 * planilla.
 */
export const metadata: Metadata = { title: 'Partidos' }
export const dynamic = 'force-dynamic'

export default async function Partidos() {
  const partidos = await getPartidosParaEditor()

  return (
    <main className="mx-auto max-w-[900px] px-4 py-8">
      <h1 className="titular mb-6 text-[1.6rem]">Partidos</h1>

      {partidos.length === 0 ? (
        <p className="border-l-2 border-linea-fuerte bg-papel-alt px-4 py-3 text-[0.95rem]">
          Todavía no hay partidos cargados. Se cargan por SQL hasta que exista el alta de
          partidos, que es el Step 12.
        </p>
      ) : (
        <ul>
          {partidos.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 border-b border-linea py-3">
              <span className="font-display text-[1rem] font-bold">{etiquetaDePartido(p)}</span>
              <span className="meta text-gris">{p.estado}</span>
              <Link
                href={`/admin/partidos/${p.id}/planilla`}
                className="tactil ml-auto flex items-center gap-2 bg-verde-900 px-4 font-display text-[0.9rem] font-extrabold text-white hover:bg-verde-600"
              >
                <ClipboardList size={16} aria-hidden="true" />
                Planilla
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
