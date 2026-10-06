'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { textoRequerido, type ResultadoEntidad } from '@/lib/entidades/campos'
import { esquemaDocumento } from '@/lib/tiptap/esquema'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'
import { createClient } from '@/lib/supabase/server'

/**
 * Guarda el texto de una página fija.
 *
 * **Sólo un editor.** Es el texto institucional del medio —quiénes son, cómo
 * trabajan—, no una nota firmada: no es una tarea de redacción. El `if` es
 * comodidad; lo que lo sostiene es `escritura_editor` sobre `paginas`
 * (`0018_paginas.sql`), porque esto es una ruta HTTP.
 *
 * **No crea páginas, sólo actualiza.** Cada fila corresponde a una ruta que
 * existe en `src/app/`, así que un `insert` desde acá dejaría un texto que
 * nadie puede ver. Si el slug no está en la base, es un error y se dice.
 *
 * **Revalida la ruta de la página y nada más.** No hace falta barrer el sitio:
 * lo que cambió se ve en un solo lugar.
 */
const esquemaPagina = z.object({
  titulo: textoRequerido('El título'),
  descripcion: textoRequerido('La descripción'),
  cuerpo: esquemaDocumento,
})

export async function guardarPagina(slug: string, datos: unknown): Promise<ResultadoEntidad> {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.' }
  if (autor.rol !== 'editor') return { error: 'Sólo un editor puede editar las páginas del sitio.' }

  const parseo = esquemaPagina.safeParse(datos)
  if (!parseo.success) {
    return { error: 'Faltan datos', motivos: parseo.error.issues.map((i) => i.message) }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('paginas')
    .update({ ...parseo.data, updated_at: new Date().toISOString() })
    .eq('slug', slug)
    .select('slug')
    .maybeSingle()

  if (error) return { error: 'No se pudo guardar la página.' }

  // `maybeSingle()` con cero filas devuelve `null` sin error: el slug no existe
  // en la base, o RLS no deja escribirlo. Desde afuera es lo mismo y las dos
  // cosas se arreglan igual, hablando con quien administra.
  if (!data) return { error: 'Esa página no existe en la base.' }

  revalidatePath(`/${slug}`)

  return { id: data.slug }
}
