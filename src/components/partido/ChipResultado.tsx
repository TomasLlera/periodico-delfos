import Link from 'next/link'
import { EscudoEquipo } from '@/components/partido/EscudoEquipo'
import { fechaCorta, resultadoParaAldosivi, rival } from '@/lib/formato'
import type { ResultadoAldosivi } from '@/lib/formato'
import { ETIQUETA_ESTADO, ladosDelPartido, tituloAccesible } from '@/lib/partido'
import type { PartidoConEquipos } from '@/types'

/**
 * Un partido reducido a una ficha de la franja `<FechaAFecha />`: fecha, rival
 * y marcador.
 *
 * Muestra **el rival y no los dos equipos**: en una franja de la temporada de
 * Aldosivi, repetir "Aldosivi" en cada ficha gasta la mitad del ancho en la
 * palabra que no cambia. El marcador sí va con Aldosivi primero, como en toda
 * la planilla (ver `ladosDelPartido`), y que sea de local o de visitante lo
 * dice el texto accesible.
 *
 * El filete de arriba pinta el resultado, pero **no es el único que lo dice**:
 * el marcador con Aldosivi a la izquierda ya lo cuenta. El color refuerza, no
 * informa solo.
 */
interface Props {
  partido: PartidoConEquipos
  /** El próximo partido de la temporada va destacado en amarillo. */
  destacado?: boolean
}

const FILETE: Record<NonNullable<ResultadoAldosivi>, string> = {
  ganado: 'border-t-verde-600',
  empatado: 'border-t-linea-fuerte',
  perdido: 'border-t-roja',
}

export function ChipResultado({ partido, destacado = false }: Props) {
  const otro = rival(partido)
  const lados = ladosDelPartido(partido)
  const resultado = resultadoParaAldosivi(partido)
  const hayMarcador = lados.golesIzquierda !== null && lados.golesDerecha !== null

  const filete = destacado
    ? 'border-t-amarillo bg-papel-alt'
    : resultado
      ? FILETE[resultado]
      : 'border-t-linea'

  return (
    // `relative` no es decorativo: el `sr-only` de abajo es `position:absolute`
    // y sin un ancestro posicionado se ubica contra el documento. Adentro de la
    // franja —que scrollea horizontal— eso estira el ancho de la página entera:
    // 375px de viewport contra 939px de documento, medido.
    <Link
      href={`/partido/${partido.slug}`}
      className={`tarjeta relative flex h-full w-[8.75rem] flex-col gap-1.5 border-t-[3px] p-2.5 transition-colors hover:bg-tarjeta-hover ${filete}`}
    >
      <span className="sr-only">{tituloAccesible(partido)}</span>

      {/* La ficha destacada no pierde su número de fecha: sin él, entre la 11 y
          la 13 queda un hueco sin nombre. "Próximo" va al lado, no en su lugar. */}
      <span aria-hidden="true" className="flex items-baseline justify-between gap-1">
        <span className="meta text-[0.6rem]">
          {partido.fecha_numero
            ? `Fecha ${partido.fecha_numero}`
            : fechaCorta(partido.fecha_hora)}
        </span>
        {destacado && <span className="meta text-[0.6rem] text-verde-600">Próximo</span>}
      </span>

      <span aria-hidden="true" className="flex min-w-0 items-center gap-1.5">
        <EscudoEquipo equipo={otro} tamano={20} />
        <span className="truncate font-display text-[0.8rem] font-semibold leading-tight">
          {otro.nombre_corto}
        </span>
      </span>

      <span aria-hidden="true" className="mt-auto flex items-baseline gap-2">
        {hayMarcador ? (
          <span className="dato text-[1.15rem] font-bold leading-none">
            {lados.golesIzquierda}
            <span className="px-1 font-normal text-gris">–</span>
            {lados.golesDerecha}
          </span>
        ) : (
          <span className="dato text-[0.8rem] leading-none text-gris">
            {fechaCorta(partido.fecha_hora)}
          </span>
        )}

        {partido.estado !== 'finalizado' && partido.estado !== 'programado' && (
          <span className="meta text-[0.55rem] text-roja">
            {ETIQUETA_ESTADO[partido.estado]}
          </span>
        )}
      </span>
    </Link>
  )
}
