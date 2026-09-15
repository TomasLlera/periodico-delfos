import Link from 'next/link'
import { CabeceraBloque } from '@/components/portada/CabeceraBloque'
import { FotoNota } from '@/components/portada/FotoNota'
import { etiquetaCategoria } from '@/lib/formato'
import type { NotaResumen } from '@/types'

/**
 * El listado de análisis: miniatura cuadrada a la izquierda, texto a la
 * derecha, separados por una línea. Es la otra forma de listar notas del
 * boceto, y existe para que el bloque de análisis no compita visualmente con
 * la grilla de crónicas de arriba.
 *
 * A 375px la miniatura se achica en lugar de apilarse: apilada, tres análisis
 * ocupan una pantalla entera y el aside de plantel queda fuera de alcance.
 */
interface Props {
  id: string
  titulo: string
  notas: readonly NotaResumen[]
  enlace?: { href: string; texto: string }
  vacio: string
}

export function ListaAnalisis({ id, titulo, notas, enlace, vacio }: Props) {
  return (
    <section aria-labelledby={id}>
      <CabeceraBloque id={id} titulo={titulo} enlace={enlace} />

      {notas.length === 0 ? (
        <p className="font-body text-gris">{vacio}</p>
      ) : (
        <ul>
          {notas.map((nota) => (
            <li
              key={nota.id}
              className="group grid grid-cols-[88px_1fr] gap-5 border-b border-linea py-[1.1rem] sm:grid-cols-[120px_1fr]"
            >
              <FotoNota src={nota.imagen_portada} alt="" aspecto="aspect-square" sizes="120px" />

              <div>
                <p className="w-fit border-l-4 border-verde-600 pl-[0.6rem] font-display text-[0.7rem] font-extrabold uppercase leading-none tracking-[0.1em] text-verde-600">
                  {etiquetaCategoria(nota.categoria)}
                </p>

                <h3 className="marca mt-[0.35rem] text-[1.15rem] leading-[1.15]">
                  <Link
                    href={`/nota/${nota.slug}`}
                    className="group-hover:text-verde-600"
                  >
                    {nota.titulo}
                  </Link>
                </h3>

                <p className="mt-[0.3rem] font-body text-[0.92rem] leading-snug text-tinta-suave">
                  {nota.bajada}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
