'use client'

import type { FormacionConJugadora } from '@/types'

/**
 * Quién. Una grilla de botones grandes, uno por jugadora.
 *
 * El blueprint § 7.6 la pide con fotos; van los dorsales y el apellido porque
 * **las fotos todavía no están cargadas** —`jugadoras.foto_url` está en null
 * para las 33— y una grilla de iniciales genéricas sería peor que el apellido
 * escrito. El día que haya fotos, entran acá sin tocar nada más.
 *
 * Se ordena por dorsal y no alfabéticamente: es el orden en que Charlie las
 * tiene en la cabeza mirando la cancha.
 */

interface Props {
  jugadoras: readonly FormacionConJugadora[]
  /** La elegida, para marcarla. */
  elegida: string | null
  onElegir: (jugadoraId: string) => void
  /** Cuando no hay nadie: distinto texto si es cancha o banco. */
  vacio: string
}

export function GrillaJugadoras({ jugadoras, elegida, onElegir, vacio }: Props) {
  if (jugadoras.length === 0) {
    return <p className="px-1 py-3 text-[0.9rem] text-gris">{vacio}</p>
  }

  const ordenadas = [...jugadoras].sort((a, b) => (a.dorsal ?? 99) - (b.dorsal ?? 99))

  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {ordenadas.map((f) => {
        const activa = f.jugadora_id === elegida

        return (
          <li key={f.jugadora_id}>
            <button
              type="button"
              onClick={() => onElegir(f.jugadora_id)}
              aria-pressed={activa}
              className={`tactil flex w-full flex-col items-center justify-center gap-0.5 rounded-sm border px-1 py-2 ${
                activa
                  ? 'border-verde-900 bg-verde-900 text-white'
                  : 'border-linea bg-tarjeta hover:border-verde-600'
              }`}
            >
              <span className="font-mono text-[1.1rem] font-bold leading-none">
                {f.dorsal ?? '–'}
              </span>
              <span className="font-display text-[0.75rem] leading-tight">
                {f.jugadora.apellido}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
