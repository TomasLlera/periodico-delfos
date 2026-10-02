import { urlEmbebidaDeYouTube } from '@/lib/tiptap/video'

/**
 * Un video de YouTube dentro del cuerpo de una nota.
 *
 * **El `<iframe>` va diferido (`loading="lazy"`).** Es la diferencia entre una
 * nota que pinta en un segundo y una que arrastra el reproductor de YouTube
 * entero antes de mostrar el primer párrafo. El Step 20 dejó medido el LCP de
 * las rutas principales y una nota con dos videos arriba lo tiraba abajo sola.
 *
 * **Dominio sin cookies.** Ver `urlEmbebidaDeYouTube()`: hasta que el sitio
 * tenga política de privacidad, un embed que rastrea al lector por abrir la
 * nota es justo lo que esa política tendría que declarar.
 *
 * **El `title` no es decorativo**: es lo único que un lector de pantalla
 * anuncia de un iframe. Sin él se lee "marco" y nada más. Lo escribe quien
 * inserta el video, porque YouTube no entrega el título sin pasar por su API y
 * sumar una clave más al proyecto por un texto no se justifica.
 *
 * La relación 16/9 la pone el contenedor y no el iframe: un iframe con alto
 * fijo deja franjas negras en celular, y uno sin alto colapsa a cero.
 */
interface Props {
  videoId: string
  titulo: string | null
}

export function VideoEmbebido({ videoId, titulo }: Props) {
  return (
    <figure className="my-6">
      <div className="relative aspect-video w-full overflow-hidden bg-bg-muted">
        <iframe
          src={urlEmbebidaDeYouTube(videoId)}
          title={titulo ?? 'Video de YouTube'}
          loading="lazy"
          // `allowFullScreen` y los permisos mínimos para que ande el
          // reproductor. Sin `encrypted-media` YouTube no reproduce nada.
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>

      {titulo && (
        <figcaption className="mt-2 font-display text-[0.8125rem] text-text-muted">
          {titulo}
        </figcaption>
      )}
    </figure>
  )
}
