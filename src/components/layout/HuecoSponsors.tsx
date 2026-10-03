import { EspacioSponsor } from '@/components/layout/EspacioSponsor'
import { sponsorsDeHueco } from '@/lib/sponsors'
import type { Sponsor, UbicacionSponsor } from '@/types'

/**
 * Un hueco de publicidad: cero, uno o varios sponsors en el mismo lugar.
 *
 * **Si no hay nada vendido, no dibuja nada** —ni el rótulo, ni un recuadro, ni
 * un "espacio disponible"—. Un medio chico con huecos vacíos marcados parece
 * más vacío de lo que está, y el lector no tiene por qué enterarse de lo que no
 * se vendió.
 *
 * **Recibe la lista entera y filtra acá.** La página hace una sola consulta por
 * todos los sponsors y se la pasa a los dos o tres huecos que tenga; con una
 * consulta por hueco serían tres viajes a la base por página para mostrar, casi
 * siempre, nada.
 *
 * Quién decide qué se ve es `sponsorsDeHueco()`, que tiene sus tests. Acá sólo
 * se dibuja.
 */
interface Props {
  sponsors: readonly Sponsor[]
  ubicacion: UbicacionSponsor
  /** El de arriba de la portada entra en la primera pantalla. */
  prioridad?: boolean
  className?: string
}

export function HuecoSponsors({ sponsors, ubicacion, prioridad, className = '' }: Props) {
  const elegidos = sponsorsDeHueco(sponsors, ubicacion)
  if (elegidos.length === 0) return null

  // Varios en el mismo hueco van en fila y se apilan en celular. Es lo que pasa
  // cuando se venden dos chicos en lugar de uno grande, y no hay por qué
  // obligar a elegir.
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-start ${className}`.trimEnd()}>
      {elegidos.map((sponsor) => (
        <EspacioSponsor
          key={sponsor.id}
          sponsor={sponsor}
          prioridad={prioridad}
          className="min-w-0 flex-1"
        />
      ))}
    </div>
  )
}
