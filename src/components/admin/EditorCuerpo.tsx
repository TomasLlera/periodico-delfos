'use client'

import { useState } from 'react'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold,
  ClipboardList,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
  Unlink,
} from 'lucide-react'
import { EnlazarNota, type NotaEnlazable } from '@/components/admin/EnlazarNota'
import { InsertarImagen } from '@/components/admin/InsertarImagen'
import { InsertarPlanilla } from '@/components/admin/InsertarPlanilla'
import { etiquetaDePartido } from '@/lib/partido'
import { NodoImagen, NodoPlanilla } from '@/lib/tiptap/extensiones'
import type { DocumentoTipTap, PartidoConEquipos } from '@/types'

/**
 * El cuerpo de la nota, en TipTap.
 *
 * Guarda **JSON y no HTML**, que es lo que espera la columna `notas.cuerpo`
 * (`jsonb`) y lo que lee el renderer del sitio. Guardar HTML obligaría a
 * parsearlo de vuelta para sacar los `partidoId` de las planillas, y volvería a
 * meter markup en la base — que es justo lo que la migración desde WordPress
 * vino a sacar.
 *
 * `immediatelyRender: false` no es opcional en el App Router: sin eso TipTap
 * dibuja en el servidor un árbol que el cliente rearma distinto, y React tira
 * un error de hidratación en cada carga del editor.
 *
 * **Los dos nodos propios del proyecto —`imagen` y `planilla`— se insertan
 * desde esta barra.** Viven en `src/lib/tiptap/extensiones.tsx` y respetan el
 * contrato de atributos que documenta `esquema.ts`, que es el mismo que lee el
 * renderer del sitio. Tocar esos nombres en un solo lado guarda nodos que el
 * sitio después descarta en silencio.
 *
 * El de planilla es el que cierra la regla no negociable 2: deja poner los
 * goles del partido **en el medio de la crónica** sin que nadie los escriba en
 * el texto. Guarda el id del partido y nada más, así que un gol corregido
 * después en la planilla aparece corregido en la nota ya publicada.
 */

/** Cuál de los tres paneles está abierto. Uno solo a la vez: son excluyentes. */
type Panel = 'enlazar' | 'imagen' | 'planilla'

interface Props {
  valor: DocumentoTipTap
  onCambio: (documento: DocumentoTipTap) => void
  /** Para el botón de anclar: las publicadas, ya leídas por la página. */
  notas: readonly NotaEnlazable[]
  /** La que se está editando, para no ofrecerse a sí misma. */
  idActual: string | null
  /** Para embeber una planilla. Los mismos que ya usa el selector de la nota. */
  partidos: readonly PartidoConEquipos[]
}

