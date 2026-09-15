import Link from 'next/link'
import { totalesJugadora } from '@/lib/jugadora'
import type { EstadisticasJugadora } from '@/types'

/**
 * Las estadísticas abiertas por temporada, con el total abajo.
 *
 * Salen de la vista `estadisticas_jugadora`: **nunca se escriben a mano**, se
 * calculan desde las formaciones y los eventos de cada partido (regla no
 * negociable 2). Si un número está mal, el arreglo es la planilla del partido,
 * no esta tabla.
 *
 * El total va en `<tfoot>` y no como una fila más: es una suma, no otra
 * temporada, y así lo anuncia un lector de pantalla.
 */
export interface FilaEstadistica {
  estadisticas: EstadisticasJugadora
  temporadaNombre: string
  temporadaSlug: string | null
}

interface Props {
  filas: readonly FilaEstadistica[]
}

const COLUMNAS = [
  { clave: 'partidos', corto: 'PJ', largo: 'Partidos jugados' },
  { clave: 'titular', corto: 'TIT', largo: 'De titular' },
  { clave: 'goles', corto: 'G', largo: 'Goles' },
  { clave: 'amarillas', corto: 'AM', largo: 'Amarillas' },
  { clave: 'rojas', corto: 'RJ', largo: 'Rojas' },
] as const

export function TablaEstadisticas({ filas }: Props) {
  if (filas.length === 0) {
    return (
      <p className="max-w-medida border-l-4 border-verde-600 bg-papel-alt py-5 pl-5 font-body text-gris">
        Todavía no jugó ningún partido cargado. Las estadísticas se arman solas
        con cada planilla que se carga.
      </p>
    )
  }

  const total = totalesJugadora(filas.map((fila) => fila.estadisticas))

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-tinta">
            <th scope="col" className="meta py-2 pr-3 text-[0.7rem]">
              Temporada
            </th>
            {COLUMNAS.map((columna) => (
              <th key={columna.clave} scope="col" className="meta py-2 pl-2 text-right text-[0.7rem]">
                <abbr title={columna.largo} className="no-underline">
                  {columna.corto}
                </abbr>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {filas.map((fila) => (
            <tr key={fila.estadisticas.temporada_id} className="border-b border-linea">
              <th scope="row" className="py-2 pr-3 text-left font-display text-[0.9rem] font-normal">
                {fila.temporadaSlug ? (
                  <Link
                    href={`/temporada/${fila.temporadaSlug}`}
                    className="text-verde-600 underline underline-offset-2"
                  >
                    {fila.temporadaNombre}
                  </Link>
                ) : (
                  fila.temporadaNombre
                )}
              </th>

              {COLUMNAS.map((columna) => (
                <td
                  key={columna.clave}
                  className="dato py-2 pl-2 text-right text-[0.85rem] text-tinta-suave"
                >
                  {fila.estadisticas[columna.clave]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>

        {filas.length > 1 && (
          <tfoot>
            <tr className="border-t-2 border-tinta">
              <th scope="row" className="meta py-2 pr-3 text-[0.7rem] text-tinta">
                Total
              </th>
              {COLUMNAS.map((columna) => (
                <td
                  key={columna.clave}
                  className="dato py-2 pl-2 text-right text-[0.9rem] font-bold text-tinta"
                >
                  {total[columna.clave]}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
