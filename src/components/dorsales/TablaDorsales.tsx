import Link from 'next/link'
import { nombreCompleto } from '@/lib/plantel'
import { resumenDeFila, type DorsalesDeJugadora } from '@/lib/dorsales'

/**
 * Qué número usó cada jugadora en los partidos de un campeonato.
 *
 * **Es una `<table>` de verdad**, por lo mismo que la de posiciones: tres
 * columnas de números por fila leídas en voz alta sin encabezados no se
 * entienden, y acá el encabezado de la fila —la jugadora— es la mitad del
 * dato.
 *
 * La celda de los números es una lista y no una frase, porque son varios y de
 * distinto peso: el primero es con el que se la reconoce y los demás son los
 * partidos sueltos. El lector de pantalla recibe la frase entera igual, en el
 * `sr-only` de la celda, que es la forma en que esto se dice hablando.
 *
 * En 375px el que scrollea es el contenedor, no la página; y va `relative`
 * porque adentro hay `.sr-only`, que sin ancestro posicionado se mide contra
 * el documento y estira la página entera (regla 5 del CLAUDE.md).
 */
interface Props {
  filas: readonly DorsalesDeJugadora[]
  temporada: string
  /** Cuántos partidos del campeonato tienen formación cargada. */
  partidosCargados: number
}

export function TablaDorsales({ filas, temporada, partidosCargados }: Props) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[460px] border-collapse text-left">
        <caption className="mb-4 max-w-medida text-left font-display text-[0.85rem] leading-snug text-text-muted">
          {/* El denominador es lo que vuelve legible todo lo demás: "el 10 en
              5 partidos" no dice lo mismo sobre 6 fechas que sobre 30. */}
          {temporada} · {partidosCargados}{' '}
          {partidosCargados === 1 ? 'partido con formación cargada' : 'partidos con formación cargada'}.
        </caption>

        <thead>
          <tr className="border-b-2 border-border-strong">
            <th scope="col" className="meta py-2 pr-3 text-[0.7rem]">
              Jugadora
            </th>
            <th scope="col" className="meta py-2 pr-3 text-[0.7rem]">
              Dorsales que usó
            </th>
            <th scope="col" className="meta py-2 text-right text-[0.7rem]">
              <span className="sr-only">Partidos jugados</span>
              <span aria-hidden="true">PJ</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {filas.map((fila) => (
            <tr key={fila.jugadora_id} className="border-b border-border">
              <th scope="row" className="py-3 pr-3 font-display text-[0.95rem] font-bold">
                <Link
                  href={`/jugadora/${fila.slug}`}
                  className="underline-offset-[3px] hover:text-accent-text hover:underline"
                >
                  {nombreCompleto(fila)}
                </Link>
              </th>

              <td className="py-3 pr-3">
                <span className="sr-only">{resumenDeFila(fila)}</span>

                {fila.usos.length === 0 ? (
                  // Nunca convocada y convocada sin número anotado no son lo
                  // mismo: la primera es el dato, la segunda es un dato que falta.
                  <span aria-hidden="true" className="font-mono text-[0.9rem] text-text-muted">
                    {fila.partidos === 0 ? 'Sin convocatorias' : 'Sin dorsal registrado'}
                  </span>
                ) : (
                  <ul aria-hidden="true" className="flex flex-wrap gap-2">
                    {fila.usos.map((uso) => (
                      <li
                        key={uso.dorsal}
                        className="flex items-baseline gap-1 border border-border-control px-2 py-1"
                      >
                        <span className="font-mono text-[1.05rem] font-bold leading-none">
                          {uso.dorsal}
                        </span>
                        <span className="font-mono text-[0.75rem] text-text-muted">
                          ×{uso.veces}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Un partido en el que estuvo convocada y no quedó anotado el
                    número. No se disimula: las planillas anteriores a la `0020`
                    se cargaron sin dorsales. */}
                {fila.sinDorsal > 0 && fila.usos.length > 0 && (
                  <p className="mt-1 text-[0.8rem] text-text-muted">
                    {fila.sinDorsal}{' '}
                    {fila.sinDorsal === 1 ? 'partido sin número anotado' : 'partidos sin número anotado'}
                  </p>
                )}
              </td>

              <td className="py-3 text-right font-mono text-[0.95rem]">{fila.partidos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
