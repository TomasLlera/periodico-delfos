import Link from 'next/link'
import { fechaCorta, minutoEvento } from '@/lib/formato'
import { golesOrdenados, rivalDelGol } from '@/lib/jugadora'
import { SUFIJO_EVENTO } from '@/lib/partido'
import type { GolDeJugadora } from '@/types'

/**
 * Los goles de la jugadora, con el minuto y el rival de cada uno.
 *
 * Es la respuesta a "¿cuántos goles lleva y a quién se los hizo?", que hoy en
 * el sitio viejo no se puede contestar sin leer las once crónicas. Cada gol
 * linkea al partido: la ficha de jugadora es una puerta al archivo, no una
 * hoja suelta.
 *
 * Van del más nuevo al más viejo, no por el minuto del partido (ver
 * `golesOrdenados()`).
 */
interface Props {
  goles: readonly GolDeJugadora[]
}

export function ListaGoles({ goles }: Props) {
  if (goles.length === 0) {
    return (
      <p className="max-w-medida border-l-4 border-verde-600 bg-papel-alt py-5 pl-5 font-body text-gris">
        Todavía no convirtió en ningún partido cargado.
      </p>
    )
  }

  return (
    <ul className="flex flex-col">
      {golesOrdenados(goles).map((gol) => {
        const contra = rivalDelGol(gol)
        const sufijo = SUFIJO_EVENTO[gol.tipo]
        const fecha = gol.partido.fecha_numero ? `Fecha ${gol.partido.fecha_numero}` : null

        return (
          <li key={gol.id} className="border-b border-linea">
            <Link
              href={`/partido/${gol.partido.slug}`}
              className="group flex items-baseline gap-3 py-3 transition-colors hover:bg-papel-alt sm:gap-4"
            >
              <span className="dato w-14 shrink-0 text-[1.05rem] font-bold text-verde-600">
                {minutoEvento(gol)}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block font-display text-[0.95rem] leading-tight group-hover:text-verde-600">
                  a {contra.nombre}
                  {/* Local o visitante: el mismo rival de ida y de vuelta son
                      dos partidos distintos, y sin esto se leen igual. */}
                  <span className="meta ml-2 text-[0.65rem]">
                    {contra.deLocal ? 'Local' : 'Visitante'}
                  </span>
                </span>

                <span className="dato mt-0.5 block text-[0.75rem] text-gris">
                  {[fecha, fechaCorta(gol.partido.fecha_hora)].filter(Boolean).join(' · ')}
                  {sufijo ? ` · ${sufijo}` : ''}
                </span>
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
