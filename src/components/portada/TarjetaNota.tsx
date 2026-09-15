import Link from 'next/link'
import { FotoNota } from '@/components/portada/FotoNota'
import { etiquetaCategoria, fechaCorta } from '@/lib/formato'
import type { NotaResumen } from '@/types'

/**
 * La tarjeta de nota de la portada.
 *
 * No es la misma que la de `<NotasRelacionadas />`, y la diferencia es
 * deliberada: aquella es una ficha con fondo y borde, pensada para cerrar una
 * nota; ésta es la del boceto de portada, sin caja, apoyada directamente sobre
 * el crema, como una columna de diario. Si algún día convergen, converge el
 * boceto primero.
 *
 * `destacada` es la primera de la grilla, que ocupa dos columnas: cambia el
 * aspecto de la foto y el cuerpo del titular, no el marcado.
 */
interface Props {
  nota: NotaResumen
  destacada?: boolean
}

export function TarjetaNota({ nota, destacada = false }: Props) {
  return (
    <article className="group flex h-full flex-col">
      <FotoNota
        src={nota.imagen_portada}
        alt=""
        aspecto={destacada ? 'aspect-[16/8]' : 'aspect-[3/2]'}
        sizes={
          destacada
            ? '(min-width: 1024px) 780px, 100vw'
            : '(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw'
        }
      />

      <p className="mt-[0.9rem] w-fit border-l-4 border-verde-600 pl-[0.6rem] font-display text-[0.7rem] font-extrabold uppercase leading-none tracking-[0.1em] text-verde-600">
        {etiquetaCategoria(nota.categoria)}
      </p>

      <h3
        className={`marca mt-[0.6rem] leading-[1.1] tracking-[-0.01em] ${
          destacada ? 'max-w-[22ch] text-[1.6rem] md:text-[1.9rem]' : 'text-[1.3rem]'
        }`}
      >
        <Link href={`/nota/${nota.slug}`} className="group-hover:text-verde-600">
          {nota.titulo}
        </Link>
      </h3>

      <p className="mt-2 font-body text-[0.95rem] leading-snug text-tinta-suave">
        {nota.bajada}
      </p>

      <p className="mt-[0.7rem] flex flex-wrap items-center gap-x-4 font-display text-[0.8rem] text-gris">
        <span className="text-tinta">{nota.autor.nombre}</span>
        {nota.publicada_en && <span className="dato">{fechaCorta(nota.publicada_en)}</span>}
      </p>
    </article>
  )
}
