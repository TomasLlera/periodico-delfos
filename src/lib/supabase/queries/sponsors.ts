import { cache } from 'react'
import { createClient, createStaticClient, haySupabase } from '@/lib/supabase/server'
import type { Sponsor } from '@/types'

/**
 * Los sponsors que el sitio público puede mostrar.
 *
 * **Lee con `createStaticClient()` y no con `createClient()`.** Es la misma
 * razón que documenta `getEstadoDelSitio()`: `createClient()` pide las cookies,
 * y una sola lectura con cookies desde la portada o desde una nota vuelve
 * dinámicas rutas que hoy son ISR. Un banner no necesita saber quién mira.
 *
 * **Nunca tira.** Un error acá no puede voltear la portada: sin base, con la
 * query rota o con la tabla todavía sin migrar, devuelve la lista vacía y los
 * huecos no se dibujan. Es exactamente lo que tiene que pasar cuando no hay
 * nada vendido.
 *
 * **La vigencia la filtra RLS, no esta query** (ver `0016_sponsors.sql`): la
 * política de lectura pública ya deja afuera los vencidos y los que no
 * arrancaron. `sponsorsDeHueco()` vuelve a filtrar al dibujar, porque el panel
 * sí lee todo y comparte esos componentes.
 *
 * Memoizada por request: la portada la llama una vez por hueco y no tiene
 * sentido ir dos veces a la base por lo mismo.
 */
async function leerSponsors(): Promise<Sponsor[]> {
  if (!haySupabase()) return []

  try {
    const supabase = createStaticClient()
    const { data } = await supabase.from('sponsors').select('*')
    return (data as Sponsor[] | null) ?? []
  } catch {
    return []
  }
}

export const getSponsors = cache(leerSponsors)

/**
 * Todos los sponsors, para el panel: los vigentes, los programados y los
 * vencidos.
 *
 * Con la sesión, porque lo que habilita ver los que no están al aire es
 * `gestion_editor` sobre `sponsors`, que pide `es_editor()`. Un redactor que
 * llegue a esta query no ve más que lo que ve cualquier lector, y está bien
 * que así sea: vender un espacio no es una tarea de redacción.
 *
 * Ordenados por ubicación y después por `orden`, que es como se los mira:
 * hueco por hueco.
 */
export async function getSponsorsDelAdmin(): Promise<Sponsor[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('sponsors')
    .select('*')
    .order('ubicacion')
    .order('orden')
    .order('nombre')

  return (data as Sponsor[] | null) ?? []
}
