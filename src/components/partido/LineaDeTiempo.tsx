import { EventoPlanilla } from '@/components/partido/EventoPlanilla'
import { agruparPorMinuto } from '@/lib/partido'
import type { PartidoCompleto } from '@/types'

interface Props {
  partido: PartidoCompleto
}

/**
 * La línea de tiempo vertical: los minutos bajan por una columna central y los
 * eventos caen a izquierda (Aldosivi) o derecha (rival).
 *
 * Cada minuto es un `<li>` con la frase completa de lo que pasó, y la grilla
 * va con `aria-hidden`. Es deliberado: una tabla de tres columnas leída celda
 * por celda —"Cortadi", "23 apóstrofo", vacío— no comunica nada. Lo que se
 * escucha es "Minuto 23. Gol de Aldosivi: Lucía Cortadi.".
 *
 * El `sr-only` de Tailwind es `position: absolute`, así que no ocupa una
 * columna de la grilla.
 */
export function LineaDeTiempo({ partido }: Props) {
  const grupos = agruparPorMinuto(partido)

  if (grupos.length === 0) {
    return (
      <p className="py-6 text-center font-display text-sm text-gris">
        {partido.estado === 'programado'
          ? 'El partido todavía no se jugó.'
          : 'Sin goles ni tarjetas cargadas en este partido.'}
      </p>
    )
  }

  return (
    // Sin tope de ancho, en un monitor las dos columnas quedan a media cuadra
    // de la línea de minutos y la planilla deja de leerse como una planilla.
    <ol className="mx-auto max-w-[34rem] font-display">
      {grupos.map((grupo, indice) => (
        <li
          key={grupo.clave}
          // `minmax(0,1fr)` y no `1fr`: con `1fr` el mínimo es el ancho del
          // contenido, así que un evento largo —"Cortadi (errado)" con
          // detalle— ensancha su columna y corre la línea de minutos de esa
          // fila sola. Las casillas tienen que estar todas a la misma altura.
          className="relative grid grid-cols-[minmax(0,1fr)_3.25rem_minmax(0,1fr)] items-stretch sm:grid-cols-[minmax(0,1fr)_3.75rem_minmax(0,1fr)]"
        >
          <span className="sr-only">{grupo.descripcion}</span>

          <span
            aria-hidden="true"
            className="flex flex-col items-end justify-center gap-2 py-2.5 pr-2 sm:pr-3"
          >
            {grupo.aldosivi.map((evento) => (
              <EventoPlanilla key={evento.id} evento={evento} alineacion="derecha" />
            ))}
          </span>

          <span
            aria-hidden="true"
            className={`flex items-center justify-center border-x border-t border-linea bg-papel-alt ${
              indice === grupos.length - 1 ? 'border-b' : ''
            }`}
          >
            <span className="dato py-1 text-[12px] font-medium text-gris sm:text-[13px]">
              {grupo.etiqueta}
            </span>
          </span>

          <span
            aria-hidden="true"
            className="flex flex-col items-start justify-center gap-2 py-2.5 pl-2 sm:pl-3"
          >
            {grupo.rival.map((evento) => (
              <EventoPlanilla key={evento.id} evento={evento} alineacion="izquierda" />
            ))}
          </span>
        </li>
      ))}
    </ol>
  )
}
