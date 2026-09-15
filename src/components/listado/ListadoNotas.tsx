import { Paginacion } from '@/components/listado/Paginacion'
import { CabeceraBloque } from '@/components/portada/CabeceraBloque'
import { TarjetaNota } from '@/components/portada/TarjetaNota'
import type { NotaResumen } from '@/types'

/**
 * El cuerpo de `/cronicas` y `/analisis`: los dos listados son el mismo
 * componente con distinta categoría, y no dos páginas parecidas que se van
 * separando con el tiempo.
 *
 * Reusa la tarjeta de la portada. **No hay destacada acá**: en la portada la
 * primera nota ocupa dos columnas porque es la más nueva de todas, pero en la
 * página 3 de un archivo esa jerarquía no significa nada.
 *
 * No consulta: recibe la página ya leída. Se lo puede mirar entero, con
 * paginador y todo, en `/demo/listado`.
 */
interface Props {
  id: string
  titulo: string
  /** Bajo el título, qué hay en este listado. */
  descripcion: string
  notas: readonly NotaResumen[]
  base: string
  pagina: number
  totalPaginas: number
  vacio: string
}

export function ListadoNotas({
  id,
  titulo,
  descripcion,
  notas,
  base,
  pagina,
  totalPaginas,
  vacio,
}: Props) {
  return (
    <section aria-labelledby={id}>
      <CabeceraBloque id={id} titulo={titulo} />

      <p className="max-w-medida font-body text-[1.05rem] leading-relaxed text-tinta-suave">
        {descripcion}
      </p>

      {notas.length === 0 ? (
        <p className="mt-8 border-l-4 border-verde-600 bg-papel-alt py-6 pl-5 font-body text-gris">
          {vacio}
        </p>
      ) : (
        <>
          {/* El contador ubica al lector dentro de la serie, que es lo que un
              listado paginado no dice solo. */}
          <p className="meta mt-6">
            Página {pagina} de {totalPaginas}
          </p>

          <ul className="mt-5 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {notas.map((nota) => (
              <li key={nota.id}>
                <TarjetaNota nota={nota} />
              </li>
            ))}
          </ul>

          <Paginacion base={base} pagina={pagina} totalPaginas={totalPaginas} />
        </>
      )}
    </section>
  )
}
