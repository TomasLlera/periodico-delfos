import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { SinTemporada } from '@/components/layout/SinTemporada'
import { getTemporadaActiva } from '@/lib/supabase/queries/temporadas'
import { haySupabase } from '@/lib/supabase/server'

/**
 * `/plantel` es la puerta corta al plantel de la temporada en curso.
 *
 * El blueprint (7.1) tiene la ruta scopeada por temporada —`/plantel/[temporadaSlug]`—
 * pero la navegación no puede linkear a un slug que cambia cada año: si la nav
 * apuntara a `/plantel/primera-b-2026`, en 2027 habría que editarla y todos
 * los links viejos quedarían apuntando a la temporada equivocada. Esta ruta
 * resuelve la temporada activa y redirige.
 *
 * Mientras no haya temporada cargada no tira 404 —está en el menú de todas las
 * páginas— sino que explica qué falta.
 */
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Plantel',
  description: 'Las jugadoras de Aldosivi en la temporada en curso, con sus fichas y estadísticas.',
}

export default async function Plantel() {
  const temporada = haySupabase() ? await getTemporadaActiva() : null

  if (temporada) redirect(`/plantel/${temporada.slug}`)

  return (
    <>
      <Header />
      <SinTemporada
        titulo="Plantel"
        explicacion="Todavía no hay una temporada cargada. Cuando esté, acá va el plantel agrupado por puesto, con la ficha de cada jugadora: partidos, goles y minutos de la temporada."
      />
      <Footer />
    </>
  )
}
