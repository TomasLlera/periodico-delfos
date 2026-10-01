import { ArrowUpRight } from 'lucide-react'
import { LogoDeRed } from '@/components/layout/LogoDeRed'
import { NOMBRE_DE_RED } from '@/lib/logos-redes'
import type { RedDePosteo } from '@/lib/tiptap/posteo'

/**
 * Un posteo de Instagram o de X citado en el cuerpo de una nota.
 *
 * **No carga nada de la plataforma.** Ni script, ni iframe, ni una imagen
 * servida por un tercero: es markup del sitio con los tokens del sitio. Por qué
 * no es el embed oficial está contado en `lib/tiptap/posteo.ts`, y el motivo
 * que manda es que el embed desaparece si borran el posteo y deja un hueco en
 * una nota vieja. Esto sigue diciendo lo mismo dentro de dos años.
 *
 * **La estructura es `figure` + `blockquote` + `figcaption`**, que es la forma
 * en que HTML atribuye una cita: el texto citado va adentro del `blockquote`
 * —con `cite` apuntando al original— y quién lo dijo va **afuera**, en el
 * `figcaption`. Un `<cite>` adentro del `blockquote` sería parte de la cita, es
 * decir que el posteo se citó a sí mismo.
 *
 * El logo de la red es decorativo (`aria-hidden`, lo pone `<LogoDeRed />`): el
 * nombre de la plataforma está escrito al lado, y un lector de pantalla que
 * anuncia "Instagram" dos veces no agrega nada.
 */
interface Props {
  red: RedDePosteo
  url: string
  /** El handle, sin arroba: la pone este componente. */
  usuario: string
  texto: string
}

export function PosteoCitado({ red, url, usuario, texto }: Props) {
  const nombre = NOMBRE_DE_RED[red]

  return (
    <figure className="posteo my-6 border border-border bg-bg-elevated p-4">
      <div className="meta flex items-center gap-2">
        <LogoDeRed clave={red} size={14} />
        {nombre}
      </div>

      <blockquote cite={url} className="mt-3">
        <p>{texto}</p>
      </blockquote>

      {/* El pie hereda de `.prose-nota figure figcaption`: 13px, tipografía de
          titulares y gris. Es el mismo pie que el de una foto del cuerpo, a
          propósito — las dos cosas son una atribución. */}
      <figcaption className="mt-3 flex flex-wrap items-baseline gap-x-2">
        <span className="font-bold">@{usuario}</span>

        <a
          href={url}
          target="_blank"
          // `nofollow` además de `noopener`: es un link a contenido de un
          // tercero que el medio cita, no una recomendación del sitio.
          rel="noopener noreferrer nofollow"
          className="inline-flex items-baseline gap-1"
        >
          Ver el posteo en {nombre}
          <ArrowUpRight size={13} aria-hidden="true" className="translate-y-px" />
          <span className="sr-only"> (se abre en una pestaña nueva)</span>
        </a>
      </figcaption>
    </figure>
  )
}
