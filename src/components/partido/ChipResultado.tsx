import Link from 'next/link'
import { EscudoEquipo } from '@/components/partido/EscudoEquipo'
import { fechaCorta, fechaHoraPartido, rival } from '@/lib/formato'
import type { ResultadoAldosivi } from '@/lib/formato'
import { ETIQUETA_ESTADO, ladosDelPartido, tituloAccesible } from '@/lib/partido'
import { ETIQUETA_RESULTADO } from '@/lib/portada'
import type { ChipTemporada } from '@/lib/portada'

/**
 * Un partido de la temporada reducido a una ficha de cinta: la fecha, el rival
 * y el marcador. Es la pieza de `<FechaAFecha />`.
 *
 * **Sólo se nombra al rival.** El otro equipo es siempre Aldosivi —es un medio
 * de un solo club— y repetirlo ocho veces en una cinta gasta el ancho que
 * necesita el nombre que sí cambia. La condición de local o visitante no se
 * pierde: va abajo del marcador, y el marcador se lee siempre desde Aldosivi
 * (`ladosDelPartido()`), juegue donde juegue.
 *
 * **El resultado nunca está sólo en el color.** El filete de la izquierda es
 * un refuerzo; lo que manda es la palabra —"Ganó", "Perdió"— y el marcador.
 * Los colores del filete son decorativos justamente por eso: `verde-600` y
 * `roja` invierten su luminancia entre los dos temas, y no hay ningún par
 * texto/fondo con esos tokens que aguante AA en los dos.
 */
interface Props {
  chip: ChipTemporada
}

const FILETE: Record<Exclude<ResultadoAldosivi, null>, string> = {
  ganado: 'border-l-verde-600',
  empatado: 'border-l-linea-fuerte',
  perdido: 'border-l-roja',
}

export function ChipResultado({ chip }: Props) {
  const { partido, resultado, esProximo } = chip
  const lados = ladosDelPartido(partido)
  const contra = rival(partido)
  const hayResultado = lados.golesIzquierda !== null && lados.golesDerecha !== null

  const filete = esProximo
    ? 'border-l-amarillo'
    : resultado
      ? FILETE[resultado]
      : 'border-l-linea-fuerte'

  const condicion =
    lados.aldosiviEsLocal === null ? null : lados.aldosiviEsLocal ? 'Local' : 'Visitante'

  return (
    <Link
      href={`/partido/${partido.slug}`}
      className={`block w-[10.5rem] shrink-0 snap-start rounded-md border border-l-4 border-linea bg-tarjeta px-3 py-2 transition-colors duration-150 hover:border-verde-600 hover:bg-tarjeta-hover ${filete}`}
    >
      <span className="sr-only">
        {esProximo ? 'Próximo partido. ' : ''}
        {resultado ? `${ETIQUETA_RESULTADO[resultado]}. ` : ''}
        {tituloAccesible(partido)}
      </span>

      <span aria-hidden="true" className="block">
        <span className="flex items-baseline justify-between gap-1.5">
          <span className="meta shrink-0 text-[11px]">
            {partido.fecha_numero
              ? `Fecha ${partido.fecha_numero}`
              : fechaCorta(partido.fecha_hora)}
          </span>

          {esProximo ? (
            <span className="meta shrink-0 bg-amarillo px-1 text-[9px] leading-[1.5] text-negro-cancha">
              Próximo
            </span>
          ) : (
            resultado && (
              <span className="meta shrink-0 text-[11px]">{ETIQUETA_RESULTADO[resultado]}</span>
            )
          )}
        </span>

        <span className="mt-2 flex items-center gap-2">
          <EscudoEquipo equipo={contra} tamano={20} />
          <span className="min-w-0 flex-1 truncate font-display text-[0.85rem] font-semibold leading-tight">
            {contra.nombre_corto}
          </span>
        </span>

        {hayResultado ? (
          <span className="mt-1 flex items-baseline justify-between gap-1.5">
            <span className="dato text-[1.35rem] font-medium leading-tight tracking-tight">
              {lados.golesIzquierda}
              <span className="px-1 font-normal text-gris">–</span>
              {lados.golesDerecha}
            </span>
            {condicion && <span className="meta shrink-0 text-[10px]">{condicion}</span>}
          </span>
        ) : (
          <span className="dato mt-1 block truncate text-[0.72rem] leading-tight text-gris">
            {fechaHoraPartido(partido.fecha_hora)}
          </span>
        )}

        {partido.estado !== 'finalizado' && partido.estado !== 'programado' && (
          <span className="meta mt-1 block text-[10px]">{ETIQUETA_ESTADO[partido.estado]}</span>
        )}
      </span>
    </Link>
  )
}
