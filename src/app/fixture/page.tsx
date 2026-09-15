import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { SinTemporada } from '@/components/layout/SinTemporada'
import { getTemporadaActiva } from '@/lib/supabase/queries/temporadas'
import { haySupabase } from '@/lib/supabase/server'

/**
 * `/fixture` es la puerta corta a la temporada en curso.
 *
 * El blueprint (7.1) tiene la ruta scopeada por temporada —`/temporada/[slug]`—
 * pero la navegación no puede linkear a un slug que cambia cada año: si la nav
 * apuntara a `/temporada/primera-b-2026`, en 2027 habría que editarla y todos
 * los links viejos quedarían apuntando a la temporada equivocada. Esta ruta
 * resuelve la temporada activa y redirige.
 *
 * Mientras no haya temporada cargada no tira 404 —está en el menú de todas las
 * páginas— sino que explica qué falta.
 */
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Fixture y tabla',
  description: 'El fixture, la tabla de posiciones y las goleadoras de la temporada en curso.',
}

export default async function Fixture() {
  const temporada = haySupabase() ? await getTemporadaActiva() : null

  if (temporada) redirect(`/temporada/${temporada.slug}`)

  return (
    <>
      <Header />
      <SinTemporada
        titulo="Fixture y tabla"
        explicacion="Todavía no hay una temporada cargada. Cuando esté, acá van el fixture completo, la tabla de posiciones y las goleadoras, y se actualizan solos con cada planilla de partido que se carga."
      />
      <Footer />
    </>
  )
}
