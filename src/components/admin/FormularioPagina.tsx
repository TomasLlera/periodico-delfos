'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { guardarPagina } from '@/actions/paginas'
import { Aviso } from '@/components/admin/Aviso'
import { BarraFormulario } from '@/components/admin/BarraFormulario'
import { CampoTexto } from '@/components/admin/CampoTexto'
import { EditorCuerpo } from '@/components/admin/EditorCuerpo'
import type { DocumentoTipTap, Pagina } from '@/types'

/**
 * El texto de una página fija del sitio.
 *
 * **Reusa `<EditorCuerpo />`, el mismo editor de las notas.** Es la razón de que
 * el cuerpo se guarde como documento de TipTap y no como texto plano: Charlie ya
 * sabe usar este editor, y lo que escriba acá se dibuja con el mismo renderer
 * que el cuerpo de una crónica, así que se ve igual.
 *
 * **No usa `usarFormulario`** como los formularios de catálogo: el estado acá
 * incluye un árbol de TipTap, que no entra en el `cambiar(campo, valor)` de ese
 * hook. Es el mismo motivo por el que `<FormularioNota />` tampoco lo usa.
 *
 * **El editor va sin notas enlazables ni partidos.** Las dos cosas son para una
 * crónica: anclar otra nota y embeber una planilla tienen sentido adentro de un
 * texto periodístico, no en "Quiénes somos". Si alguien igual inserta una
 * planilla, el renderer la descarta en silencio porque la página no precarga
 * partidos — se pierde el bloque, no la página.
 */
interface Props {
  pagina: Pagina
}

export function FormularioPagina({ pagina }: Props) {
  const router = useRouter()
  const [titulo, setTitulo] = useState(pagina.titulo)
  const [descripcion, setDescripcion] = useState(pagina.descripcion)
  const [cuerpo, setCuerpo] = useState<DocumentoTipTap>(pagina.cuerpo)
  const [aviso, setAviso] = useState<string | null>(null)
  const [ocupado, empezar] = useTransition()

  function enviar() {
    if (titulo.trim() === '' || descripcion.trim() === '') {
      setAviso('El título y la descripción no pueden quedar vacíos.')
      return
    }

    setAviso(null)

    empezar(async () => {
      const r = await guardarPagina(pagina.slug, { titulo, descripcion, cuerpo })

      if (r.error) {
        setAviso([r.error, ...(r.motivos ?? [])].join(' · '))
        return
      }

      router.refresh()
      router.push('/admin/paginas')
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <Aviso>
        Esto es lo que se lee en <strong>/{pagina.slug}</strong>. Los cambios se
        ven en el sitio apenas se guardan.
      </Aviso>

      <CampoTexto
        id="titulo"
        etiqueta="Título"
        valor={titulo}
        onCambio={setTitulo}
        ayuda="El encabezado de la página, y lo que sale en la pestaña del navegador."
      />

      <CampoTexto
        id="descripcion"
        etiqueta="Descripción"
        largo
        valor={descripcion}
        onCambio={setDescripcion}
        ayuda="Una o dos líneas. No se ve en la página: es lo que muestra Google y lo que aparece al compartir el link."
      />

      <div className="flex flex-col gap-1">
        <span className="meta text-text-muted">El texto</span>
        <EditorCuerpo
          valor={cuerpo}
          onCambio={setCuerpo}
          notas={[]}
          idActual={null}
          partidos={[]}
        />
      </div>

      <BarraFormulario
        aviso={aviso}
        ocupado={ocupado}
        onGuardar={enviar}
        volverA="/admin/paginas"
        etiqueta="Guardar la página"
      />
    </div>
  )
}
