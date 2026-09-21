'use server'

import { revalidatePath } from 'next/cache'
import { inngest, notaPublicada } from '@/lib/inngest/client'
import type { ResultadoEntidad } from '@/lib/entidades/campos'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'
import { createClient } from '@/lib/supabase/server'

/**
 * Reintentar los posteos de una nota.
 *
 * **Esta action no escribe `social_posts`, y es a propósito.** No hay política
 * de RLS que deje a un autor escribir esa tabla: la escribe Inngest con la
 * service role, que es donde vive la idempotencia. Si el panel la editara a
 * mano habría dos lugares decidiendo el estado de un posteo, y el segundo
 * siempre termina contradiciendo al primero.
 *
 * Lo que hace es volver a emitir `nota/publicada` con `forzado: true`. La
 * función durable vuelve a mirar el estado real y decide: destraba lo que quedó
 * en `processing`, reintenta lo que falló aunque haya agotado los intentos, y
 * **no toca lo que ya se publicó**. Eso último no se puede deshacer desde acá
 * ni desde ningún lado.
 */
export async function reintentarPosteos(notaId: string): Promise<ResultadoEntidad> {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.' }

  // El slug se lee de la base y no llega del navegador: entra al evento y a
  // los logs de Inngest, y es lo que se mira cuando algo sale mal.
  const supabase = await createClient()
  const { data: nota } = await supabase
    .from('notas')
    .select('slug, estado')
    .eq('id', notaId)
    .maybeSingle()

  if (!nota) return { error: 'Esa nota ya no existe' }

  // Postear una nota que volvió a borrador publicaría en las redes algo que el
  // sitio no muestra. La función durable lo vuelve a chequear igual.
  if (nota.estado !== 'publicada') {
    return { error: 'La nota no está publicada: volvé a publicarla antes de postear' }
  }

  try {
    await inngest.send(notaPublicada.create({ notaId, slug: nota.slug, forzado: true }))
  } catch {
    return {
      error:
        'No se pudo avisarle a la cola de posteos. Si estás en local, falta levantar `npx inngest-cli dev`.',
    }
  }

  revalidatePath('/admin/posteos')

  return { id: notaId }
}
