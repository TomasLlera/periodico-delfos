import { createClient } from '@/lib/supabase/server'
import type { SocialPost } from '@/types'

/**
 * Los posteos a las redes, para el panel.
 *
 * **Se leen con la sesión del autor, no con la service role.** La política
 * `lectura_autor` de `0008_rls.sql` habilita el `select` a quien tenga fila en
 * `autores`, que es exactamente quien mira esta pantalla. El cliente de
 * `supabase/admin.ts` es para escribir desde Inngest, donde no hay usuario;
 * usarlo acá convertiría una pantalla de lectura en una puerta que bypassea
 * RLS sin necesidad.
 *
 * Esa política es también la razón de que el panel **no pueda escribir** esta
 * tabla: no hay política de escritura para autores, a propósito. Reintentar un
 * posteo no es editar la fila a mano, es volver a disparar el pipeline.
 */

export interface PosteoConNota extends SocialPost {
  nota: { titulo: string; slug: string; estado: string } | null
}

/**
 * Los últimos posteos, el más reciente primero, con el título de su nota.
 *
 * Trae el título porque el registro guarda el slug pero no el título, y
 * "goleada-en-el-minella" es peor para reconocer una nota que "Goleada en el
 * Minella". El slug se guarda igual en `social_posts` a propósito: si la nota
 * se borra, el registro del posteo sobrevive diciendo de qué era.
 */
export async function getPosteos(limite = 60): Promise<PosteoConNota[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('social_posts')
    .select('*, nota:notas(titulo, slug, estado)')
    .order('updated_at', { ascending: false })
    .limit(limite)

  return (data ?? []) as unknown as PosteoConNota[]
}

/** Los de una nota, para mostrarlos en su editor. */
export async function getPosteosDeNota(notaId: string): Promise<SocialPost[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('social_posts')
    .select('*')
    .eq('nota_id', notaId)

  return (data ?? []) as SocialPost[]
}
