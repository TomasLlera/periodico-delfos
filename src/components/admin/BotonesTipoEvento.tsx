'use client'

import { IconoEvento } from '@/components/partido/IconoEvento'
import type { TipoEvento } from '@/types'

/**
 * Qué pasó. Los cuatro botones grandes con los que arranca cada carga.
 *
 * Son cuatro y no nueve a propósito. `tipo_evento_t` tiene nueve valores, pero
 * el blueprint § 7.6 pide exactamente estos cuatro —gol, amarilla, roja,
 * cambio— porque son el 95% de lo que pasa en un partido y porque una grilla de
 * nueve botones obliga a leer antes de tocar. Los otros cinco —penal, gol en
 * contra, penal errado, doble amarilla, lesión— se cargan después desde la
 * lista, con el partido terminado y sin apuro.
 *
 * Ocupan toda la fila y miden bastante más que los 44px mínimos: acá el dedo no
 * apunta, golpea. Es la única pantalla del proyecto que se usa parada, en una
 * tribuna y mirando otra cosa.
 */

const TIPOS: readonly { tipo: TipoEvento; nombre: string }[] = [
  { tipo: 'gol', nombre: 'Gol' },
  { tipo: 'amarilla', nombre: 'Amarilla' },
  { tipo: 'roja', nombre: 'Roja' },
  { tipo: 'cambio', nombre: 'Cambio' },
]

interface Props {
  elegido: TipoEvento | null
  onElegir: (tipo: TipoEvento) => void
}

export function BotonesTipoEvento({ elegido, onElegir }: Props) {
  return (
    <div role="group" aria-label="Qué pasó" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {TIPOS.map(({ tipo, nombre }) => {
        const activo = elegido === tipo

        return (
          <button
            key={tipo}
            type="button"
            onClick={() => onElegir(tipo)}
            aria-pressed={activo}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-sm border font-display text-[0.95rem] font-extrabold ${
              activo
                ? 'border-verde-900 bg-verde-900 text-white'
                : 'border-linea-fuerte bg-tarjeta hover:border-verde-600'
            }`}
          >
            <IconoEvento tipo={tipo} className="h-5 w-5" />
            {nombre}
          </button>
        )
      })}
    </div>
  )
}
