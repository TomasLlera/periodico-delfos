import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Aviso } from '@/components/admin/Aviso'
import { RecordatorioTabla } from '@/components/admin/RecordatorioTabla'
import { fechasSinTabla } from '@/lib/entidades/tabla'
import { getPartidosParaPanel } from '@/lib/supabase/queries/partidos'
import { getFechasConTabla } from '@/lib/supabase/queries/temporadas'
import { FilaPartido } from './FilaPartido'

/**
 * Los partidos.
 *
 * Hasta el Step 12 esta pantalla era sólo la puerta a la planilla y los
 * partidos entraban por SQL: la planilla —el Step 13— se construyó antes que
 * el alta, y editaba un partido que tenía que existir de antes. Ahora se crean
 * desde acá.
 *
 * El orden es por fecha, del más nuevo al más viejo, que es el orden en que se
 * trabaja: la crónica se escribe el mismo día del partido.
 */
export const metadata: Metadata = { title: 'Partidos' }
export const dynamic = 'force-dynamic'

export default async function Partidos() {
  const partidos = await getPartidosParaPanel()

  /**
   * Las fechas jugadas a las que les falta la tabla, por temporada.
   *
   * Se agrupa por temporada porque el listado las trae mezcladas y una fecha 4
   * de 2024 no tiene nada que ver con la fecha 4 de 2026. Son una o dos
   * consultas —tantas como temporadas con partidos finalizados haya en la
   * página— y no una por partido.
   */
  const temporadas = [...new Set(partidos.filter((p) => p.estado === 'finalizado').map((p) => p.temporada_id))]

  const pendientes = await Promise.all(
    temporadas.map(async (temporadaId) => ({
      temporadaId,
      fechas: fechasSinTabla(
        partidos.filter((p) => p.temporada_id === temporadaId),
        await getFechasConTabla(temporadaId),
      ),
    })),
  )

  return (
    <main className="mx-auto max-w-[900px] px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <h1 className="titular text-[1.6rem]">Partidos</h1>

        <Link
          href="/admin/partidos/nuevo"
          className="tactil ml-auto flex items-center gap-2 bg-amarillo px-4 font-display text-[0.9rem] font-extrabold text-negro-cancha hover:bg-amarillo/90"
        >
          <Plus size={16} aria-hidden="true" />
          Partido nuevo
        </Link>
      </div>

      {pendientes.map(
        (p) =>
          p.fechas.length > 0 && (
            <div key={p.temporadaId} className="mb-5">
              <RecordatorioTabla temporadaId={p.temporadaId} fechas={p.fechas} />
            </div>
          ),
      )}

      {partidos.length === 0 ? (
        <Aviso>
          Todavía no hay partidos cargados. Un partido necesita una temporada y dos equipos:
          si falta alguno de los dos, la pantalla de alta lo dice.
        </Aviso>
      ) : (
        <ul>
          {partidos.map((partido) => (
            <FilaPartido key={partido.id} partido={partido} cargado={partido.cargado} />
          ))}
        </ul>
      )}
    </main>
  )
}
