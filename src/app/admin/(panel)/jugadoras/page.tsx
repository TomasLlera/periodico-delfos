import type { Metadata } from 'next'
import Link from 'next/link'
import { Pencil, Plus } from 'lucide-react'
import { Aviso } from '@/components/admin/Aviso'
import { nombreDeLista } from '@/lib/entidades/jugadora'
import { NOMBRE_PUESTO } from '@/lib/plantel'
import { getJugadoras } from '@/lib/supabase/queries/jugadoras'

/**
 * Las jugadoras: la ficha de la persona, no la del plantel de un año.
 *
 * Se listan por apellido y separadas en dos bloques, las del club y las que se
 * fueron. **Las inactivas no se esconden**: siguen teniendo goles en las
 * planillas viejas y hay que poder entrar a corregirles un dato o a
 * reactivarlas cuando vuelven.
 */
export const metadata: Metadata = { title: 'Jugadoras' }
export const dynamic = 'force-dynamic'

export default async function Jugadoras() {
  const jugadoras = await getJugadoras()

  const enElClub = jugadoras.filter((j) => j.activa)
  const seFueron = jugadoras.filter((j) => !j.activa)

  return (
    <main className="mx-auto max-w-[900px] px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <h1 className="titular text-[1.6rem]">Jugadoras</h1>

        <Link
          href="/admin/jugadoras/nueva"
          className="tactil ml-auto flex items-center gap-2 bg-amarillo px-4 font-display text-[0.9rem] font-extrabold text-negro-cancha hover:bg-amarillo/90"
        >
          <Plus size={16} aria-hidden="true" />
          Jugadora nueva
        </Link>
      </div>

      {jugadoras.length === 0 && (
        <Aviso>
          Todavía no hay jugadoras. Después de cargarlas hay que armar el plantel de la
          temporada, que es lo que la planilla del partido usa para dibujar la grilla.
        </Aviso>
      )}

      {enElClub.length > 0 && (
        <section className="mb-8">
          <h2 className="meta mb-2 text-gris">En el club · {enElClub.length}</h2>
          <ul>
            {enElClub.map((jugadora) => (
              <Fila key={jugadora.id} jugadora={jugadora} />
            ))}
          </ul>
        </section>
      )}

      {seFueron.length > 0 && (
        <section>
          <h2 className="meta mb-2 text-gris">Ya no están · {seFueron.length}</h2>
          <ul>
            {seFueron.map((jugadora) => (
              <Fila key={jugadora.id} jugadora={jugadora} />
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}

function Fila({
  jugadora,
}: {
  jugadora: Awaited<ReturnType<typeof getJugadoras>>[number]
}) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-linea py-3">
      <Link
        href={`/admin/jugadoras/${jugadora.id}`}
        className="font-display text-[1rem] font-bold underline-offset-4 hover:underline"
      >
        {nombreDeLista(jugadora)}
      </Link>

      <span className="meta text-gris">{NOMBRE_PUESTO[jugadora.posicion]}</span>

      <span className="ml-auto flex items-center gap-3 text-[0.85rem] text-gris">
        {jugadora.activa && (
          <Link href={`/jugadora/${jugadora.slug}`} target="_blank" className="tactil hover:underline">
            Ver
          </Link>
        )}
        <Link
          href={`/admin/jugadoras/${jugadora.id}`}
          className="tactil flex items-center gap-1 hover:underline"
        >
          <Pencil size={14} aria-hidden="true" />
          Editar
        </Link>
      </span>
    </li>
  )
}
