'use server'

import { revalidatePath } from 'next/cache'
import { errorDeBase, type ResultadoEntidad } from '@/lib/entidades/campos'
import { esquemaSponsor } from '@/lib/entidades/sponsor'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'
import { createClient } from '@/lib/supabase/server'

/**
 * Alta, edición y baja de sponsors.
 *
 * **Sólo un editor**, y el `if` de acá es comodidad: lo que de verdad lo
 * sostiene es la política `gestion_editor` de `0016_sponsors.sql`, porque un
 * Server Action es una ruta HTTP y se puede llamar sin pasar por la pantalla.
 * Vender un espacio no es una tarea de redacción, así que un redactor no puede
 * ni crear ni editar un aviso.
 *
 * Con la sesión y nunca con la service role, como todo el panel.
 *
 * **Revalida la portada entera.** Un sponsor nuevo tiene que aparecer ya, y las
 * páginas donde van los huecos son ISR: sin esto, el anunciante que acaba de
 * pagar no ve su banner hasta que venza el cache, y el que llama es él.
 */
async function editorDeLaSesion() {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.' as const }
  if (autor.rol !== 'editor') return { error: 'Sólo un editor puede tocar los sponsors.' as const }
  return { autor }
}

export async function guardarSponsor(datos: unknown, id: string | null): Promise<ResultadoEntidad> {
  const sesion = await editorDeLaSesion()
  if ('error' in sesion) return { error: sesion.error }

  const parseo = esquemaSponsor.safeParse(datos)
  if (!parseo.success) {
    return { error: 'Faltan datos', motivos: parseo.error.issues.map((i) => i.message) }
  }

  const supabase = await createClient()
  const fila = { ...parseo.data, updated_at: new Date().toISOString() }

  const { data, error } = id
    ? await supabase.from('sponsors').update(fila).eq('id', id).select('id').single()
    : await supabase.from('sponsors').insert(fila).select('id').single()

  if (error) {
    return {
      error: error.message.includes('sponsors')
        ? 'No se pudo guardar. ¿Falta aplicar la migración 0016?'
        : errorDeBase(error, 'Ya hay un sponsor con esos datos'),
    }
  }

  revalidarDondeSeVe()

  return { id: data.id }
}

/**
 * Borra un sponsor.
 *
 * **Borrar no es lo que hay que hacer cuando una campaña termina** —para eso
 * están `hasta` y el interruptor de apagado, que dejan el registro de lo que se
 * publicó—, así que esto es para el que se cargó mal y nunca salió. La pantalla
 * lo dice antes de ofrecer el botón.
 */
export async function borrarSponsor(id: string): Promise<ResultadoEntidad> {
  const sesion = await editorDeLaSesion()
  if ('error' in sesion) return { error: sesion.error }

  const supabase = await createClient()
  const { error } = await supabase.from('sponsors').delete().eq('id', id)

  if (error) return { error: 'No se pudo borrar el sponsor.' }

  revalidarDondeSeVe()

  return {}
}

/**
 * Las rutas donde hay huecos.
 *
 * Es `'layout'` y no una lista de slugs: el hueco lateral va en todas las notas
 * y no se puede enumerar una por una. La portada entra por el mismo barrido.
 */
function revalidarDondeSeVe(): void {
  revalidatePath('/', 'layout')
}