export function EditorCuerpo({ valor, onCambio, notas, idActual, partidos }: Props) {
  const [panel, setPanel] = useState<Panel | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      NodoImagen,
      // El nodo guarda sólo el id; el nombre del partido se lo da esta opción
      // para poder dibujar el bloque mientras se escribe. `partidos` lo trae
      // la página del editor y no cambia mientras la pantalla está abierta,
      // así que la clausura no se queda vieja.
      NodoPlanilla.configure({
        etiquetaDePartido: (id) => {
          const partido = partidos.find((p) => p.id === id)
          return partido ? etiquetaDePartido(partido) : null
        },
      }),
    ],
    content: valor,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        // `prose-nota` es la clase del cuerpo en el sitio: 68ch, 18/19px,
        // line-height 1.7 (regla no negociable 3). Escribir con la misma
        // medida con la que se lee es media vista previa gratis.
        class: 'prose-nota min-h-[24rem] px-4 py-3 outline-none',
      },
    },
    onUpdate({ editor }) {
      onCambio(editor.getJSON() as DocumentoTipTap)
    },
  })

  if (!editor) return <div className="min-h-[28rem] border border-linea bg-tarjeta" />

  return (
    <div className="border border-linea bg-tarjeta">
      <div className="flex flex-wrap items-center gap-1 border-b border-linea px-2 py-1">
        <Boton editor={editor} accion="negrita" etiqueta="Negrita">
          <Bold size={16} aria-hidden="true" />
        </Boton>
        <Boton editor={editor} accion="italica" etiqueta="Itálica">
          <Italic size={16} aria-hidden="true" />
        </Boton>

        <span className="mx-1 h-5 w-px bg-linea" />

        <Boton editor={editor} accion="titulo2" etiqueta="Título">
          <span className="font-display text-[0.85rem] font-extrabold">H2</span>
        </Boton>
        <Boton editor={editor} accion="titulo3" etiqueta="Subtítulo">
          <span className="font-display text-[0.85rem] font-extrabold">H3</span>
        </Boton>

        <span className="mx-1 h-5 w-px bg-linea" />

        <Boton editor={editor} accion="lista" etiqueta="Lista">
          <List size={16} aria-hidden="true" />
        </Boton>
        <Boton editor={editor} accion="listaNumerada" etiqueta="Lista numerada">
          <ListOrdered size={16} aria-hidden="true" />
        </Boton>
        <Boton editor={editor} accion="cita" etiqueta="Cita">
          <Quote size={16} aria-hidden="true" />
        </Boton>

        <span className="mx-1 h-5 w-px bg-linea" />

        <Boton editor={editor} accion="deshacer" etiqueta="Deshacer">
          <Undo2 size={16} aria-hidden="true" />
        </Boton>
        <Boton editor={editor} accion="rehacer" etiqueta="Rehacer">
          <Redo2 size={16} aria-hidden="true" />
        </Boton>

        <span className="mx-1 h-5 w-px bg-linea" />

        {/* Anclar una nota. El texto seleccionado se vuelve el link; si no hay
            nada seleccionado, TipTap no tiene qué enlazar y el botón no abre
            el panel: enlazar el vacío deja un link invisible en el cuerpo. */}
        <button
          type="button"
          onClick={() => setPanel((p) => (p === 'enlazar' ? null : 'enlazar'))}
          disabled={editor.state.selection.empty && !editor.isActive('link')}
          title="Anclar una nota o un link"
          aria-label="Anclar una nota o un link"
          aria-pressed={panel === 'enlazar'}
          className={`tactil flex min-w-11 items-center justify-center px-2 disabled:opacity-40 ${
            panel === 'enlazar' || editor.isActive('link')
              ? 'bg-verde-900 text-white'
              : 'hover:bg-papel-alt'
          }`}
        >
          <Link2 size={16} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive('link')}
          title="Sacar el link"
          aria-label="Sacar el link"
          className="tactil flex min-w-11 items-center justify-center px-2 hover:bg-papel-alt disabled:opacity-40"
        >
          <Unlink size={16} aria-hidden="true" />
        </button>

        <span className="mx-1 h-5 w-px bg-linea" />

        {/* Los dos nodos propios. Van juntos y al final de la barra: se usan
            una o dos veces por nota, al revés que la negrita. */}
        <button
          type="button"
          onClick={() => setPanel((p) => (p === 'imagen' ? null : 'imagen'))}
          title="Insertar una imagen"
          aria-label="Insertar una imagen"
          aria-pressed={panel === 'imagen'}
          className={`tactil flex min-w-11 items-center justify-center px-2 ${
            panel === 'imagen' ? 'bg-verde-900 text-white' : 'hover:bg-papel-alt'
          }`}
        >
          <ImagePlus size={16} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => setPanel((p) => (p === 'planilla' ? null : 'planilla'))}
          title="Embeber la planilla de un partido"
          aria-label="Embeber la planilla de un partido"
          aria-pressed={panel === 'planilla'}
          className={`tactil flex min-w-11 items-center justify-center px-2 ${
            panel === 'planilla' ? 'bg-verde-900 text-white' : 'hover:bg-papel-alt'
          }`}
        >
          <ClipboardList size={16} aria-hidden="true" />
        </button>
      </div>

      {panel === 'enlazar' && (
        <EnlazarNota
          notas={notas}
          idActual={idActual}
          onCerrar={() => setPanel(null)}
          onElegir={(href) => {
            editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
            setPanel(null)
          }}
        />
      )}

      {panel === 'imagen' && (
        <InsertarImagen
          onCerrar={() => setPanel(null)}
          onInsertar={(imagen) => {
            editor.chain().focus().insertContent({ type: 'imagen', attrs: imagen }).run()
            setPanel(null)
          }}
        />
      )}

      {panel === 'planilla' && (
        <InsertarPlanilla
          partidos={partidos}
          onCerrar={() => setPanel(null)}
          onElegir={(partidoId) => {
            editor.chain().focus().insertContent({ type: 'planilla', attrs: { partidoId } }).run()
            setPanel(null)
          }}
        />
      )}

      <EditorContent editor={editor} />
    </div>
  )
}

type Accion =
  | 'negrita'
  | 'italica'
  | 'titulo2'
  | 'titulo3'
  | 'lista'
  | 'listaNumerada'
  | 'cita'
  | 'deshacer'
  | 'rehacer'

/** Qué corre cada botón, y con qué nodo de TipTap se pinta activo. */
const ACCIONES: Record<Accion, { correr: (e: Editor) => void; activo?: [string, object?] }> = {
  negrita: { correr: (e) => e.chain().focus().toggleBold().run(), activo: ['bold'] },
  italica: { correr: (e) => e.chain().focus().toggleItalic().run(), activo: ['italic'] },
  titulo2: {
    correr: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
    activo: ['heading', { level: 2 }],
  },
  titulo3: {
    correr: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
    activo: ['heading', { level: 3 }],
  },
  lista: { correr: (e) => e.chain().focus().toggleBulletList().run(), activo: ['bulletList'] },
  listaNumerada: {
    correr: (e) => e.chain().focus().toggleOrderedList().run(),
    activo: ['orderedList'],
  },
  cita: { correr: (e) => e.chain().focus().toggleBlockquote().run(), activo: ['blockquote'] },
  deshacer: { correr: (e) => e.chain().focus().undo().run() },
  rehacer: { correr: (e) => e.chain().focus().redo().run() },
}

function Boton({
  editor,
  accion,
  etiqueta,
  children,
}: {
  editor: Editor
  accion: Accion
  etiqueta: string
  children: React.ReactNode
}) {
  const { correr, activo } = ACCIONES[accion]
  const encendido = activo ? editor.isActive(activo[0], activo[1]) : false

  return (
    <button
      type="button"
      onClick={() => correr(editor)}
      title={etiqueta}
      aria-label={etiqueta}
      aria-pressed={activo ? encendido : undefined}
      className={`tactil flex min-w-11 items-center justify-center px-2 ${
        encendido ? 'bg-verde-900 text-white' : 'hover:bg-papel-alt'
      }`}
    >
      {children}
    </button>
  )
}
