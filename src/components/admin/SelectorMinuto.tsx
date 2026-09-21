'use client'

import { Minus, Plus } from 'lucide-react'

/**
 * Cuándo. El minuto, con dos botones grandes y un campo numérico.
 *
 * El blueprint pide una "rueda numérica". Esto es lo mismo con otra mecánica, y
 * la razón es de uso: entre dos eventos pasan pocos minutos, así que **±1
 * alcanza casi siempre** y es un toque con el pulgar sin apuntar. La rueda
 * obliga a arrastrar y a mirar. El campo queda para el caso raro —cargar algo
 * del primer tiempo cuando ya va 80— y abre el teclado numérico en el celular
 * gracias a `inputMode`.
 *
 * Arranca en el minuto del último evento cargado, no en cero: ver
 * `minutoSugerido()` en `src/lib/planilla.ts`.
 *
 * El adicionado va aparte porque es otra cosa: 45+2 no es 47, y el sitio los
 * muestra distinto.
 */

interface Props {
  minuto: number
  adicionado: number
  onMinuto: (v: number) => void
  onAdicionado: (v: number) => void
}

export function SelectorMinuto({ minuto, adicionado, onMinuto, onAdicionado }: Props) {
  const acotado = (v: number) => Math.min(120, Math.max(0, v))

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="minuto" className="meta text-gris">
          Minuto
        </label>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMinuto(acotado(minuto - 1))}
            aria-label="Un minuto menos"
            className="tactil flex items-center justify-center rounded-sm border border-linea-fuerte px-3 hover:bg-papel-alt"
          >
            <Minus size={18} aria-hidden="true" />
          </button>

          <input
            id="minuto"
            type="number"
            inputMode="numeric"
            min={0}
            max={120}
            value={minuto}
            onChange={(e) => onMinuto(acotado(Number(e.target.value)))}
            className="tactil w-20 border border-linea-fuerte bg-tarjeta text-center font-mono text-[1.3rem] font-bold"
          />

          <button
            type="button"
            onClick={() => onMinuto(acotado(minuto + 1))}
            aria-label="Un minuto más"
            className="tactil flex items-center justify-center rounded-sm border border-linea-fuerte px-3 hover:bg-papel-alt"
          >
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="adicionado" className="meta text-gris">
          Adicionado
        </label>
        <input
          id="adicionado"
          type="number"
          inputMode="numeric"
          min={0}
          max={30}
          value={adicionado}
          onChange={(e) => onAdicionado(Math.min(30, Math.max(0, Number(e.target.value))))}
          className="tactil w-16 border border-linea-fuerte bg-tarjeta text-center font-mono text-[1.1rem]"
        />
      </div>
    </div>
  )
}
