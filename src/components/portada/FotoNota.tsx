import { ImagenResponsive } from '@/components/content/ImagenResponsive'

/**
 * La foto de una nota en la portada, con su reemplazo cuando no hay.
 *
 * El hueco existe porque hace falta de verdad: de las 70 notas que trajo la
 * migración, varias no tienen imagen de portada, y una tarjeta que colapsa
 * cuando falta la foto desarma la grilla entera. El boceto ya lo previó — son
 * sus bloques `.ph` — así que esto no es un placeholder de desarrollo: es el
 * estado real de una nota sin foto.
 *
 * `alt=""` cuando la tarjeta entera ya es un link con su título: repetir el
 * texto alternativo obliga a un lector de pantalla a escuchar lo mismo dos
 * veces por tarjeta.
 */
interface Props {
  src: string | null
  alt: string
  /** Relación de aspecto, como utilidad de Tailwind. */
  aspecto: string
  sizes?: string
  /** La de la tapa es el LCP y no se carga diferida. */
  prioridad?: boolean
  /** `oscuro` va adentro de los bloques verdes; `claro`, sobre el crema. */
  variante?: 'claro' | 'oscuro'
}

export function FotoNota({
  src,
  alt,
  aspecto,
  sizes,
  prioridad = false,
  variante = 'claro',
}: Props) {
  if (src) {
    return (
      <ImagenResponsive
        src={src}
        alt={alt}
        sizes={sizes}
        prioridad={prioridad}
        className={`${aspecto} w-full object-cover`}
      />
    )
  }

  // Las rayas son las del boceto. Van en `currentColor` con alfa para que el
  // bloque funcione en los dos temas sin declarar un color nuevo.
  return (
    <div
      aria-hidden="true"
      className={`${aspecto} w-full ${
        variante === 'oscuro'
          ? 'bg-verde-600/25 text-white/10'
          : 'bg-papel-alt text-tinta/10'
      }`}
      style={{
        backgroundImage:
          'repeating-linear-gradient(135deg, transparent 0 14px, currentColor 14px 15px)',
      }}
    />
  )
}
