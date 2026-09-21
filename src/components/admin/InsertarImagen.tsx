'use client'

import { useEffect, useState, useTransition } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { subirImagen } from '@/actions/imagenes'
import { chequearImagen, TIPOS_IMAGEN } from '@/lib/imagen'
import { CampoTexto } from '@/components/admin/CampoTexto'

/**
 * Meter una imagen en el medio del cuerpo de una nota.
 *
 * Es el panel hermano de `EnlazarNota`: se abre desde la barra del editor,
 * ocupa el ancho y se cierra al insertar.
 *
 * **Acá la imagen sí se sube al tocar "Insertar"**, al revés que la portada de
 * la nota —que espera a que se guarde—. La diferencia no es un descuido: el
 * nodo del cuerpo guarda una URL y nada más, y un `blob:` local metido en el
 * JSON quedaría guardado en la base apuntando a un objeto que sólo existe en
 * este navegador (regla no negociable 6). La portada puede esperar porque vive
 * en una columna aparte que se reemplaza entera al guardar; un nodo en el medio
 * del texto, no.
 *
 * El costo de eso, dicho para que no sorprenda: insertar y después borrar el
 * nodo deja el archivo subido en el bucket. Es basura barata —un archivo
 * huérfano— frente a la alternativa, que es una nota publicada con una imagen
 * rota.
 *
 * **El `alt` es obligatorio y el botón no se habilita sin él** (regla no
 * negociable 4). Se pide acá, con la foto elegida a la vista, que es lo que
 * hace que se escriba mirándola y no como un trámite.
 */

export interface ImagenParaInsertar {
  src: string
  alt: string
  epigrafe: string | null
  credito: string | null
}

interface Props {
  onInsertar: (imagen: ImagenParaInsertar) => void
  onCerrar: () => void
}

export function InsertarImagen({ onInsertar, onCerrar }: Props) {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [urlLocal, setUrlLocal] = useState<string | null>(null)
  const [alt, setAlt] = useState('')
  const [epigrafe, setEpigrafe] = useState('')
  const [credito, setCredito] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [subiendo, empezar] = useTransition()

  // El `blob:` de la previsualización se libera al cambiar de archivo y al
  // cerrar el panel; si no, cada foto probada queda retenida.
  useEffect(() => {
    if (!archivo) {
      setUrlLocal(null)
      return
    }

    const url = URL.createObjectURL(archivo)
    setUrlLocal(url)
    return () => URL.revokeObjectURL(url)
  }, [archivo])

  function elegir(nuevo: File | null) {
    if (!nuevo) {
      setArchivo(null)
      return
    }

    const chequeo = chequearImagen(nuevo.type, nuevo.size)
    if (!chequeo.ok) {
      setError(chequeo.motivo ?? 'Esa imagen no se puede usar')
      return
    }

    setError(null)
    setArchivo(nuevo)
  }

  function insertar() {
    if (!archivo || alt.trim() === '') return

    empezar(async () => {
      const formData = new FormData()
      formData.set('archivo', archivo)
      const r = await subirImagen(formData)

      if (r.error || !r.url) {
        setError(r.error ?? 'No se pudo subir la imagen')
        return
      }

      onInsertar({
        src: r.url,
        alt: alt.trim(),
        epigrafe: epigrafe.trim() || null,
        credito: credito.trim() || null,
      })
    })
  }

  return (
    <div className="flex flex-col gap-3 border-b border-linea bg-papel-alt p-3">
      <div className="flex items-center gap-2">
        <p className="meta text-gris">Insertar una imagen</p>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="tactil ml-auto flex items-center justify-center px-2 hover:text-roja"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {urlLocal && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={urlLocal} alt="" className="max-h-48 w-full border border-linea object-contain" />
      )}

      <label
        htmlFor="imagen-cuerpo"
        className="tactil flex cursor-pointer items-center gap-2 self-start border border-linea-fuerte bg-tarjeta px-4 font-display text-[0.9rem] font-bold hover:bg-papel"
      >
        <ImagePlus size={16} aria-hidden="true" />
        {archivo ? 'Cambiar la imagen' : 'Elegir una imagen'}
      </label>
      <input
        id="imagen-cuerpo"
        type="file"
        accept={TIPOS_IMAGEN.join(',')}
        onChange={(e) => elegir(e.target.files?.[0] ?? null)}
        className="sr-only"
      />

      <CampoTexto
        id="alt-cuerpo"
        etiqueta="Texto alternativo"
        valor={alt}
        onCambio={setAlt}
        ayuda="Obligatorio. Describí lo que se ve, para quien no la ve."
      />

      <CampoTexto
        id="epigrafe-cuerpo"
        etiqueta="Epígrafe"
        valor={epigrafe}
        onCambio={setEpigrafe}
        ayuda="Opcional. Es la línea que se lee abajo de la foto."
      />

      <CampoTexto
        id="credito-cuerpo"
        etiqueta="Crédito"
        valor={credito}
        onCambio={setCredito}
        ayuda="Opcional. Quién sacó la foto."
      />

      {error && (
        <p role="alert" className="text-[0.85rem] text-roja">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={insertar}
        disabled={subiendo || !archivo || alt.trim() === ''}
        className="tactil flex items-center gap-2 self-start bg-verde-900 px-5 font-display text-[0.9rem] font-extrabold text-white hover:bg-verde-600 disabled:opacity-60"
      >
        {subiendo ? 'Subiendo…' : 'Insertar'}
      </button>

      {!archivo && (
        <p className="text-[0.8rem] text-gris">Elegí una imagen y escribí el texto alternativo.</p>
      )}
    </div>
  )
}
