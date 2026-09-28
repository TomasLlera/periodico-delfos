import Link from 'next/link'
import { FotoNota } from '@/components/portada/FotoNota'
import { etiquetaCategoria, hace, tiempoLectura } from '@/lib/formato'
import type { NotaResumen } from '@/types'

/**
 * La nota de tapa: un bloque verde a dos columnas, foto a la izquierda y texto
 * a la derecha, alineado abajo.
 *
 * Es el único lugar de la portada donde el titular va sobre fondo verde, así
 * que el texto es blanco fijo y no `text-tinta`: la superficie es oscura en los
 * dos temas. Medido, blanco sobre `verde-900`: 12.51:1 en claro, 15.32:1 en
 * oscuro.
 *
 * **La bajada respeta la medida de lectura** (`max-w-medida`, 68ch) aunque no
 * sea el cuerpo de una nota: es el párrafo más largo de la portada y la regla
 * no negociable 3 no tiene excepciones útiles.
 *
 * `palabras` es opcional porque `NotaResumen` no trae el cuerpo y el tiempo de
 * lectura se cuenta sobre el cuerpo. Cuando la portada lo tenga, entra; hasta
 * entonces la firma muestra sólo la fecha, que es lo que hay.
 */
interface Props {
  nota: NotaResumen
  palabras?: number
}

export function NotaTapa({ nota, palabras }: Props) {
  return (
    <article className="mt-8 grid bg-verde-900 text-white md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <FotoNota
        src={nota.imagen_portada}
        alt={nota.imagen_portada ? nota.imagen_alt : ''}
        aspecto="aspect-[16/10] md:aspect-[4/3] md:h-full"
        sizes="(min-width: 768px) 700px, 100vw"
        prioridad
        variante="oscuro"
      />

      <div className="flex flex-col justify-end p-6 md:p-10">
        <p className="w-fit border-l-4 border-amarillo pl-[0.6rem] font-display text-[0.78rem] font-extrabold uppercase leading-none tracking-[0.1em] text-amarillo">
          {etiquetaCategoria(nota.categoria)}
        </p>

        <h1 className="marca mt-[1.1rem] text-[clamp(2rem,3.6vw,3.4rem)] uppercase leading-[0.98] tracking-[-0.02em]">
          <Link href={`/nota/${nota.slug}`} className="hover:text-amarillo">
            {nota.titulo}
          </Link>
        </h1>

        <p className="mt-4 max-w-medida font-body text-[1.05rem] leading-relaxed text-white/80">
          {nota.bajada}
        </p>

        <p className="mt-[1.4rem] flex flex-wrap items-center gap-x-4 gap-y-1 font-display text-[0.8rem] text-white/60">
          <span className="font-semibold text-white">{nota.autor.nombre}</span>
          {nota.publicada_en && <span className="dato">{hace(nota.publicada_en)}</span>}
          {palabras !== undefined && (
            <span className="dato">{tiempoLectura(palabras)}</span>
          )}
        </p>
      </div>
    </article>
  )
}
