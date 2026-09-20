'use client'

import { ImagePlus, X } from 'lucide-react'
import { CampoTexto } from '@/components/admin/CampoTexto'
import { TIPOS_IMAGEN } from '@/lib/imagen'

/**
 * La portada de la nota: el archivo, su texto alternativo y su crédito.
 *
 * El archivo elegido **no se sube acá**. Este componente sólo lo reporta hacia
 * arriba; la subida al bucket pasa cuando Charlie guarda o publica. Así,
 * probar tres fotos y cerrar el editor sin guardar no deja tres archivos
 * huérfanos en Storage.
 *
 * El `alt` va pegado al archivo y no en otra sección del formulario a
 * propósito: es obligatorio cuando hay imagen (regla no negociable 4), y
 * pedirlo al lado de la foto es lo que hace que se escriba mirándola.
 */

interface Props {
  /** La que ya está guardada en la base, si la hay. */
  urlGuardada: string | null
  /** El `blob:` de la elegida y todavía sin subir. */
  urlLocal: string | null
  alt: string
  credito: string | null
  errorAlt?: string
  onArchivo: (archivo: File | null) => void
  onAlt: (valor: string) => void
  onCredito: (valor: string | null) => void
}

export function CampoImagen({
  urlGuardada,
  urlLocal,
  alt,
  credito,
  errorAlt,
  onArchivo,
  onAlt,
  onCredito,
}: Props) {
  const aMostrar = urlLocal ?? urlGuardada

  return (
    <fieldset className="flex flex-col gap-3 border border-linea bg-tarjeta p-4">
      <legend className="meta px-1 text-gris">Portada</legend>

      {aMostrar && (
        <div className="flex items-start gap-3">
          {/* Un <img> pelado y no <ImagenResponsive />: es una miniatura de
              control, no contenido de la nota. La que se mira de verdad está
              en la vista previa. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={aMostrar}
            alt=""
            className="h-24 w-40 border border-linea object-cover"
          />
          <div className="flex flex-col gap-1 text-[0.8rem] text-gris">
            <span>{urlLocal ? 'Elegida, todavía sin subir' : 'Subida al bucket'}</span>
            <button
              type="button"
              onClick={() => onArchivo(null)}
              className="tactil flex items-center gap-1 self-start underline-offset-4 hover:underline"
            >
              <X size={14} aria-hidden="true" />
              Sacar
            </button>
          </div>
        </div>
      )}

      <label
        htmlFor="archivo"
        className="tactil flex cursor-pointer items-center gap-2 self-start border border-linea-fuerte px-4 font-display text-[0.9rem] font-bold hover:bg-papel-alt"
      >
        <ImagePlus size={16} aria-hidden="true" />
        {aMostrar ? 'Cambiar imagen' : 'Elegir imagen'}
      </label>
      <input
        id="archivo"
        type="file"
        accept={TIPOS_IMAGEN.join(',')}
        onChange={(e) => onArchivo(e.target.files?.[0] ?? null)}
        className="sr-only"
      />

      <CampoTexto
        id="imagen_alt"
        etiqueta="Texto alternativo"
        valor={alt}
        onCambio={onAlt}
        error={errorAlt}
        ayuda="Obligatorio si hay imagen. Describí lo que se ve, para quien no la ve."
      />

      <CampoTexto
        id="imagen_credito"
        etiqueta="Crédito"
        valor={credito ?? ''}
        onCambio={(v) => onCredito(v || null)}
        ayuda="Quién sacó la foto. Opcional."
      />
    </fieldset>
  )
}
