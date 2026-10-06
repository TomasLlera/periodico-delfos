import { cache } from 'react'
import { createClient, createStaticClient, haySupabase } from '@/lib/supabase/server'
import type { Pagina } from '@/types'

/**
 * El texto de una página fija.
 *
 * **Lee con `createStaticClient()`**, por lo mismo que `getEstadoDelSitio()` y
 * los sponsors: `createClient()` pide las cookies y volvería dinámica una ruta
 * que hoy es estática. "Quiénes somos" se ve igual para todos.
 *
 * **Nunca tira, y devuelve `null` si no está.** La página que la use tiene que
 * saber qué dibujar sin ella: entre que se despliega el código y se aplica la
 * migración hay una ventana donde la tabla no existe, y una página pública
 * —que además está linkeada desde el pie de todo el sitio— no puede ser un
 * error 500 en esa ventana.
 */
async function leerPagina(slug: string): Promise<Pagina | null> {
  if (!haySupabase()) return null

  try {
    const supabase = createStaticClient()
    const { data } = await supabase.from('paginas').select('*').eq('slug', slug).maybeSingle()
    return (data as Pagina | null) ?? null
  } catch {
    return null
  }
}

export const getPagina = cache(leerPagina)

/**
 * Las páginas que se pueden editar.
 *
 * **No hay alta ni baja**: cada fila corresponde a una ruta que existe en
 * `src/app/`, así que crear una desde el panel dejaría un texto que nadie puede
 * ver. El listado muestra lo que la base tiene y nada más.
 */
export async function getPaginasDelAdmin(): Promise<Pagina[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('paginas').select('*').order('titulo')
  return (data as Pagina[] | null) ?? []
}
