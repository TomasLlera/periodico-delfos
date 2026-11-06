import Link from 'next/link'
import { Search } from 'lucide-react'
import { ESTADOS, hayFiltro, type Filtro } from '@/lib/filtro-notas'
import { etiquetaCategoria } from '@/lib/formato'
import { CATEGORIAS } from '@/lib/nota'
import { NOMBRE_ESTADO } from './FilaNota'

/**
 * El filtro del listado de notas.
 *
 * **Es un Server Component y no lleva JavaScript**, al revés que todo el resto
 * del panel. Es un `<form method="get">` que apunta a `/admin`, igual que el
 * buscador público: el filtro queda en la URL, así que sobrevive a entrar a una
 * nota y volver —que es exactamente lo que se hace cuando se busca una nota
 * para editarla o borrarla— y además al recargar y al botón de atrás.
 *
 * Por eso tampoco usa `CampoTexto` ni `CampoSelect`: esos dos son controlados
 * —`value` + `onCambio`— y pedirían estado y, con él, un componente cliente.
 * Acá los campos son nativos con `defaultValue`, que es lo que el navegador ya
 * sabe hacer solo.
 *
 * **No hay filtro por autor**, todavía: hoy un redactor ve sólo lo suyo y un
 * editor ve todo de una sola persona. Entra el día que haya dos firmas de
 * verdad, y el campo es uno más al lado de los otros.
 */

interface Props {
  filtro: Filtro
  /** Los años que hay para elegir. Salen de las notas, no de un rango fijo. */
  anios: readonly number[]
  /** Cuántas notas quedaron. Se muestra sólo si hay algo filtrando. */
  cuantas: number
}

export function FiltroNotas({ filtro, anios, cuantas }: Props) {
  const filtrando = hayFiltro(filtro)

  return (
    <form
      action="/admin"
      method="get"
      role="search"
      aria-label="Filtrar las notas"
      className="mb-6 border-y border-border py-3"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-[180px] flex-1 flex-col gap-1">
          <label htmlFor="texto" className="meta text-text-muted">
            Título
          </label>
          <div className="tactil flex items-center gap-2 border border-border-control bg-bg-elevated px-3">
            <Search size={16} aria-hidden="true" className="shrink-0 text-text-muted" />
            <input
              id="texto"
              name="texto"
              type="search"
              defaultValue={filtro.texto}
              placeholder="Claypole, Morón, la previa…"
              className="w-full bg-transparent py-2 font-display text-[0.95rem] outline-none placeholder:text-text-muted"
            />
          </div>
        </div>

        <Select id="estado" etiqueta="Estado" valor={filtro.estado ?? ''} vacio="Todos">
          {ESTADOS.map((estado) => (
            <option key={estado} value={estado}>
              {NOMBRE_ESTADO[estado]}
            </option>
          ))}
        </Select>

        <Select id="categoria" etiqueta="Categoría" valor={filtro.categoria ?? ''} vacio="Todas">
          {CATEGORIAS.map((categoria) => (
            <option key={categoria} value={categoria}>
              {etiquetaCategoria(categoria)}
            </option>
          ))}
        </Select>

        {/* Sin notas no hay años, y un `<select>` con una sola opción vacía es
            un control que no hace nada. */}
        {anios.length > 0 && (
          <Select id="anio" etiqueta="Año" valor={filtro.anio?.toString() ?? ''} vacio="Todos">
            {anios.map((anio) => (
              <option key={anio} value={anio}>
                {anio}
              </option>
            ))}
          </Select>
        )}

        <button
          type="submit"
          className="tactil flex items-center bg-text px-5 font-display text-[0.9rem] font-extrabold text-bg hover:bg-text/85"
        >
          Filtrar
        </button>
      </div>

      {/* El conteo y el "limpiar" aparecen recién cuando hay algo filtrando: sin
          filtro, "70 notas" es un número que nadie pidió, y un botón de limpiar
          que no limpia nada es ruido. Va con `role="status"` para que un lector
          de pantalla cante cuántas quedaron sin tener que recorrer la lista. */}
      {filtrando && (
        <p className="mt-3 flex flex-wrap items-center gap-3 text-[0.85rem] text-text-muted">
          <span role="status">
            {cuantas === 0
              ? 'Ninguna nota coincide con esto.'
              : `${cuantas} ${cuantas === 1 ? 'nota' : 'notas'}.`}
          </span>

          <Link href="/admin" className="tactil flex items-center underline underline-offset-4">
            Limpiar el filtro
          </Link>
        </p>
      )}
    </form>
  )
}

/**
 * Un `<select>` del filtro, con su etiqueta y su opción vacía.
 *
 * Está acá y no en `src/components/admin/` porque es el `<select>` sin estado
 * de este formulario y de ninguno más: el resto del panel usa `CampoSelect`,
 * que es controlado. Si algún día aparece un segundo filtro sin JS, se muda.
 */
function Select({
  id,
  etiqueta,
  valor,
  vacio,
  children,
}: {
  id: string
  etiqueta: string
  valor: string
  /** El texto de la opción que no filtra: "Todos". */
  vacio: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="meta text-text-muted">
        {etiqueta}
      </label>
      <select
        id={id}
        name={id}
        defaultValue={valor}
        className="tactil border border-border-control bg-bg-elevated px-3 font-display text-[0.95rem]"
      >
        <option value="">{vacio}</option>
        {children}
      </select>
    </div>
  )
}
