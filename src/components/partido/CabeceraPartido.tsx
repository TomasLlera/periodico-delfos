import { EscudoEquipo } from '@/components/partido/EscudoEquipo'
import { ladosDelPartido } from '@/lib/partido'
import type { Equipo, PartidoConEquipos } from '@/types'

export type TamanoCabecera = 'grande' | 'media' | 'chica'

interface Props {
  partido: PartidoConEquipos
  tamano?: TamanoCabecera
  /** "LOCAL" / "VISITANTE" abajo de cada nombre. Estorba en la home. */
  mostrarCondicion?: boolean
}

const MEDIDAS: Record<
  TamanoCabecera,
  { nombre: string; marcador: string; escudo: number | string; hueco: string }
> = {
  // `clamp` en lugar de un salto en `sm:`: "ALDOSIVI" es una palabra sola que
  // no se puede cortar, así que abajo de 375px un tamaño fijo se sale de la
  // tarjeta. Con clamp la cabecera se achica en vez de desbordar.
  grande: {
    nombre: 'text-[clamp(11px,3.7vw,22px)]',
    marcador: 'text-[clamp(26px,9vw,48px)]',
    escudo: 'clamp(24px,7vw,36px)',
    hueco: 'gap-2 sm:gap-4',
  },
  media: {
    nombre: 'text-[clamp(12px,3.6vw,18px)]',
    marcador: 'text-[clamp(22px,7vw,34px)]',
    escudo: 'clamp(22px,6vw,28px)',
    hueco: 'gap-2 sm:gap-3',
  },
  chica: {
    nombre: 'text-[13px]',
    marcador: 'text-[20px]',
    escudo: 22,
    hueco: 'gap-2',
  },
}

/**
 * Marcador con escudos, con Aldosivi siempre a la izquierda (ver
 * `ladosDelPartido()`).
 *
 * Todo el bloque es visual: va con `aria-hidden` y quien lo usa se encarga del
 * texto accesible con `tituloAccesible()`. El guion del marcador no se lee en
 * voz alta y "0 – 1" suelto no dice de quién es cada número.
 *
 * Sólo elementos de frase (`span`, `img`): esto se renderiza dentro de un
 * heading.
 */
export function CabeceraPartido({
  partido,
  tamano = 'grande',
  mostrarCondicion = false,
}: Props) {
  const medida = MEDIDAS[tamano]
  const lados = ladosDelPartido(partido)
  const hayResultado = lados.golesIzquierda !== null && lados.golesDerecha !== null

  const condicionIzquierda =
    lados.aldosiviEsLocal === null ? null : lados.aldosiviEsLocal ? 'Local' : 'Visitante'
  const condicionDerecha =
    condicionIzquierda === null ? null : condicionIzquierda === 'Local' ? 'Visitante' : 'Local'

  return (
    <span
      aria-hidden="true"
      className={`grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center ${medida.hueco}`}
    >
      <Equipo
        equipo={lados.izquierda}
        medida={medida}
        alineacion="derecha"
        condicion={mostrarCondicion ? condicionIzquierda : null}
      />

      <span
        className={`dato whitespace-nowrap font-bold leading-none tracking-tight text-tinta ${medida.marcador}`}
      >
        {hayResultado ? (
          <>
            {lados.golesIzquierda}
            <span className="px-1 font-normal text-gris sm:px-2">–</span>
            {lados.golesDerecha}
          </>
        ) : (
          <span className="font-display font-semibold uppercase text-gris">
            vs
          </span>
        )}
      </span>

      <Equipo
        equipo={lados.derecha}
        medida={medida}
        alineacion="izquierda"
        condicion={mostrarCondicion ? condicionDerecha : null}
      />
    </span>
  )
}

function Equipo({
  equipo,
  medida,
  alineacion,
  condicion,
}: {
  equipo: Equipo
  medida: (typeof MEDIDAS)[TamanoCabecera]
  alineacion: 'izquierda' | 'derecha'
  condicion: string | null
}) {
  const derecha = alineacion === 'derecha'

  // Aldosivi va en verde y más pesado. El verde 600 se aclara en modo oscuro
  // (token --color-verde-600), así que mantiene AA en los dos temas.
  // `truncate` y no sólo `min-w-0` en el padre: `min-w-0` deja que la caja se
  // encoja, pero el texto se sale igual si la palabra no tiene dónde cortarse.
  // "DEFENSORES" y "COMUNICACIONES" cruzaban el borde de la tarjeta del fixture
  // abajo de 375px —los nombres con espacio, como "Estrella del Sur", nunca lo
  // hicieron porque envuelven— y estiraban el documento entero.
  const nombre = [
    'block truncate font-display uppercase leading-tight tracking-[0.02em]',
    medida.nombre,
    equipo.es_aldosivi
      ? 'font-bold text-verde-600'
      : 'font-semibold text-tinta',
  ].join(' ')

  const escudo = <EscudoEquipo equipo={equipo} tamano={medida.escudo} />

  return (
    <span
      className={`flex min-w-0 items-center gap-2 ${derecha ? 'justify-end text-right' : 'justify-start text-left'}`}
    >
      {!derecha && escudo}
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className={nombre}>{equipo.nombre_corto}</span>
        {condicion && (
          <span className="meta text-[10px] leading-none">{condicion}</span>
        )}
      </span>
      {derecha && escudo}
    </span>
  )
}
