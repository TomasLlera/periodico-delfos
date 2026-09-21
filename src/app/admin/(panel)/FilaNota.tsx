import Link from 'next/link'
import { ExternalLink, Pencil } from 'lucide-react'
import { etiquetaCategoria, fechaCorta } from '@/lib/formato'
import type { NotaResumen } from '@/types'

/**
 * Una nota en el listado del panel.
 *
 * Vive al lado de su page y no en `src/components/admin/` porque no la usa
 * nadie más: es la convención del repo para los componentes de una sola
 * página.
 *
 * El estado se dice con palabra y con color, nunca con color solo: "Borrador"
 * escrito es lo que hace que la fila se entienda en una captura en blanco y
 * negro, con daltonismo, o leída por un lector de pantalla.
 */

const ESTILO_ESTADO = {
  borrador: 'bg-amarillo text-negro-cancha',
  publicada: 'bg-verde-900 text-white',
  archivada: 'bg-papel-alt text-gris',
} as const

const NOMBRE_ESTADO = {
  borrador: 'Borrador',
  publicada: 'Publicada',
  archivada: 'Archivada',
} as const

export function FilaNota({ nota }: { nota: NotaResumen }) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-linea py-3">
      <span className={`meta px-2 py-0.5 ${ESTILO_ESTADO[nota.estado]}`}>
        {NOMBRE_ESTADO[nota.estado]}
      </span>

      <Link
        href={`/admin/notas/${nota.id}`}
        className="font-display text-[1rem] font-bold underline-offset-4 hover:underline"
      >
        {nota.titulo}
      </Link>

      <span className="meta text-gris">{etiquetaCategoria(nota.categoria)}</span>

      <span className="ml-auto flex items-center gap-3 text-[0.85rem] text-gris">
        {/* La fecha que importa en el panel es la del último cambio: un
            borrador nunca tiene fecha de publicación. */}
        <span>{fechaCorta(nota.updated_at)}</span>

        {nota.estado === 'publicada' && (
          <Link
            href={`/nota/${nota.slug}`}
            target="_blank"
            className="tactil flex items-center gap-1 hover:underline"
          >
            Ver
            <ExternalLink size={14} aria-hidden="true" />
          </Link>
        )}

        <Link href={`/admin/notas/${nota.id}`} className="tactil flex items-center gap-1 hover:underline">
          <Pencil size={14} aria-hidden="true" />
          Editar
        </Link>
      </span>
    </li>
  )
}
