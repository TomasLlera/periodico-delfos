'use client'

import { useState } from 'react'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, Link2, List, ListOrdered, Quote, Redo2, Undo2, Unlink } from 'lucide-react'
import { EnlazarNota, type NotaEnlazable } from '@/components/admin/EnlazarNota'
import type { DocumentoTipTap } from '@/types'

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
 * **Los dos nodos propios del proyecto —`imagen` y `planilla`— todavía no están
 * en esta barra.** El contrato de sus atributos está documentado arriba de
 * `src/lib/tiptap/esquema.ts` y el renderer ya los dibuja; lo que falta es la
 * extensión que los inserta, y va junto con la subida al bucket. Mientras
 * tanto, un cuerpo que ya los tiene —los que trae la migración— se edita sin
 * perderlos: StarterKit ignora lo que no conoce en vez de borrarlo.
 */

interface Props {
  valor: DocumentoTipTap
  onCambio: (documento: DocumentoTipTap) => void
  /** Para el botón de anclar: las publicadas, ya leídas por la página. */
  notas: readonly NotaEnlazable[]
  /** La que se está editando, para no ofrecerse a sí misma. */
  idActual: string | null
}

export function EditorCuerpo({ valor, onCambio, notas, idActual }: Props) {
  const [enlazando, setEnlazando] = useState(false)
  const editor = useEditor({
    extensions: [StarterKit],
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
          onClick={() => setEnlazando((v) => !v)}
          disabled={editor.state.selection.empty && !editor.isActive('link')}
          title="Anclar una nota o un link"
          aria-label="Anclar una nota o un link"
          aria-pressed={enlazando}
          className={`tactil flex min-w-11 items-center justify-center px-2 disabled:opacity-40 ${
            enlazando || editor.isActive('link') ? 'bg-verde-900 text-white' : 'hover:bg-papel-alt'
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
      </div>

      {enlazando && (
        <EnlazarNota
          notas={notas}
          idActual={idActual}
          onCerrar={() => setEnlazando(false)}
          onElegir={(href) => {
            editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
            setEnlazando(false)
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
