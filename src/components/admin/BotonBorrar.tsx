'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import type { ResultadoEntidad } from '@/lib/entidades/campos'

/**
 * Borrar, con la confirmación adentro del propio botón.
 *
 * **No usa `window.confirm()`**: ese diálogo no se puede estilar, aparece
 * pegado arriba de todo en el celular lejos del dedo, y en iOS lo puede
 * bloquear el navegador entero. El botón se convierte en la pregunta, que es
 * la misma protección —dos toques deliberados— sin salir de la página.
 *
 * El aviso de qué se lleva puesto lo pone quien lo usa, porque cambia por
 * entidad: sacar una jugadora del plantel no pierde nada, y borrar una
 * temporada se lleva su plantel y su tabla por cascada.
 */

interface Props {
  /** Qué se está por borrar: "el equipo Claypole". Va adentro de la pregunta. */
  que: string
  /** Lo que se lleva puesto, si se lleva algo. Se muestra al confirmar. */
  consecuencia?: string
  borrar: () => Promise<ResultadoEntidad>
  /** A dónde ir después. Sin esto se queda y refresca. */
  volverA?: string
}

export function BotonBorrar({ que, consecuencia, borrar, volverA }: Props) {
  const router = useRouter()
  const [preguntando, setPreguntando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ocupado, empezar] = useTransition()

  if (error) {
    return (
      <span className="flex flex-wrap items-center gap-2">
        <span role="alert" className="text-[0.85rem] text-roja">
          {error}
        </span>
        <button
          type="button"
          onClick={() => {
            setError(null)
            setPreguntando(false)
          }}
          className="tactil px-2 text-[0.85rem] underline underline-offset-4"
        >
          Entendido
        </button>
      </span>
    )
  }

  if (!preguntando) {
    return (
      <button
        type="button"
        onClick={() => setPreguntando(true)}
        className="tactil flex items-center gap-2 px-3 font-display text-[0.9rem] font-bold text-roja hover:underline"
      >
        <Trash2 size={16} aria-hidden="true" />
        Borrar
      </button>
    )
  }

  return (
    <span className="flex flex-wrap items-center gap-2 text-[0.85rem]">
      <span>
        ¿Borrar {que}?
        {consecuencia && <strong className="block font-normal text-roja">{consecuencia}</strong>}
      </span>

      <button
        type="button"
        disabled={ocupado}
        onClick={() =>
          empezar(async () => {
            const r = await borrar()
            if (r.error) {
              setError(r.error)
              return
            }
            router.refresh()
            if (volverA) router.push(volverA)
          })
        }
        className="tactil bg-roja px-3 font-display text-[0.85rem] font-extrabold text-white disabled:opacity-60"
      >
        {ocupado ? 'Borrando…' : 'Sí, borrar'}
      </button>

      <button
        type="button"
        onClick={() => setPreguntando(false)}
        className="tactil px-2 underline underline-offset-4"
      >
        No
      </button>
    </span>
  )
}
