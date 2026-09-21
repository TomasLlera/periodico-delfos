'use client'

import { Trash2 } from 'lucide-react'
import { IconoEvento } from '@/components/partido/IconoEvento'
import { ETIQUETA_EVENTO } from '@/lib/partido'
import type { EventoConJugadora } from '@/types'

/**
 * Lo cargado hasta ahora, con su minuto y a quién.
 *
 * Es la parte de la planilla que evita el error más caro: cargar dos veces el
 * mismo gol, o cargárselo a la jugadora equivocada. Por eso se ve **siempre**,
 * arriba de la pantalla de carga, y no escondida en otra pestaña.
 *
 * Borrar no pide confirmación. Con el partido en juego, un diálogo de "¿estás
 * seguro?" es un toque más y una pausa; y si se borra de más, volver a cargar
 * el evento son dos toques. El costo del error es bajo y el de la fricción,
 * alto.
 *
 * Usa `<IconoEvento />`, el mismo de la planilla de lectura: es la misma
 * información y no tiene por qué verse distinta de los dos lados.
 */

interface Props {
  eventos: readonly EventoConJugadora[]
  /** Para decir de qué lado va cada evento. */
  equipoLocalId: string
  nombreLocal: string
  nombreVisitante: string
  onBorrar: (id: string) => void
  borrando: string | null
}

export function ListaEventos({
  eventos,
  equipoLocalId,
  nombreLocal,
  nombreVisitante,
  onBorrar,
  borrando,
}: Props) {
  if (eventos.length === 0) {
    return (
      <p className="border-l-2 border-linea-fuerte bg-papel-alt px-3 py-2 text-[0.9rem]">
        Todavía no cargaste nada. Elegí qué pasó con los botones de abajo.
      </p>
    )
  }

  const enOrden = [...eventos].sort((a, b) =>
    a.minuto === b.minuto ? a.adicionado - b.adicionado : a.minuto - b.minuto,
  )

  return (
    <ul className="flex flex-col">
      {enOrden.map((e) => {
        const quien = e.jugadora ? e.jugadora.apellido : (e.jugadora_nombre ?? '—')
        const equipo = e.equipo_id === equipoLocalId ? nombreLocal : nombreVisitante

        return (
          <li key={e.id} className="flex items-center gap-2 border-b border-linea py-2">
            <span className="w-12 shrink-0 font-mono text-[0.95rem] font-bold">
              {e.minuto}
              {e.adicionado > 0 && `+${e.adicionado}`}
              <span aria-hidden="true">'</span>
            </span>

            <IconoEvento tipo={e.tipo} />

            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate font-display text-[0.95rem] font-bold">{quien}</span>
              <span className="meta text-gris">
                {ETIQUETA_EVENTO[e.tipo]} · {equipo}
              </span>
            </span>

            <button
              type="button"
              onClick={() => onBorrar(e.id)}
              disabled={borrando === e.id}
              aria-label={`Borrar ${ETIQUETA_EVENTO[e.tipo]} de ${quien} al minuto ${e.minuto}`}
              className="tactil ml-auto flex shrink-0 items-center justify-center px-2 text-gris hover:text-roja disabled:opacity-50"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
