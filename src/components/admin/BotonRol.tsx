'use client'

import { useState, useTransition } from 'react'
import { ShieldCheck, ShieldOff } from 'lucide-react'
import { cambiarRolDeAutor } from '@/actions/autor'
import type { RolDeAutor } from '@/types'

/**
 * El botón que sube o baja de rol a una cuenta.
 *
 * **Es cliente y no un `<form>` con el action adentro**, que sería lo barato:
 * el action puede negarse —nadie se quita a sí mismo el rol de editor— y ese
 * motivo hay que poder mostrarlo al lado del botón. Un form que postea y
 * recarga pierde el mensaje por el camino.
 *
 * El texto dice qué va a pasar y no qué es: "Hacer editor" se entiende sin
 * saber cómo se llama el rol de hoy, que es lo que muestra la fila al lado.
 */
interface Props {
  id: string
  rolDeHoy: RolDeAutor
  /** El nombre, para que el aviso diga de quién habla. */
  nombre: string
  /** La cuenta de quien está mirando: sobre la propia no se ofrece bajarse. */
  esUnoMismo: boolean
}

export function BotonRol({ id, rolDeHoy, nombre, esUnoMismo }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [ocupado, empezar] = useTransition()

  const destino: RolDeAutor = rolDeHoy === 'editor' ? 'redactor' : 'editor'

  // Un editor no se puede degradar a sí mismo: con uno solo, el medio queda sin
  // nadie que pueda dar de alta una cuenta. El action lo rechaza igual; acá el
  // botón no se ofrece, que es mejor que ofrecerlo y después decir que no.
  if (esUnoMismo && rolDeHoy === 'editor') {
    return <span className="text-[0.8rem] text-text-muted">Sos vos</span>
  }

  return (
    <span className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={ocupado}
        onClick={() =>
          empezar(async () => {
            setError(null)
            const r = await cambiarRolDeAutor(id, destino)
            if (r.error) setError(r.error)
          })
        }
        className="tactil flex items-center gap-1 px-2 text-[0.85rem] hover:underline disabled:opacity-50"
      >
        {destino === 'editor' ? (
          <ShieldCheck size={14} aria-hidden="true" />
        ) : (
          <ShieldOff size={14} aria-hidden="true" />
        )}
        {destino === 'editor' ? 'Hacer editor' : 'Hacer redactor'}
        <span className="sr-only"> a {nombre}</span>
      </button>

      {error && (
        <span role="alert" className="text-[0.8rem] text-danger">
          {error}
        </span>
      )}
    </span>
  )
}
