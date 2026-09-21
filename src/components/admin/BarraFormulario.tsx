'use client'

import Link from 'next/link'
import { Save } from 'lucide-react'

/**
 * El pie de los formularios del CRUD: el aviso de lo último que pasó, guardar
 * y volver.
 *
 * Es el hermano de `BarraAcciones`, que es la del editor de notas. Son dos y
 * no una porque hacen cosas distintas: aquélla tiene vista previa y publicar
 * —que dispara el auto-posteo y no tiene vuelta atrás—, y ésta guarda una fila
 * de catálogo. Unificarlas pondría un botón de publicar al lado del alta de un
 * equipo.
 *
 * `sticky` por la misma razón que la otra: el formulario de partido tiene once
 * campos y en un celular el botón queda abajo de todo.
 */

interface Props {
  aviso: string | null
  ocupado: boolean
  onGuardar: () => void
  /** El listado al que se vuelve sin guardar. */
  volverA: string
  /** El texto del botón. "Crear el partido" dice más que "Guardar". */
  etiqueta?: string
  /** El borrado, cuando la entidad lo permite. Va separado y a la derecha. */
  borrar?: React.ReactNode
}

export function BarraFormulario({
  aviso,
  ocupado,
  onGuardar,
  volverA,
  etiqueta = 'Guardar',
  borrar,
}: Props) {
  return (
    <>
      {aviso && (
        <p role="status" className="border-l-2 border-roja bg-papel-alt px-3 py-2 text-[0.9rem]">
          {aviso}
        </p>
      )}

      <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-linea bg-papel py-3">
        <button
          type="button"
          onClick={onGuardar}
          disabled={ocupado}
          className="tactil flex items-center gap-2 bg-verde-900 px-5 font-display text-[0.9rem] font-extrabold text-white hover:bg-verde-600 disabled:opacity-60"
        >
          <Save size={16} aria-hidden="true" />
          {ocupado ? 'Guardando…' : etiqueta}
        </button>

        <Link
          href={volverA}
          className="tactil flex items-center border border-linea-fuerte px-5 font-display text-[0.9rem] font-bold hover:bg-papel-alt"
        >
          Cancelar
        </Link>

        {borrar && <span className="ml-auto">{borrar}</span>}
      </div>
    </>
  )
}
