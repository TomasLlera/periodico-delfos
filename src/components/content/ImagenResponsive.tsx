/**
 * Imagen optimizada por Next, con epígrafe y crédito opcionales.
 *
 * **Era un `<img>` con `srcSet` armado contra el transformador de Supabase
 * Storage, y se cambió porque ese transformador se cayó.**
 * `/storage/v1/render/image/` es una función de plan pago: cuando dejó de estar
 * habilitada empezó a contestar `403 FeatureNotEnabled` con un JSON, y como esa
 * URL iba en el `src`, **todas las imágenes del sitio desaparecieron a la vez**
 * sin un error en consola que lo explicara. El arreglo inmediato fue servir el
 * original del bucket; esto es el definitivo.
 *
 * El comentario que estaba acá decía que pasar por Next sería "transformar dos
 * veces la misma imagen". Era cierto mientras Supabase transformaba: ahora no
 * transforma nadie, así que el original de 406 KB viajaba entero a un celular.
 * El optimizador de Next hace lo mismo que hacía Supabase —redimensiona y
 * entrega WebP— y ya estaba configurado en `next.config.ts` (`remotePatterns`
 * para el bucket y `formats: ['image/webp']`), esperando que alguien lo usara.
 *
 * **`unoptimized` para las URLs locales, y es la razón por la que `esUrlLocal()`
 * sigue existiendo.** La vista previa del editor muestra la imagen que se eligió
 * y todavía no se subió: un `blob:` que sólo existe en ese navegador. El
 * optimizador corre en el servidor y no puede ir a buscarlo, así que esas pasan
 * derecho. Era el mismo motivo por el que antes no llevaban `srcSet`.
 *
 * `alt` es obligatorio en el tipo. La base también lo exige (constraint
 * `alt_requerido` en 0005_notas.sql): que no haya forma de publicar una imagen
 * sin describirla es una regla del proyecto, no una preferencia.
 */

import Image from 'next/image'
import { esUrlLocal } from '@/lib/imagen'

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
  alto = 900,
}: Props) {
  const imagen = (
    <Image
      src={src}
      alt={alt}
      sizes={sizes}
      width={ancho}
      height={alto}
      priority={prioridad}
      // 75 es el valor que ya venía pidiéndole el sitio a Supabase
      // (`?quality=75`). Se deja explícito para que el cambio de servidor de
      // imágenes no cambie además la calidad.
      quality={75}
      unoptimized={esUrlLocal(src)}
      // **`width` y `alto` acá no deciden cómo se ve la imagen**: todos los que
      // usan este componente le pasan el recorte por `className` —`aspect-[4/5]
      // w-full object-cover`— y esas clases ganan. Las dimensiones están porque
      // `next/image` las exige para reservar el espacio y para calcular el
      // `srcset`, y 1600×900 es el ancho máximo que el sitio venía pidiendo.
      className={className ?? 'w-full h-auto'}
    />
  )

  if (!epigrafe && !credito) return imagen

  return (
    <figure className="my-6">
      {imagen}
      <figcaption className="mt-2 font-display text-[13px] leading-snug text-text-muted">
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
