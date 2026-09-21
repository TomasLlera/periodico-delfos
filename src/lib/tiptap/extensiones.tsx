'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import { ClipboardList } from 'lucide-react'
import { ATRIBUTOS_IMAGEN, ATRIBUTOS_PLANILLA } from '@/lib/tiptap/esquema'

/**
 * Los dos nodos propios del proyecto, para el editor.
 *
 * El renderer del sitio (`render.tsx`) ya los dibujaba y el esquema
 * (`esquema.ts`) ya los validaba desde hace tiempo; lo que faltaba era la
 * extensión que los **inserta**, así que hasta ahora sólo llegaban al cuerpo de
 * una nota por la migración desde WordPress o escribiendo el JSON a mano.
 *
 * **El contrato de atributos lo fija `esquema.ts` y acá se respeta al pie**:
 *
 *     { type: 'imagen',   attrs: { src, alt, epigrafe?, credito? } }
 *     { type: 'planilla', attrs: { partidoId } }
 *
 * Los nombres no están escritos dos veces: `addAttributes()` los saca de
 * `ATRIBUTOS_IMAGEN` y `ATRIBUTOS_PLANILLA`, que viven en `esquema.ts` porque
 * ahí es donde se validan. Repetirlos era la forma más fácil de que el editor
 * guardara `epigrafe` mientras el renderer leía otra cosa.
 *
 * Los dos son `atom: true`: no tienen contenido editable adentro. Un epígrafe
 * escrito como texto libre dentro del nodo podría quedar con negritas y links,
 * y el renderer lo dibuja como una línea de pie de foto: es un atributo, no
 * contenido.
 */

/** Del contrato `{ nombre: valorInicial }` a lo que espera TipTap. */
function conDefaults(
  atributos: Readonly<Record<string, unknown>>,
): Record<string, { default: unknown }> {
  return Object.fromEntries(
    Object.entries(atributos).map(([nombre, valor]) => [nombre, { default: valor }]),
  )
}

// ============================================
// imagen
// ============================================

/**
 * La imagen del cuerpo.
 *
 * **No usa `ReactNodeViewRenderer` a propósito**: con `renderHTML` devolviendo
 * un `<figure>` con su `<img>`, el editor muestra la foto de verdad mientras se
 * escribe, que es media vista previa gratis y cero JavaScript extra. El nodo de
 * planilla sí lo necesita, porque lo que tiene que mostrar no está en sus
 * atributos.
 *
 * El `alt` es obligatorio (regla no negociable 4) y lo exige el panel que
 * inserta el nodo. Acá el atributo tiene default `''` porque TipTap necesita
 * uno: el que no deja guardar una imagen sin alt es `atributosImagen()`, que
 * descarta el nodo entero al renderizar, y el CHECK de la base.
 */
export const NodoImagen = Node.create({
  name: 'imagen',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return conDefaults(ATRIBUTOS_IMAGEN)
  },

  parseHTML() {
    return [{ tag: 'figure[data-imagen]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const { src, alt, epigrafe, credito } = HTMLAttributes as Record<string, string | null>

    // El pie junta epígrafe y crédito como lo hace `ImagenResponsive`, para que
    // lo que se ve escribiendo sea lo que se va a publicar.
    const pie = [epigrafe, credito].filter(Boolean).join(' · ')

    return [
      'figure',
      mergeAttributes({ 'data-imagen': '' }),
      ['img', { src: src ?? '', alt: alt ?? '' }],
      ...(pie ? [['figcaption', {}, pie] as const] : []),
    ]
  },
})

// ============================================
// planilla
// ============================================

/**
 * Cómo se llama cada partido en el editor. La pasa `EditorCuerpo`.
 *
 * El nodo guarda **sólo el `partidoId`** —es el contrato del esquema, y es lo
 * correcto: el marcador cambia cuando se carga un gol, y un nombre guardado
 * adentro del cuerpo quedaría viejo—. Pero entonces el editor no tiene con qué
 * dibujar el bloque, porque el nodo no dice contra quién se jugó. Por eso la
 * etiqueta viaja como opción de la extensión y no como atributo del nodo.
 */
export interface OpcionesPlanilla {
  etiquetaDePartido: (partidoId: string) => string | null
}

/**
 * La planilla embebida: el bloque que hace que una crónica muestre los goles
 * **sin que nadie los escriba en el texto** (regla no negociable 2).
 *
 * Es el último eslabón de lo que el proyecto vino a resolver. Hasta ahora la
 * planilla aparecía sola al pie de las notas con `partido_id`; esto deja
 * ponerla en el medio del texto, que es donde va en una crónica: después del
 * relato del primer tiempo, no al final de todo.
 */
export const NodoPlanilla = Node.create<OpcionesPlanilla>({
  name: 'planilla',
  group: 'block',
  atom: true,
  draggable: true,

  addOptions() {
    return { etiquetaDePartido: () => null }
  },

  addAttributes() {
    return conDefaults(ATRIBUTOS_PLANILLA)
  },

  parseHTML() {
    return [{ tag: 'div[data-planilla]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const { partidoId } = HTMLAttributes as Record<string, string | null>
    return ['div', mergeAttributes({ 'data-planilla': '', 'data-partido-id': partidoId ?? '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(VistaPlanilla)
  },
})

/**
 * Lo que se ve en el editor donde va a ir la planilla.
 *
 * Un bloque con el nombre del partido y no la planilla de verdad: dibujarla
 * entera exigiría traer eventos y formaciones al editor, y lo que hace falta
 * saber mientras se escribe es **cuál** está embebida y dónde, no cómo va a
 * quedar. Para eso está la vista previa, que usa el renderer real.
 *
 * `contentEditable={false}` porque es un átomo: sin eso el cursor entra al
 * bloque y se puede escribir adentro de algo que no guarda texto.
 */
function VistaPlanilla({
  node,
  extension,
}: {
  node: { attrs: Record<string, unknown> }
  extension: { options: OpcionesPlanilla }
}) {
  const partidoId = typeof node.attrs.partidoId === 'string' ? node.attrs.partidoId : null
  const etiqueta = partidoId ? extension.options.etiquetaDePartido(partidoId) : null

  return (
    <NodeViewWrapper
      contentEditable={false}
      className="my-4 flex items-center gap-3 border-l-2 border-verde-900 bg-papel-alt px-4 py-3"
    >
      <ClipboardList size={18} aria-hidden="true" className="shrink-0" />
      <span className="flex flex-col">
        <span className="meta text-gris">Planilla del partido</span>
        <span className="font-display text-[0.95rem] font-bold">
          {etiqueta ?? 'Un partido que ya no está cargado'}
        </span>
      </span>
    </NodeViewWrapper>
  )
}
