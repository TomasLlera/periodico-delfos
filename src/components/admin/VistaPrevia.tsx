'use client'

import { useState } from 'react'
import { ArrowLeft, CalendarClock, Eye, Send } from 'lucide-react'
import { ArticuloNota } from '@/components/content/ArticuloNota'
import { ANCHO_VIEWPORT, SelectorViewport, type Viewport } from '@/components/admin/SelectorViewport'
import { localAIso } from '@/lib/entidades/campos'
import { chequearProgramacion } from '@/lib/nota'
import type { NotaConRelaciones } from '@/types'

/**
 * Cómo va a quedar la nota, antes de que exista.
 *
 * Hasta ahora, para ver una nota terminada había que publicarla, mirarla y
 * despublicarla si no gustaba. Eso la deja publicada unos segundos y dispara el
 * auto-posteo a Facebook, Instagram y X, que no tiene vuelta atrás. La preview
 * es eso mismo pero sin escribir nada: ni una fila, ni un archivo en el bucket.
 *
 * **Dibuja con `<ArticuloNota />`, el componente del sitio público.** No hay
 * markup ni estilos paralelos, y no puede haberlos: si la preview tuviera los
 * suyos, mostraría cómo se ve la preview y no cómo va a quedar la nota, que es
 * lo único que se le está preguntando. `<ArticuloNota />` ya era puro y
 * sincrónico —recibe todo por props y no consulta nada—, así que anda igual
 * dentro de este árbol cliente.
 *
 * **Los links no navegan.** Un click en "Crónicas" desde acá se llevaría puesto
 * todo lo escrito y sin guardar. Se cancelan en captura, sobre el contenedor,
 * en vez de desactivarlos uno por uno: cualquier link que alguien agregue
 * mañana al artículo queda cubierto sin que haya que acordarse.
 *
 * **El nodo `planilla` todavía no se resuelve**: el mapa de partidos va vacío,
 * porque hoy la tabla `partidos` está vacía y no hay con qué probarlo. La
 * decisión fue esperar a tener un partido cargado antes de escribir esa parte,
 * en vez de plomería que no se puede verificar. Cuando llegue, va acá: la
 * query en `queries/partidos.ts` con el cliente de navegador, TanStack Query, y
 * el mapa armado con `mapaDePartidos()`.
 */

interface Props {
  nota: NotaConRelaciones
  /** `true` si lo que se mira son cambios sobre una nota que ya está en el sitio. */
  sobrePublicada: boolean
  onVolver: () => void
  onPublicar: () => void
  publicando: boolean
  /** Programar para más tarde. La hora llega en ISO. */
  onProgramar: (publicarEn: string) => void
}

export function VistaPrevia({
  nota,
  sobrePublicada,
  onVolver,
  onPublicar,
  publicando,
  onProgramar,
}: Props) {
  const [viewport, setViewport] = useState<Viewport>('escritorio')
  const [cuando, setCuando] = useState('')

  // La hora del formulario viene en hora de Argentina y la base guarda UTC.
  const enIso = localAIso(cuando)
  const chequeo = chequearProgramacion(enIso)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-bg-muted px-4 py-3">
        <p className="flex items-center gap-2 font-display text-[0.9rem] font-bold">
          <Eye size={16} aria-hidden="true" />
          Vista previa — todavía no está publicado
        </p>

        {sobrePublicada && (
          <p className="meta bg-accent px-2 py-0.5 text-accent-contrast">
            Cambios sobre una nota publicada
          </p>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <SelectorViewport valor={viewport} onCambio={setViewport} />

          <button
            type="button"
            onClick={onVolver}
            disabled={publicando}
            className="tactil flex items-center gap-2 border border-border-control px-4 font-display text-[0.9rem] font-bold hover:bg-bg disabled:opacity-60"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Volver a editar
          </button>

          <button
            type="button"
            onClick={onPublicar}
            disabled={publicando}
            className="tactil flex items-center gap-2 bg-text px-5 font-display text-[0.9rem] font-extrabold text-bg hover:bg-text/85 disabled:opacity-60"
          >
            <Send size={16} aria-hidden="true" />
            {publicando ? 'Publicando…' : 'Publicar'}
          </button>
        </div>

        {/* Programar va acá abajo y no al lado del botón grande: es la acción
            rara. Lo normal es publicar ahora, y una fila entera de controles
            compitiendo con el botón principal hace dudar en el caso común. */}
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <label htmlFor="publicar-en" className="meta text-text-muted">
            O programala para
          </label>
          <input
            id="publicar-en"
            type="datetime-local"
            value={cuando}
            onChange={(e) => setCuando(e.target.value)}
            disabled={publicando}
            className="tactil border border-border-control bg-bg px-2 font-display text-[0.85rem]"
          />
          <button
            type="button"
            onClick={() => enIso && onProgramar(enIso)}
            disabled={publicando || !chequeo.puede}
            className="tactil flex items-center gap-2 border border-border-control px-4 font-display text-[0.9rem] font-bold hover:bg-bg disabled:opacity-50"
          >
            <CalendarClock size={16} aria-hidden="true" />
            Programar
          </button>

          {/* El motivo sólo cuando ya escribieron algo: con el campo vacío
              diría «elegí cuándo» antes de que nadie haya intentado nada. */}
          {cuando !== '' && chequeo.motivo && (
            <p role="status" className="w-full text-right text-[0.85rem] text-danger">
              {chequeo.motivo}
            </p>
          )}
        </div>
      </div>

      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions --
          no es un control: es una jaula para los clicks de adentro. */}
      <div
        className="flex-1 overflow-y-auto"
        onClickCapture={(e) => {
          if ((e.target as HTMLElement).closest('a')) e.preventDefault()
        }}
      >
        <div
          style={{ maxWidth: ANCHO_VIEWPORT[viewport] }}
          className="mx-auto min-h-full border-x border-border bg-bg"
        >
          <ArticuloNota
            nota={nota}
            // La URL que van a compartir los botones. Todavía no existe, pero
            // es exactamente la que va a tener: sale del slug del formulario.
            url={`/nota/${nota.slug}`}
            partidos={new Map()}
            partidoDeLaNota={null}
            relacionadas={[]}
          />
        </div>
      </div>
    </div>
  )
}
