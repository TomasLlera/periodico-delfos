'use server'

import { revalidatePath } from 'next/cache'
import { minutoValido } from '@/lib/planilla'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'
import { createClient } from '@/lib/supabase/server'
import type { TipoEvento } from '@/types'

/**
 * Cargar y borrar eventos de un partido, y darlo por finalizado.
 *
 * **Cada evento se guarda apenas se carga**, no al final. El blueprint § 7.6
 * pide autoguardado y la razón es concreta: Charlie carga desde la tribuna, con
 * el celular y señal mala. Un formulario que guarda todo junto al final pierde
 * el partido entero cuando se corta.
 *
 * La cola offline en IndexedDB que el blueprint también pide **no está todavía**
 * —ver `HANDOFF.md`—. Sin ella, un evento cargado sin señal se pierde y la
 * pantalla lo avisa; con ella, esperaría en el teléfono y subiría solo. Es el
 * siguiente paso de esta pantalla.
 */

export interface ResultadoEvento {
  id?: string
  error?: string
}

/** Lo que manda la pantalla. Todo lo demás lo pone el servidor. */
export interface EventoNuevo {
  partido_id: string
  tipo: TipoEvento
  minuto: number
  adicionado: number
  equipo_id: string
  /** Una jugadora nuestra. `null` si el evento es del rival. */
  jugadora_id: string | null
  /** El nombre escrito a mano, para las del rival. */
  jugadora_nombre: string | null
  jugadora_sale_id: string | null
}

export async function agregarEvento(evento: EventoNuevo): Promise<ResultadoEvento> {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.' }

  // Los mismos límites que el CHECK de `0003_partidos_eventos.sql`. Se repiten
  // acá para que el error llegue en castellano y no como un 400 de Postgres.
  if (!minutoValido(evento.minuto)) return { error: 'El minuto tiene que estar entre 0 y 120' }
  if (!evento.jugadora_id && !evento.jugadora_nombre) {
    return { error: 'Falta decir quién: elegí una jugadora o escribí el nombre' }
  }
  if (evento.tipo === 'cambio' && !evento.jugadora_sale_id) {
    return { error: 'Un cambio sin quién sale no es un cambio' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('eventos')
    .insert(evento)
    .select('id')
    .single()

  if (error) return { error: 'No se pudo guardar el evento' }

  revalidatePath(`/admin/partidos/${evento.partido_id}/planilla`)

  return { id: data.id }
}

export async function borrarEvento(id: string, partidoId: string): Promise<ResultadoEvento> {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.' }

  const supabase = await createClient()
  const { error } = await supabase.from('eventos').delete().eq('id', id)

  if (error) return { error: 'No se pudo borrar' }

  revalidatePath(`/admin/partidos/${partidoId}/planilla`)

  return { id }
}

/**
 * Da el partido por finalizado con el marcador que salió de los eventos.
 *
 * **El resultado no se escribe a mano acá**: se toma el que contaron los goles
 * cargados. Es la única forma de que el marcador del sitio y la planilla no
 * puedan contradecirse, que es el problema que este proyecto vino a resolver.
 * Si el número no es el que Charlie esperaba, lo que falta es cargar un gol, no
 * corregir el marcador.
 *
 * Revalida las rutas públicas porque el resultado aparece en la portada, en la
 * franja de resultados y en la ficha del partido.
 */
export async function finalizarPartido(
  partidoId: string,
  marcador: { local: number; visitante: number },
): Promise<ResultadoEvento> {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('partidos')
    .update({
      estado: 'finalizado' as const,
      goles_local: marcador.local,
      goles_visitante: marcador.visitante,
    })
    .eq('id', partidoId)
    .select('id, slug')
    .single()

  if (error) return { error: 'No se pudo finalizar el partido' }

  revalidatePath('/')
  revalidatePath('/fixture')
  revalidatePath(`/partido/${data.slug}`)
  revalidatePath(`/admin/partidos/${partidoId}/planilla`)

  return { id: data.id }
}
