'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { RefreshCw } from 'lucide-react'
import { reintentarPosteos } from '@/actions/posteos'

/**
 * Volver a intentar los posteos de una nota.
 *
 * **No pregunta antes.** Es la excepción a lo que hace `BotonBorrar`, y por la
 * razón opuesta: reintentar no puede romper nada. Lo que ya se publicó no se
 * vuelve a publicar —eso lo garantiza `social_posts`, no este botón— así que
 * lo peor que puede pasar es que no salga otra vez.
 *
 * Lo que sí hace es decir qué pasó. Un botón que dispara un proceso durable y
 * no contesta nada deja a quien lo apretó mirando la pantalla sin saber si
 * anduvo: el aviso queda hasta el próximo click.
 */

interface Props {
  notaId: string
  /** El título, para el texto accesible: hay uno de estos por fila. */
  titulo: string
}

export function BotonReintentar({ notaId, titulo }: Props) {
  const router = useRouter()
  const [aviso, setAviso] = useState<string | null>(null)
  const [ocupado, empezar] = useTransition()

  return (
    <span className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={ocupado}
        aria-label={`Reintentar los posteos de ${titulo}`}
        onClick={() =>
          empezar(async () => {
            const r = await reintentarPosteos(notaId)

            if (r.error) {
              setAviso(r.error)
              return
            }

            // La cola es durable: el evento se emitió, pero los posteos pueden
            // tardar. Decir "listo" sería mentir; decir que se pidió, no.
            setAviso('Se pidió el reintento. Puede tardar unos segundos.')
            router.refresh()
          })
        }
        className="tactil flex items-center gap-2 border border-linea-fuerte px-3 font-display text-[0.85rem] font-bold hover:bg-papel-alt disabled:opacity-60"
      >
        <RefreshCw size={14} aria-hidden="true" />
        {ocupado ? 'Pidiendo…' : 'Reintentar'}
      </button>

      {aviso && (
        <span role="status" className="text-[0.8rem] text-gris">
          {aviso}
        </span>
      )}
    </span>
  )
}
