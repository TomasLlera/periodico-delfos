import { feedRss } from '@/lib/rss'
import { getUltimasNotas } from '@/lib/supabase/queries/notas'
import { haySupabase } from '@/lib/supabase/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/**
 * El feed, en `/rss.xml`.
 *
 * El `<link rel="alternate">` del root layout ya apunta acá desde el Step 4, y
 * hasta ahora daba 404.
 *
 * Sin base devuelve un feed válido y vacío en lugar de un error: un lector de
 * feeds que recibe un 500 en la primera lectura puede dejar de reintentar.
 *
 * Se revalida cada hora. El feed no es la vía por la que alguien se entera de
 * una nota recién publicada —para eso está el auto-posteo a redes—, así que no
 * hace falta pagar una lectura por request.
 */
export const revalidate = 3600

export async function GET(): Promise<Response> {
  const notas = haySupabase() ? await getUltimasNotas({ limite: 20 }) : []

  return new Response(feedRss({ notas, urlSitio: SITE_URL }), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
