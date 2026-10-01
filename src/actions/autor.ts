'use server'

import { revalidatePath } from 'next/cache'
import { esquemaAutor, handleLimpio } from '@/lib/entidades/autor'
import { errorDeBase, type ResultadoEntidad } from '@/lib/entidades/campos'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'
import { createClient } from '@/lib/supabase/server'

/**
 * El perfil del autor de la sesión.
 *
 * **Edita siempre la fila de quien está logueado, y el id no es un parámetro.**
 * Es la diferencia con el resto de los Server Actions del panel: equipos,
 * jugadoras y partidos reciben el id de lo que se edita, pero un perfil que
 * acepta un id ajeno es una pantalla para editar el perfil de otro. Mientras el
 * medio lo escriba una sola persona daría igual, y justamente por eso conviene
 * cerrarlo ahora: el pedido de Charlie incluye dar de alta colaboradores más
 * adelante.
 *
 * Con la sesión del autor y no con la service role, como todo el panel: lo que
 * habilita la escritura es RLS sobre `autores` en `0008_rls.sql`.
 *
 * Revalida las rutas donde sale la firma. La caja de autor va al pie de cada
 * nota, así que cambiar la bio sin revalidar deja la vieja hasta que venza el
 * ISR de 60s en cada una.
 */
export async function guardarPerfil(datos: unknown): Promise<ResultadoEntidad> {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.' }

  const validado = esquemaAutor.safeParse(datos)
  if (!validado.success) {
    return { error: validado.error.issues[0]?.message ?? 'Hay un campo mal cargado.' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('autores')
    .update({
      nombre: validado.data.nombre,
      bio: validado.data.bio,
      foto_url: validado.data.foto_url,
      instagram: handleLimpio(validado.data.instagram),
      x_handle: handleLimpio(validado.data.x_handle),
    })
    .eq('id', autor.id)

  if (error) return { error: errorDeBase(error, 'Ese nombre ya está usado por otra cuenta.') }

  revalidatePath('/', 'layout')

  return {}
}
