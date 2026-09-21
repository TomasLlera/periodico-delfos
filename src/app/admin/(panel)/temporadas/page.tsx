import type { Metadata } from 'next'
import Link from 'next/link'
import { ListOrdered, Pencil, Plus, Users } from 'lucide-react'
import { Aviso } from '@/components/admin/Aviso'
import { getTemporadas } from '@/lib/supabase/queries/temporadas'

/**
 * Las temporadas.
 *
 * Además de editarlas, esta pantalla es la puerta a las dos cosas que cuelgan
 * de una temporada y que no tienen listado propio: el plantel y la tabla de
 * posiciones. Las dos necesitan saber **de qué temporada**, y elegirla acá es
 * más corto que un selector en cada una.
 */
export const metadata: Metadata = { title: 'Temporadas' }
export const dynamic = 'force-dynamic'

export default async function Temporadas() {
  const temporadas = await getTemporadas()

  return (
    <main className="mx-auto max-w-[900px] px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <h1 className="titular text-[1.6rem]">Temporadas</h1>

        <Link
          href="/admin/temporadas/nueva"
          className="tactil ml-auto flex items-center gap-2 bg-amarillo px-4 font-display text-[0.9rem] font-extrabold text-negro-cancha hover:bg-amarillo/90"
        >
          <Plus size={16} aria-hidden="true" />
          Temporada nueva
        </Link>
      </div>

      {temporadas.length === 0 ? (
        <Aviso>
          Todavía no hay temporadas. Es lo primero que hay que cargar: el plantel, el fixture y
          la tabla cuelgan de una temporada.
        </Aviso>
      ) : (
        <ul>
          {temporadas.map((temporada) => (
            <li key={temporada.id} className="border-b border-linea py-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                {temporada.activa && (
                  <span className="meta bg-verde-900 px-2 py-0.5 text-white">En curso</span>
                )}

                <Link
                  href={`/admin/temporadas/${temporada.id}`}
                  className="font-display text-[1rem] font-bold underline-offset-4 hover:underline"
                >
                  {temporada.nombre}
                </Link>

                {temporada.zona && (
                  <span className="text-[0.85rem] text-gris">{temporada.zona}</span>
                )}

                <Link
                  href={`/admin/temporadas/${temporada.id}`}
                  className="tactil ml-auto flex items-center gap-1 text-[0.85rem] text-gris hover:underline"
                >
                  <Pencil size={14} aria-hidden="true" />
                  Editar
                </Link>
              </div>

              {/* Las dos pantallas que cuelgan de la temporada. Van acá porque
                  necesitan saber cuál, y este listado es donde eso ya se sabe. */}
              <div className="mt-2 flex flex-wrap gap-2">
                <Link
                  href={`/admin/plantel/${temporada.id}`}
                  className="tactil flex items-center gap-2 border border-linea-fuerte px-3 font-display text-[0.85rem] font-bold hover:bg-papel-alt"
                >
                  <Users size={14} aria-hidden="true" />
                  Plantel
                </Link>

                <Link
                  href={`/admin/tabla/${temporada.id}`}
                  className="tactil flex items-center gap-2 border border-linea-fuerte px-3 font-display text-[0.85rem] font-bold hover:bg-papel-alt"
                >
                  <ListOrdered size={14} aria-hidden="true" />
                  Tabla de posiciones
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
