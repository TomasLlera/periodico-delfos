/**
 * Imagen servida por el transformador de Supabase Storage.
 *
 * Es un <img> con srcset y no next/image a propósito: Supabase ya entrega WebP
 * en el ancho pedido, así que pasarlo además por el optimizador de Next sería
 * transformar dos veces la misma imagen y pagar el doble de latencia.
 *
 * `alt` es obligatorio en el tipo. La base también lo exige (constraint
 * `alt_requerido` en 0005_notas.sql): que no haya forma de publicar una imagen
 * sin describirla es una regla del proyecto, no una preferencia.
 */

import { srcSetTransformado, urlTransformada } from '@/lib/imagen'

interface Props {
  src: string
  alt: string
  /** Epígrafe. Si viene, la imagen se envuelve en <figure>. */
  epigrafe?: string | null
  credito?: string | null
  /** La del hero no se carga diferida: es el LCP. */
  prioridad?: boolean
  /** Anchos de viewport que ocupa la imagen. */
  sizes?: string
  className?: string
  ancho?: number
  alto?: number
}

export function ImagenResponsive({
  src,
  alt,
  epigrafe,
  credito,
  prioridad = false,
  sizes = '(min-width: 1024px) 800px, 100vw',
  className,
  ancho = 1600,
  alto,
}: Props) {
  const imagen = (
    <img
      src={urlTransformada(src, 800)}
      // Sin `srcSet` cuando la imagen no la sirve el bucket: la elegida y
      // todavía no subida es un `blob:`, que con `?width=` no carga.
      srcSet={srcSetTransformado(src)}
      sizes={sizes}
      alt={alt}
      width={ancho}
      height={alto}
      loading={prioridad ? 'eager' : 'lazy'}
      fetchPriority={prioridad ? 'high' : 'auto'}
      decoding={prioridad ? 'sync' : 'async'}
      className={className ?? 'w-full h-auto'}
    />
  )

  if (!epigrafe && !credito) return imagen

  return (
    <figure className="my-6">
      {imagen}
      <figcaption className="mt-2 font-display text-[13px] leading-snug text-gris">
        {epigrafe}
        {credito && (
          <span className="ml-1 italic">
            {epigrafe ? '· ' : ''}
            {credito}
          </span>
        )}
      </figcaption>
    </figure>
  )
}
