import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { CabeceraPartido } from '@/components/partido/CabeceraPartido'
import { DatosPartido } from '@/components/partido/DatosPartido'
import { FormacionesPartido } from '@/components/partido/FormacionesPartido'
import { LineaDeTiempo } from '@/components/partido/LineaDeTiempo'
import { PlanillaCompacta } from '@/components/partido/PlanillaCompacta'
import { etiquetaFecha, fechaCorta, resultadoParaAldosivi } from '@/lib/formato'
import { ETIQUETA_ESTADO, ladosDelPartido, tituloAccesible } from '@/lib/partido'
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
  /**
   * Envuelve la planilla en un acordeón que el lector abre y cierra.
   *
   * Es para cuando la planilla es un aparte dentro de otra cosa —una nota—, no
   * cuando es el contenido principal: en `/partido/[slug]` la planilla *es* la
   * página y plegarla no tendría sentido. Por eso viene apagado por omisión.
   */
  plegable?: boolean
  /**
   * Estado inicial del acordeón. **Abierto por omisión**, a propósito: los
   * datos del partido son el corazón del proyecto y arrancar cerrado los
   * esconde justo donde más valen. El lector los cierra si quiere seguir
   * leyendo; el que llega por el resultado no tiene que hacer nada.
   */
  abierta?: boolean
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
  plegable = false,
  abierta = true,
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

  const contenido =
    variante === 'embebida' ? (
      <section
        aria-labelledby={idTitulo}
        className={`planilla font-display text-[15px] ${
          plegable ? 'px-4 py-4' : `border-y-2 border-verde-600 py-4 ${className}`
        }`}
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
    ) : (
      <section
        aria-labelledby={idTitulo}
        className={`planilla ${
          plegable ? '' : `overflow-hidden rounded-md border border-linea bg-papel ${className}`
        }`}
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

  if (!plegable) return contenido

  return (
    <details
      open={abierta}
      className={`planilla group overflow-hidden rounded-md border border-linea bg-papel ${className}`}
    >
      {/* `<details>` nativo y no un componente con estado: funciona sin
          JavaScript, es accesible por teclado de fábrica y deja la planilla
          como Server Component. `"use client"` va sólo donde hace falta. */}
      <summary className="tactil flex cursor-pointer list-none items-center gap-2 px-4 py-3 hover:bg-papel-alt [&::-webkit-details-marker]:hidden">
        <ChevronRight
          size={16}
          aria-hidden="true"
          className="shrink-0 text-verde-600 transition-transform group-open:rotate-90"
        />
        <span className="meta text-tinta">Planilla del partido</span>
        <span className="dato ml-auto text-[13px] text-gris">{resumenDeCabecera(partido)}</span>
      </summary>

      <div className="border-t border-linea">{contenido}</div>
    </details>
  )
}

/**
 * Lo que se lee cuando el acordeón está cerrado.
 *
 * Aldosivi primero, con la misma regla que el resto de la planilla
 * (`ladosDelPartido()`) y no con `marcador()` de `formato.ts`, que pone al
 * local primero. Un acordeón cerrado que no dice el resultado obliga a abrirlo
 * para saber lo único que la mayoría vino a buscar.
 */
function resumenDeCabecera(partido: PartidoCompleto): string {
  const { izquierda, derecha, golesIzquierda, golesDerecha } = ladosDelPartido(partido)

  if (golesIzquierda === null || golesDerecha === null) {
    return ETIQUETA_ESTADO[partido.estado]
  }

  return `${izquierda.nombre_corto} ${golesIzquierda}-${golesDerecha} ${derecha.nombre_corto}`
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
