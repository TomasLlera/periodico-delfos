'use client'

import { History, Trash2 } from 'lucide-react'
import { haceCuanto, quedoViejo, type Borrador } from '@/lib/borrador'

/**
 * "Hay un borrador sin guardar": la oferta al abrir el editor.
 *
 * Arriba de todo y no al pie, porque **hay que contestarla antes de escribir**:
 * mientras está abierta no se guarda nada nuevo en el dispositivo, para no
 * pisar el borrador que se está ofreciendo.
 *
 * Si la nota se volvió a guardar después —desde otro dispositivo—, lo dice:
 * recuperar el borrador pisaría esos cambios cuando se guarde.
 */

interface Props {
  borrador: Borrador
  /** `updated_at` de la nota en la base, o `null` si todavía no existe. */
  actualizadaEn: string | null
  onRecuperar: () => void
  onDescartar: () => void
}

export function AvisoBorrador({ borrador, actualizadaEn, onRecuperar, onDescartar }: Props) {
  const cuando = haceCuanto(borrador.guardado, new Date())

  return (
    <section
      aria-labelledby="aviso-borrador"
      className="flex flex-col gap-3 border-l-2 border-accent-text bg-bg-muted px-4 py-3"
    >
      <h2 id="aviso-borrador" className="font-display text-[1rem] font-extrabold">
        Hay un borrador sin guardar en este dispositivo
      </h2>
      <p className="text-[0.95rem]">
        {borrador.entrada.titulo ? `«${borrador.entrada.titulo}», ` : 'Sin título, '}
        escrito {cuando}. No llegó a confirmarse en el servidor.
        {borrador.archivo && ' Incluye la foto que habías elegido.'}
      </p>
      {quedoViejo(borrador, actualizadaEn) && (
        <p className="text-[0.95rem] font-bold">
          La nota se guardó después desde otro lado: si lo recuperás y guardás, esos cambios se
          pierden.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRecuperar}
          className="tactil flex items-center gap-2 bg-text px-5 font-display text-[0.9rem] font-extrabold text-bg hover:bg-text/85"
        >
          <History size={16} aria-hidden="true" />
          Recuperar
        </button>
        <button
          type="button"
          onClick={onDescartar}
          className="tactil flex items-center gap-2 border border-border-control px-5 font-display text-[0.9rem] font-bold hover:bg-bg-muted"
        >
          <Trash2 size={16} aria-hidden="true" />
          Descartar
        </button>
      </div>
    </section>
  )
}
