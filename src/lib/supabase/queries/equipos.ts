import { createClient } from '@/lib/supabase/server'
import type { Equipo } from '@/types'

/**
 * Los equipos: el propio y todos los rivales del campeonato.
 *
 * Es el catálogo del que cuelgan los partidos y la tabla de posiciones, así que
 * se lee entero: veinte filas de siete columnas no justifican paginar ni pedir
 * campos sueltos.
 *
 * El orden pone a Aldosivi primero y después alfabético. En el `<select>` de un
 * partido, el equipo propio es el que se elige en la mitad de los casos —juega
 * todos los partidos— y tenerlo arriba ahorra el scroll.
 */
export async function getEquipos(): Promise<Equipo[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('equipos')
    .select('*')
    .order('es_aldosivi', { ascending: false })
    .order('nombre_corto', { ascending: true })

  return data ?? []
}

export async function getEquipoPorId(id: string): Promise<Equipo | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('equipos').select('*').eq('id', id).maybeSingle()

  return data
}

/**
 * El equipo propio. Hay un índice único que garantiza que sea uno solo.
 *
 * Devuelve `null` en una base recién creada, antes del `seed.sql`. Las
 * pantallas que lo usan —el alta de equipo, para avisar a quién le sacan la
 * marca— tienen que aguantar ese caso en vez de asumir que existe.
 */
export async function getEquipoAldosivi(): Promise<Equipo | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('equipos')
    .select('*')
    .eq('es_aldosivi', true)
    .maybeSingle()

  return data
}
