import { TarjetaJugadora } from '@/components/plantel/TarjetaJugadora'
import { agruparPorPuesto } from '@/lib/plantel'
import type { JugadoraEnPlantel } from '@/types'

/**
 * El plantel agrupado por puesto, del arco hacia adelante.
 *
 * Cada grupo es una `<section>` con su título como nombre accesible: así el
 * plantel se recorre por puesto con un lector de pantalla en lugar de ser una
 * sola lista de 32 links.
 *
 * El agrupado y el orden son de `agruparPorPuesto()`, que está testeado: acá
 * no hay ninguna decisión sobre los datos, sólo cómo se dibujan.
 */
interface Props {
  plantel: readonly JugadoraEnPlantel[]
}

export function GrillaPlantel({ plantel }: Props) {
  const grupos = agruparPorPuesto(plantel)

  return (
    <div className="flex flex-col gap-12">
      {grupos.map((grupo) => (
        <section key={grupo.clave} aria-labelledby={`puesto-${grupo.clave}`}>
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-7 w-2.5 shrink-0 rounded-sm bg-verde-600" />
            <h2 id={`puesto-${grupo.clave}`} className="titular text-[22px]">
              {grupo.titulo}
            </h2>
            <span className="dato text-[0.8rem] text-gris">{grupo.jugadoras.length}</span>
          </div>

          <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {grupo.jugadoras.map((jugadora) => (
              <li key={jugadora.id}>
                <TarjetaJugadora jugadora={jugadora} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
