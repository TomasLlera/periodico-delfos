'use client'

import { Eye, Save } from 'lucide-react'

/**
 * El pie del editor: el aviso de lo último que pasó y los dos botones.
 *
 * Es `sticky` porque una crónica larga empuja los botones fuera de la pantalla,
 * y guardar no puede depender de scrollear hasta el fondo.
 *
 * **No hay un botón que publique derecho**, y es a propósito: publicar dispara
 * el auto-posteo a las redes, que no tiene vuelta atrás. El camino pasa siempre
 * por la vista previa, y la confirmación está allá adentro.
 *
 * Salió de `FormularioNota` cuando volvió a pasar las 300 líneas que fija
 * CLAUDE.md, al entrar el selector de partido.
 */

interface Props {
  aviso: string | null
  ocupado: boolean
  onGuardar: () => void
  onVistaPrevia: () => void
}

export function BarraAcciones({ aviso, ocupado, onGuardar, onVistaPrevia }: Props) {
  return (
    <>
      {aviso && (
        <p role="status" className="border-l-2 border-accent-text bg-bg-muted px-3 py-2 text-[0.9rem]">
          {aviso}
        </p>
      )}

      <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-border bg-bg py-3">
        <button
          type="button"
          onClick={onGuardar}
          disabled={ocupado}
          className="tactil flex items-center gap-2 border border-border-control px-5 font-display text-[0.9rem] font-bold hover:bg-bg-muted disabled:opacity-60"
        >
          <Save size={16} aria-hidden="true" />
          Guardar borrador
        </button>

        <button
          type="button"
          onClick={onVistaPrevia}
          disabled={ocupado}
          className="tactil flex items-center gap-2 bg-text px-5 font-display text-[0.9rem] font-extrabold text-bg hover:bg-text/85 disabled:opacity-60"
        >
          <Eye size={16} aria-hidden="true" />
          Vista previa y publicar
        </button>
      </div>
    </>
  )
}
