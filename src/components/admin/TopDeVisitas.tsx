import type { FilaTop } from '@/lib/estadisticas'

/**
 * Una lista de "lo más" : páginas, referentes, dispositivos o países.
 *
 * **Barra de proporción en vez de gráfico de torta.** Lo que se compara es
 * "cuánto de lo mismo" entre filas de una lista, y una barra al lado del número
 * se lee de un vistazo sin leyenda ni colores que haya que recordar. Una torta
 * con nueve porciones necesita las dos cosas.
 *
 * La barra va con `aria-hidden`: el dato lo dice el número que está al lado, y
 * un lector de pantalla anunciando "imagen, 42 por ciento" después del número
 * repite lo mismo dos veces.
 */
interface Props {
  titulo: string
  filas: readonly FilaTop[]
  /** Cómo se muestra cada clave. Por omisión, tal cual vino. */
  etiqueta?: (clave: string) => string
  /** Qué decir cuando no hay ninguna fila. */
  vacio: string
}

export function TopDeVisitas({ titulo, filas, etiqueta, vacio }: Props) {
  // El máximo manda el largo de las barras. Si la primera fila tiene 400 y la
  // segunda 20, la segunda tiene que verse corta: proporcional al que más
  // tiene, no al total, que achataría todo cuando hay una fila dominante.
  const maximo = filas.reduce((mayor, fila) => Math.max(mayor, fila.vistas), 0)

  return (
    <section className="flex flex-col gap-3">
      <h2 className="titular text-[1.05rem]">{titulo}</h2>

      {filas.length === 0 ? (
        <p className="text-[0.9rem] text-text-muted">{vacio}</p>
      ) : (
        <ol className="flex flex-col">
          {filas.map((fila) => (
            <li key={fila.clave} className="border-b border-border py-2">
              <div className="flex items-baseline gap-3">
                <span className="min-w-0 flex-1 truncate font-display text-[0.9rem]">
                  {etiqueta ? etiqueta(fila.clave) : fila.clave}
                </span>
                <span className="dato shrink-0 text-[0.9rem] font-bold">{fila.vistas}</span>
              </div>

              <div aria-hidden="true" className="mt-1 h-1 w-full bg-bg-muted">
                <div
                  className="h-full bg-accent"
                  style={{ width: `${maximo > 0 ? (fila.vistas / maximo) * 100 : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
