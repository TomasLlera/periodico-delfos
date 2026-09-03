import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente para componentes del navegador (`"use client"`).
 *
 * La anon key es pública por diseño y viaja en el bundle. Lo que impide leer
 * borradores o escribir cualquier cosa es RLS (ver 0008_rls.sql), no el hecho
 * de esconder la clave.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
