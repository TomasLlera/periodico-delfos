import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { NOMBRE_RED } from '@/lib/social/fanout'
import { hace } from '@/lib/formato'
import type { PosteoConNota } from '@/lib/supabase/queries/social'

/**
 * Un posteo en el listado del panel.
 *
 * El estado se dice con palabra y con color, como el de las notas en
 * `FilaNota`: "Falló" escrito es lo que hace que la fila se entienda en una
 * captura en blanco y negro o leída por un lector de pantalla.
 *
 * **Un posteo simulado se marca como tal aunque esté en `success`.** El
 * pipeline funcionó —por eso es `success`— pero no se publicó nada, y confundir
 * las dos cosas es creer que una nota salió en Facebook cuando no salió. El
 * mensaje lo pone `marcarExito()` y acá se lo mira, no se lo adivina.
 */

const ESTILO_ESTADO = {
  pending: 'bg-papel-alt text-gris',
  processing: 'bg-amarillo text-negro-cancha',
  success: 'bg-verde-900 text-white',
  failed: 'bg-roja text-white',
} as const

const NOMBRE_ESTADO = {
  pending: 'Pendiente',
  processing: 'En curso',
  success: 'Posteado',
  failed: 'Falló',
} as const

function esSimulado(posteo: PosteoConNota): boolean {
  return posteo.external_post_id?.startsWith('simulado-') === true
}

export function FilaPosteo({ posteo }: { posteo: PosteoConNota }) {
  const simulado = esSimulado(posteo)

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-linea py-3">
      <span className={`meta px-2 py-0.5 ${ESTILO_ESTADO[posteo.status]}`}>
        {NOMBRE_ESTADO[posteo.status]}
      </span>

      <span className="meta text-gris">{NOMBRE_RED[posteo.platform]}</span>

      {posteo.nota ? (
        <Link
          href={`/nota/${posteo.nota.slug}`}
          target="_blank"
          className="font-display text-[0.95rem] font-bold underline-offset-4 hover:underline"
        >
          {posteo.nota.titulo}
        </Link>
      ) : (
        // La nota se borró y el registro quedó: por eso `social_posts` guarda
        // el slug además del id.
        <span className="font-display text-[0.95rem] font-bold text-gris">
          {posteo.nota_slug} (nota borrada)
        </span>
      )}

      {simulado && (
        <span className="meta border border-linea-fuerte px-2 py-0.5 text-gris">Simulado</span>
      )}

      <span className="ml-auto flex items-center gap-3 text-[0.85rem] text-gris">
        {posteo.attempts > 1 && <span>{posteo.attempts} intentos</span>}
        <span>{hace(posteo.updated_at)}</span>

        {posteo.external_url && (
          <Link
            href={posteo.external_url}
            target="_blank"
            className="tactil flex items-center gap-1 hover:underline"
          >
            Ver
            <ExternalLink size={14} aria-hidden="true" />
          </Link>
        )}
      </span>

      {/* El motivo ocupa su propia línea: en un fallo es lo que hay que leer, y
          al costado de tres badges no se lee. */}
      {posteo.error_message && !simulado && (
        <p className="w-full text-[0.85rem] text-roja">{posteo.error_message}</p>
      )}
    </li>
  )
}
