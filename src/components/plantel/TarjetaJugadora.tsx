import Link from 'next/link'
import { FotoJugadora } from '@/components/jugadora/FotoJugadora'
import { NOMBRE_PUESTO, puestoEnTemporada } from '@/lib/plantel'
import type { JugadoraEnPlantel } from '@/types'

/**
 * Una jugadora en la grilla del plantel.
 *
 * **Toda la tarjeta es un link a su ficha.** Es lo que convierte el plantel en
 * una puerta a ~32 páginas indexables que hoy no existen (blueprint 7.5), en
 * lugar de una galería de fotos sin salida.
 *
 * El dorsal va arriba de la foto y no al lado del nombre: es el dato con el
 * que se busca a alguien en una lista de plantel, y en la esquina se lee sin
 * tener que leer el nombre.
 */
interface Props {
  jugadora: JugadoraEnPlantel
}

export function TarjetaJugadora({ jugadora }: Props) {
  const puesto = puestoEnTemporada(jugadora)

  return (
    <Link
      href={`/jugadora/${jugadora.slug}`}
      className="tarjeta group flex h-full flex-col overflow-hidden transition-colors hover:bg-tarjeta-hover"
    >
      <div className="relative">
        <FotoJugadora jugadora={jugadora} />

        {jugadora.dorsal !== null && (
          <span
            aria-hidden="true"
            className="dato absolute left-0 top-0 bg-verde-900 px-2 py-1 text-[0.95rem] font-bold leading-none text-white"
          >
            {jugadora.dorsal}
          </span>
        )}

        {jugadora.capitana && (
          <span className="absolute right-0 top-0 bg-amarillo px-2 py-1 font-display text-[0.7rem] font-extrabold uppercase leading-none tracking-[0.08em] text-negro-cancha">
            Capitana
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        {/* El dorsal se repite acá para el lector de pantalla: arriba va con
            `aria-hidden` porque suelto, sobre la foto, es un número sin
            contexto. */}
        <p className="sr-only">
          {jugadora.dorsal !== null ? `Dorsal ${jugadora.dorsal}. ` : ''}
          {jugadora.capitana ? 'Capitana. ' : ''}
          {NOMBRE_PUESTO[puesto]}
        </p>

        <p className="font-display text-[0.85rem] leading-tight text-gris">
          {jugadora.nombre}
        </p>
        <h3 className="titular text-[1.05rem] leading-[1.1] group-hover:text-verde-600">
          {jugadora.apellido}
        </h3>
      </div>
    </Link>
  )
}
