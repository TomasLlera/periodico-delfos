import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Ventana } from '@/components/layout/Ventana'
import { PlanillaPartido } from '@/components/partido/PlanillaPartido'
import { tituloAccesible } from '@/lib/partido'
import { getPartidoPorSlug } from '@/lib/supabase/queries/partidos'
import { haySupabase } from '@/lib/supabase/server'

/**
 * La planilla de un partido, abierta como ventana encima de la página que se
 * estaba mirando. Es la ruta interceptada de `/partido/[slug]`.
 *
 * **El chip de la franja sigue siendo un link normal.** Esta carpeta —`@modal`
 * más `(.)partido`— es lo único que hace que ese link, cuando se lo aprieta
 * desde adentro del sitio, abra una ventana en vez de navegar. Todo lo demás
 * sigue funcionando como antes:
 *
 * - **Sin JavaScript** no hay interceptación: el link navega a la página
 *   entera. Es la razón por la que no se hizo con un botón y un modal de
 *   cliente.
 * - **Recargar con la ventana abierta** muestra la página entera, porque la URL
 *   ya es la del partido. No hay dos URLs para la misma cosa.
 * - **Compartir el link** desde la ventana manda a la página del partido, que
 *   es la que tiene la metadata y el JSON-LD `SportsEvent`.
 * - **El botón de atrás** cierra la ventana, sin recargar la página de abajo.
 *
 * El contenido es la misma `<PlanillaPartido variante="completa" />` que usa
 * `/partido/[slug]`: la ventana no es un diseño aparte, es la misma planilla en
 * otro contenedor.
 */
export default async function VentanaDePartido({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Sin base no hay partido que mostrar, y la página de abajo tampoco existe.
  if (!haySupabase()) notFound()

  const partido = await getPartidoPorSlug(slug)
  if (!partido) notFound()

  return (
    <Ventana titulo={tituloAccesible(partido)}>
      {/* `nivelTitulo={3}` y no 2: el `<h2>` de la ventana ya lo pone
          `<Ventana />` con el nombre del partido, y la planilla cuelga de él. */}
      <PlanillaPartido partido={partido} variante="completa" nivelTitulo={3} />

      <Link
        href={`/partido/${partido.slug}`}
        className="tactil mt-6 flex items-center justify-center rounded border border-linea font-display text-[0.9rem] font-semibold text-verde-600 transition-colors hover:bg-papel-alt"
      >
        Ver la ficha completa del partido
      </Link>
    </Ventana>
  )
}
