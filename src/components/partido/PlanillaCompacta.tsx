import Link from 'next/link'
import { CabeceraPartido } from '@/components/partido/CabeceraPartido'
import { etiquetaFecha, fechaCorta } from '@/lib/formato'
import { ETIQUETA_ESTADO, resumenGoles, tituloAccesible } from '@/lib/partido'
import type { PartidoResumible } from '@/lib/partido'

interface Props {
  /**
   * Con eventos o sin ellos: en la portada llega la planilla completa y en el
   * fixture de la temporada llega el partido pelado. Sin eventos, la tarjeta
   * es el marcador y nada más (ver `PartidoResumible`).
   */
  partido: PartidoResumible
  className?: string
}

/**
 * La planilla reducida a una tarjeta: marcador, fecha y goleadoras. Es la que
 * va en la portada, donde no hay lugar para la línea de tiempo.
 *
 * Toda la tarjeta es un link. El nombre accesible sale del `sr-only`; el resto
 * va con `aria-hidden` para no leer el marcador dos veces.
 */
export function PlanillaCompacta({ partido, className = '' }: Props) {
  const goles = resumenGoles(partido)
  const hayGoles = goles.aldosivi.length > 0 || goles.rival.length > 0

  return (
    <Link
      href={`/partido/${partido.slug}`}
      className={`block rounded-md border border-linea p-3 transition-colors duration-150 hover:border-verde-600 hover:bg-papel-alt ${className}`}
    >
      <span className="sr-only">{tituloAccesible(partido)}</span>

      <span aria-hidden="true" className="block font-display">
        <span className="meta block text-center text-[11px]">
          {etiquetaFecha(partido)} · {fechaCorta(partido.fecha_hora)}
          {partido.estado !== 'finalizado' && ` · ${ETIQUETA_ESTADO[partido.estado]}`}
        </span>

        <span className="mt-2 block">
          <CabeceraPartido partido={partido} tamano="chica" />
        </span>

        {hayGoles && (
          <span className="mt-2 grid grid-cols-2 gap-4 border-t border-linea pt-2 text-[11px] leading-snug text-gris">
            <span className="block text-right">
              {goles.aldosivi.map((texto) => (
                <span key={texto} className="block">
                  {texto}
                </span>
              ))}
            </span>
            <span className="block text-left">
              {goles.rival.map((texto) => (
                <span key={texto} className="block">
                  {texto}
                </span>
              ))}
            </span>
          </span>
        )}
      </span>
    </Link>
  )
}
