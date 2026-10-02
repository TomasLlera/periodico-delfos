'use client'

import { useState } from 'react'
import { CampoTexto } from '@/components/admin/CampoTexto'
import { idDeYouTube, miniaturaDeYouTube } from '@/lib/tiptap/video'

/**
 * El panel para meter un video de YouTube en el cuerpo de la nota.
 *
 * **Valida mientras se escribe y muestra la miniatura.** Pegar una URL y no
 * saber si agarró hasta publicar la nota es la forma más barata de publicar un
 * hueco: la miniatura aparece apenas el id es válido, así que se ve que es el
 * video que se quería antes de insertarlo.
 *
 * **El título es obligatorio.** Es lo único que un lector de pantalla anuncia
 * de un `<iframe>`; sin él se lee "marco" y nada más. Es el mismo criterio que
 * el `alt` de las imágenes (regla no negociable 4), con la diferencia de que
 * acá no hay un CHECK en la base que lo obligue, así que lo obliga el panel.
 *
 * **Sólo YouTube.** Instagram y X necesitan cargar el script de cada
 * plataforma, que pesa, deja cookies de terceros y deja de funcionar si borran
 * el posteo. Está contado en la lista de respuestas a Charlie.
 */
interface Props {
  onInsertar: (video: { videoId: string; titulo: string }) => void
  onCerrar: () => void
}

export function InsertarVideo({ onInsertar, onCerrar }: Props) {
  const [url, setUrl] = useState('')
  const [titulo, setTitulo] = useState('')
  const [tocado, setTocado] = useState(false)

  const videoId = idDeYouTube(url)
  const urlEscrita = url.trim() !== ''
  const errorUrl = tocado && urlEscrita && !videoId ? 'No parece un link de YouTube.' : undefined
  const errorTitulo =
    tocado && titulo.trim() === '' ? 'Hace falta para que el video se pueda anunciar.' : undefined

  const listo = videoId !== null && titulo.trim() !== ''

  return (
    <div className="mt-3 flex flex-col gap-3 border border-border-control bg-bg-elevated p-4">
      <CampoTexto
        id="video-url"
        etiqueta="Link del video"
        valor={url}
        onCambio={(valor) => {
          setUrl(valor)
          setTocado(true)
        }}
        error={errorUrl}
        ayuda="Pegá el link de YouTube. Sirve el de la barra del navegador y el que da el botón Compartir."
      />

      <CampoTexto
        id="video-titulo"
        etiqueta="De qué es el video"
        valor={titulo}
        onCambio={(valor) => {
          setTitulo(valor)
          setTocado(true)
        }}
        error={errorTitulo}
        ayuda="Lo que escuchan quienes usan lector de pantalla. Por ejemplo: «El segundo gol de Larea contra Claypole»."
      />

      {videoId && (
        <figure className="flex items-center gap-3">
          {/* Un `<img>` suelto y no `<ImagenResponsive>`: es una miniatura de
              YouTube, no una imagen del sitio, y no pasa por el transformador
              de Supabase. */}
          <img
            src={miniaturaDeYouTube(videoId)}
            alt=""
            width={128}
            height={72}
            className="h-auto w-32 shrink-0 object-cover"
          />
          <figcaption className="text-[0.85rem] text-text-muted">
            Esta es la miniatura del video que se va a insertar.
          </figcaption>
        </figure>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={!listo}
          onClick={() => {
            if (!videoId) return
            onInsertar({ videoId, titulo: titulo.trim() })
          }}
          className="tactil bg-accent px-4 font-display text-[0.9rem] font-bold text-accent-contrast disabled:opacity-50"
        >
          Insertar
        </button>

        <button
          type="button"
          onClick={onCerrar}
          className="tactil px-4 font-display text-[0.9rem] font-bold underline underline-offset-4"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
