/**
 * Firma, fecha y tiempo de lectura.
 *
 * La fecha va en un `<time dateTime>` con el ISO completo: es lo que leen los
 * agregadores y lo que Google usa para fechar la nota, y no depende de cómo
 * esté escrita en pantalla.
 */

import Link from 'next/link'
import { fechaLarga } from '@/lib/formato'
import type { Autor } from '@/types'

interface Props {
  autor: Pick<Autor, 'nombre' | 'slug'>
  /** ISO. `null` en una nota que todavía no se publicó. */
  publicadaEn: string | null
  /** Ya formateado: "4 min de lectura". */
  tiempoDeLectura: string
}

export function LineaAutor({ autor, publicadaEn, tiempoDeLectura }: Props) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 border-y border-linea py-3">
      <span className="meta text-tinta">
        Por{' '}
        <Link href="/quienes-somos" className="hover:text-verde-600">
          {autor.nombre}
        </Link>
      </span>

      {publicadaEn && (
        <>
          <Separador />
          <time dateTime={publicadaEn} className="meta">
            {fechaLarga(publicadaEn)}
          </time>
        </>
      )}

      <Separador />
      <span className="meta">{tiempoDeLectura}</span>
    </div>
  )
}

function Separador() {
  return (
    <span className="meta" aria-hidden="true">
      ·
    </span>
  )
}
