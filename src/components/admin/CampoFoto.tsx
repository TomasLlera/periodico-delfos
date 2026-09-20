'use client'

import { ImagePlus, X } from 'lucide-react'
import { TIPOS_IMAGEN } from '@/lib/imagen'

/**
 * La foto de una jugadora: elegirla, verla y sacarla.
 *
 * Es el pariente chico de `CampoImagen`, que es la portada de una nota. Son dos
 * y no uno porque aquélla lleva pegados el texto alternativo y el crédito
 * —obligatorios por la regla no negociable 4, y pedidos al lado de la foto para
 * que se escriban mirándola—, y la foto de una jugadora no los tiene: el alt lo
 * arma el sitio con su nombre, que es lo único que se puede decir de un retrato
 * de plantel, y escribirlo treinta veces sería treinta veces la misma frase.
 *
 * **El archivo no se sube acá.** Se reporta hacia arriba y se sube al guardar,
 * igual que la portada: probar tres fotos y cerrar sin guardar no deja tres
 * archivos huérfanos en el bucket.
 */

interface Props {
  /** La que ya está en la base, si la hay. */
  urlGuardada: string | null
  /** El `blob:` de la elegida y todavía sin subir. */
  urlLocal: string | null
  nombre: string
  onArchivo: (archivo: File | null) => void
}

export function CampoFoto({ urlGuardada, urlLocal, nombre, onArchivo }: Props) {
  const aMostrar = urlLocal ?? urlGuardada

  return (
    <fieldset className="flex flex-col gap-3 border border-linea bg-tarjeta p-4">
      <legend className="meta px-1 text-gris">Foto</legend>

      {aMostrar && (
        <div className="flex items-start gap-3">
          {/* Un <img> pelado: es una miniatura de control, no contenido del
              sitio. La que se mira de verdad está en `/plantel`. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={aMostrar}
            alt={nombre.trim() ? `Foto de ${nombre}` : 'La foto elegida'}
            className="size-24 border border-linea object-cover"
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
        htmlFor="foto"
        className="tactil flex cursor-pointer items-center gap-2 self-start border border-linea-fuerte px-4 font-display text-[0.9rem] font-bold hover:bg-papel-alt"
      >
        <ImagePlus size={16} aria-hidden="true" />
        {aMostrar ? 'Cambiar foto' : 'Elegir foto'}
      </label>
      <input
        id="foto"
        type="file"
        accept={TIPOS_IMAGEN.join(',')}
        onChange={(e) => onArchivo(e.target.files?.[0] ?? null)}
        className="sr-only"
      />

      <p className="text-[0.8rem] text-gris">
        Opcional. Sin foto, el plantel dibuja las iniciales.
      </p>
    </fieldset>
  )
}
