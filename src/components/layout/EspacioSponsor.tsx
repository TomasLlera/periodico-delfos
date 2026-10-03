import type { Sponsor } from '@/types'

/**
 * Un espacio de publicidad propia.
 *
 * **Va rotulado como publicidad, siempre.** No es una decisión de diseño sino
 * de oficio: un medio que mezcla contenido con avisos pagos sin decir cuál es
 * cuál se gasta lo único que tiene para vender, que es que le crean. El rótulo
 * es chico y gris, pero está, y no se puede apagar desde el panel.
 *
 * **El link lleva `rel="sponsored"`.** Es lo que Google pide para los links
 * pagos; sin eso, un sitio que acumula enlaces comerciales sin marcar queda
 * expuesto a una penalización por esquemas de enlaces. Va junto con `nofollow`,
 * que es el que entienden los buscadores viejos.
 *
 * **La imagen lleva `alt` obligatorio** —lo exige la base con un CHECK, igual
 * que las fotos de las notas— y `width`/`height` para que el espacio quede
 * reservado antes de que cargue: un banner que aparece de golpe empuja el texto
 * que alguien está leyendo, que es la peor forma de cobrar un aviso.
 *
 * `loading="lazy"` salvo en el hueco de arriba de la portada, que entra en la
 * primera pantalla: ahí diferirlo lo haría aparecer tarde y empeoraría la
 * medición de LCP en vez de mejorarla.
 */
interface Props {
  sponsor: Sponsor
  /** El de arriba de la portada se carga enseguida; el resto, diferido. */
  prioridad?: boolean
  className?: string
}

/**
 * La medida que se le pide al anunciante para cada hueco, y que sirve para
 * reservar el espacio antes de que la imagen cargue.
 *
 * No la define la imagen sino el hueco, a proposito: si el anunciante manda una
 * pieza con otra proporcion igual se dibuja sin deformarse —el alto es `auto`—
 * pero el lugar que se reserva es el de la medida pedida, que es la que esta en
 * el mail que se les manda.
 */
const MEDIDA: Record<Sponsor['ubicacion'], { ancho: number; alto: number }> = {
  portada_arriba: { ancho: 728, alto: 90 },
  portada_entre_notas: { ancho: 728, alto: 90 },
  nota_lateral: { ancho: 300, alto: 250 },
}

export function EspacioSponsor({ sponsor, prioridad = false, className = '' }: Props) {
  const medida = MEDIDA[sponsor.ubicacion]

  const imagen = (
    // Un `<img>` y no `<ImagenResponsive>`: ese componente arma un `srcset` con
    // el transformador de Supabase para fotos de nota, y un banner es una
    // imagen sola, de ancho conocido, que el anunciante entrega ya medida.
    <img
      src={sponsor.imagen_url}
      alt={sponsor.alt}
      width={medida.ancho}
      height={medida.alto}
      loading={prioridad ? 'eager' : 'lazy'}
      className="h-auto w-full max-w-full"
    />
  )

  return (
    <aside
      aria-label={`Publicidad de ${sponsor.nombre}`}
      className={`flex flex-col gap-1 ${className}`.trimEnd()}
    >
      <p className="meta text-[0.65rem] text-text-muted">Publicidad</p>

      {sponsor.link ? (
        <a
          href={sponsor.link}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
          className="block border border-border transition-colors hover:border-accent"
        >
          {imagen}
        </a>
      ) : (
        <div className="border border-border">{imagen}</div>
      )}
    </aside>
  )
}
