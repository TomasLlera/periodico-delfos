import Link from 'next/link'
import { CabeceraPartido } from '@/components/partido/CabeceraPartido'
import { DatosPartido } from '@/components/partido/DatosPartido'
import { FormacionesPartido } from '@/components/partido/FormacionesPartido'
import { LineaDeTiempo } from '@/components/partido/LineaDeTiempo'
import { PlanillaCompacta } from '@/components/partido/PlanillaCompacta'
import { etiquetaFecha, fechaCorta, resultadoParaAldosivi } from '@/lib/formato'
import { ETIQUETA_ESTADO, tituloAccesible } from '@/lib/partido'
import type { PartidoCompleto } from '@/types'

export type VariantePlanilla = 'completa' | 'embebida' | 'compacta'

interface Props {
  partido: PartidoCompleto
  /**
   * `completa` para /partido/[slug], `embebida` dentro del cuerpo de una
   * crónica, `compacta` para la portada.
   */
  variante?: VariantePlanilla
  /** Nivel del encabezado, para no romper la jerarquía de la página. */
  nivelTitulo?: 2 | 3 | 4
  className?: string
}

/**
 * La planilla oficial del partido: el elemento distintivo del sitio.
 *
 * Componente puro — recibe el `PartidoCompleto` armado y no consulta nada. La
 * clase `planilla` la usa `globals.css` para neutralizar los estilos de
 * `.prose-nota` cuando esto se embebe en el cuerpo de una nota.
 */
export function PlanillaPartido({
  partido,
  variante = 'completa',
  nivelTitulo = 2,
  className = '',
}: Props) {
  if (variante === 'compacta') {
    return <PlanillaCompacta partido={partido} className={className} />
  }

  const Titulo = `h${nivelTitulo}` as 'h2' | 'h3' | 'h4'
  const idTitulo = `planilla-${variante}-${partido.id}`

  const titulo = (
    <Titulo id={idTitulo} className="mt-2 block">
      <span className="sr-only">{tituloAccesible(partido)}</span>
      <CabeceraPartido
        partido={partido}
        tamano={variante === 'completa' ? 'grande' : 'media'}
        mostrarCondicion
      />
    </Titulo>
  )

  if (variante === 'embebida') {
    return (
      <section
        aria-labelledby={idTitulo}
        className={`planilla border-y-2 border-verde-600 py-4 font-display text-[15px] ${className}`}
      >
        <p className="meta text-center">
          {etiquetaFecha(partido)} · {fechaCorta(partido.fecha_hora)}
        </p>

        {titulo}

        <div className="mt-3">
          <LineaDeTiempo partido={partido} />
        </div>

        <div className="mt-4 border-t border-linea pt-3">
          <FormacionesPartido partido={partido} denso />
        </div>

        <p className="mt-3 text-center">
          <Link
            href={`/partido/${partido.slug}`}
            className="link-planilla text-[13px] font-medium text-verde-600 hover:underline"
          >
            Ficha completa del partido →
          </Link>
        </p>
      </section>
    )
  }

  return (
    <section
      aria-labelledby={idTitulo}
      className={`planilla overflow-hidden rounded-md border border-linea bg-papel ${className}`}
    >
      <div className="border-b border-linea px-4 py-5 sm:px-6">
        <p className="meta text-center">{etiquetaFecha(partido)}</p>
        {titulo}
        <p className="mt-4 flex justify-center">
          <ChipResultado partido={partido} />
        </p>
      </div>

      {/* Sin padding lateral en mobile: la línea de tiempo necesita cada píxel
          de ancho, y el borde de la tarjeta ya hace de margen. */}
      <div className="py-4 sm:px-6">
        <LineaDeTiempo partido={partido} />
      </div>

      <div className="border-t border-linea px-4 py-5 sm:px-6">
        <FormacionesPartido
          partido={partido}
          nivelTitulo={Math.min(nivelTitulo + 1, 5) as 3 | 4 | 5}
        />
      </div>

      <div className="border-t border-linea bg-papel-alt px-4 py-4 sm:px-6">
        <DatosPartido partido={partido} />
      </div>
    </section>
  )
}

const ETIQUETA_RESULTADO = {
  ganado: 'Victoria',
  empatado: 'Empate',
  perdido: 'Derrota',
} as const

/**
 * El resultado va escrito, no sólo en color: en escala de grises "Victoria" y
 * "Derrota" se distinguen igual.
 */
function ChipResultado({ partido }: { partido: PartidoCompleto }) {
  const resultado = partido.estado === 'finalizado' ? resultadoParaAldosivi(partido) : null

  if (!resultado) {
    return (
      <span className="meta rounded-sm border border-linea px-2 py-1 text-gris">
        {ETIQUETA_ESTADO[partido.estado]}
      </span>
    )
  }

  const color =
    resultado === 'ganado'
      ? 'border-verde-600 text-verde-600'
      : resultado === 'perdido'
        ? 'border-roja text-roja'
        : 'border-linea text-gris'

  return (
    <span className={`meta rounded-sm border px-2 py-1 ${color}`}>
      {ETIQUETA_RESULTADO[resultado]}
    </span>
  )
}
