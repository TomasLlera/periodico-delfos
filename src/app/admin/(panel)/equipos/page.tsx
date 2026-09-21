import type { Metadata } from 'next'
import Link from 'next/link'
import { Pencil, Plus, Shield } from 'lucide-react'
import { Aviso } from '@/components/admin/Aviso'
import { getEquipos } from '@/lib/supabase/queries/equipos'

/**
 * Los equipos del campeonato.
 *
 * Es la primera pantalla del CRUD de entidades (Step 12) y la que hay que
 * cargar primero en una base vacía: un partido necesita dos equipos y la tabla
 * de posiciones necesita once.
 *
 * Dinámica y sin cache, como todo el panel: el que mira es el que escribe.
 */
export const metadata: Metadata = { title: 'Equipos' }
export const dynamic = 'force-dynamic'

export default async function Equipos() {
  const equipos = await getEquipos()

  return (
    <main className="mx-auto max-w-[900px] px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <h1 className="titular text-[1.6rem]">Equipos</h1>

        <Link
          href="/admin/equipos/nuevo"
          className="tactil ml-auto flex items-center gap-2 bg-amarillo px-4 font-display text-[0.9rem] font-extrabold text-negro-cancha hover:bg-amarillo/90"
        >
          <Plus size={16} aria-hidden="true" />
          Equipo nuevo
        </Link>
      </div>

      {equipos.length === 0 ? (
        <Aviso>
          Todavía no hay equipos. Sin al menos dos no se puede crear un partido: el primero
          que hay que cargar es Aldosivi, marcado como equipo propio.
        </Aviso>
      ) : (
        <ul>
          {equipos.map((equipo) => (
            <li
              key={equipo.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-linea py-3"
            >
              {/* El equipo propio se marca con la palabra y con el icono, no
                  con el color solo: es la misma regla que el estado de las
                  notas en `FilaNota`. */}
              {equipo.es_aldosivi && (
                <span className="meta flex items-center gap-1 bg-verde-900 px-2 py-0.5 text-white">
                  <Shield size={12} aria-hidden="true" />
                  Propio
                </span>
              )}

              <Link
                href={`/admin/equipos/${equipo.id}`}
                className="font-display text-[1rem] font-bold underline-offset-4 hover:underline"
              >
                {equipo.nombre_corto}
              </Link>

              <span className="text-[0.85rem] text-gris">{equipo.nombre}</span>

              <span className="ml-auto flex items-center gap-3 text-[0.85rem] text-gris">
                {equipo.ciudad && <span>{equipo.ciudad}</span>}
                <Link
                  href={`/admin/equipos/${equipo.id}`}
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
    </main>
  )
}
