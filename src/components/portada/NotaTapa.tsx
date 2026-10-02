import Link from 'next/link'
import { FotoNota } from '@/components/portada/FotoNota'
import { etiquetaCategoria, hace, tiempoLectura } from '@/lib/formato'
import type { NotaResumen } from '@/types'

/**
 * La nota de tapa: un bloque oscuro a dos columnas, foto a la izquierda y
 * texto a la derecha, alineado abajo.
 *
 * **El alto lo decide la columna de texto y no la foto.** La foto va con
 * `h-full`, y una altura en porcentaje no cuenta para medir la fila: se estira
 * hasta donde llegue el texto. Por eso, cuando la tapa quedó demasiado alta, lo
 * que se tocó fue el cuerpo del titular —ver el comentario del `h2`— y no la
 * relación de aspecto de la imagen, que en escritorio no hace nada.
 *
 * La columna de texto pasó de 5/12 a 5/11 del ancho por lo mismo: cada píxel
 * que gana el texto es un renglón menos de titular, y el recorte que la foto
 * pierde a lo ancho lo nota mucho menos que el lector a lo alto.
 *
 * Es el único lugar de la portada donde el titular va sobre fondo oscuro, así
 * que el texto es `block-text` y no `text-text`: la superficie es oscura en
 * los dos temas. Medido, `block-text` sobre `block-bg`: 15.27:1 en claro,
 * 15.58:1 en oscuro.
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
    <article className="mt-8 grid border border-block-border bg-block-bg text-block-text md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
      <FotoNota
        src={nota.imagen_portada}
        alt={nota.imagen_portada ? nota.imagen_alt : ''}
        aspecto="aspect-[16/10] md:aspect-[4/3] md:h-full"
        sizes="(min-width: 768px) 700px, 100vw"
        prioridad
        variante="oscuro"
      />

      <div className="flex flex-col justify-end p-6 md:p-10">
        <p className="w-fit border-l-4 border-accent pl-[0.6rem] font-display text-[0.78rem] font-extrabold uppercase leading-none tracking-[0.1em] text-block-accent">
          {etiquetaCategoria(nota.categoria)}
        </p>

        {/* `h2` y no `h1`: la tapa es la nota más grande de la portada, pero
            el título de la página lo pone la portada —un `h1` propio, oculto—
            porque la página no se llama como la nota del día. Con las dos cosas
            en `h1` la portada quedaba con dos, que es justo lo que el barrido
            del Step 20 vigila; no se veía porque hacía falta una nota publicada
            para que la tapa existiera. */}
        {/* El tamaño del titular es lo que decide el alto del bloque entero: la
            foto lleva `h-full` y se estira hasta donde llegue esta columna, no
            al revés. A 3.6vw un titular de doce palabras —los hay: "Las
            Tiburonas perdieron en la ida de los octavos de final de la Primera
            B"— caía en seis renglones y la tapa se comía la pantalla entera
            antes de la segunda nota. A 2.8vw entra en cuatro y sigue siendo,
            por lejos, lo más grande de la portada. */}
        <h2 className="marca mt-[1.1rem] text-[clamp(1.9rem,2.8vw,2.7rem)] leading-[1.05] tracking-[-0.02em]">
          <Link href={`/nota/${nota.slug}`} className="hover:text-block-accent">
            {nota.titulo}
          </Link>
        </h2>

        <p className="mt-4 max-w-medida font-body text-[1.05rem] leading-relaxed text-block-text/80">
          {nota.bajada}
        </p>

        <p className="mt-[1.4rem] flex flex-wrap items-center gap-x-4 gap-y-1 font-display text-[0.8rem] text-block-text/60">
          <span className="font-semibold text-block-text">{nota.autor.nombre}</span>
          {nota.publicada_en && <span className="dato">{hace(nota.publicada_en)}</span>}
          {palabras !== undefined && (
            <span className="dato">{tiempoLectura(palabras)}</span>
          )}
        </p>
      </div>
    </article>
  )
}
