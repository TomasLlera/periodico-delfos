'use client'

import { Send } from 'lucide-react'
import { botonParaReanudar, type Pendiente } from '@/lib/borrador'

/**
 * "Volvió la conexión": la pregunta antes de reanudar un publicar o un
 * programar que quedó sin respuesta.
 *
 * **Guardar no pasa por acá**: se reintenta solo al volver la señal, porque un
 * borrador no lo ve nadie. Publicar dispara el posteo a las redes y eso no se
 * hace sin que alguien lo confirme.
 *
 * Reanudar es seguro aunque la primera vez sí haya llegado: la nota se
 * escribe con el mismo id (`escribirNota()`) y el posteo es idempotente por
 * `social_posts (nota_id, platform)`.
 */

interface Props {
  pendiente: Pendiente
  ocupado: boolean
  onReanudar: () => void
}

export function AvisoReconexion({ pendiente, ocupado, onReanudar }: Props) {
  const accion = pendiente.tipo === 'programar' ? 'programó' : 'publicó'

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-3 border-l-2 border-accent-text bg-bg-muted px-3 py-2"
    >
      <p className="flex-1 text-[0.9rem]">
        Volvió la conexión. No pudimos confirmar si la nota se {accion}.
      </p>
      <button
        type="button"
        onClick={onReanudar}
        disabled={ocupado}
        className="tactil flex items-center gap-2 bg-text px-5 font-display text-[0.9rem] font-extrabold text-bg hover:bg-text/85 disabled:opacity-60"
      >
        <Send size={16} aria-hidden="true" />
        {botonParaReanudar(pendiente)}
      </button>
    </div>
  )
}
