import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Ventana } from '@/components/layout/Ventana'
import { PlanillaPartido } from '@/components/partido/PlanillaPartido'
import { tituloAccesible } from '@/lib/partido'
import { partidoDeLaFecha } from '@/app/demo/fixture/datos'

/**
 * La ventana del banco de pruebas: la copia demo de
 * `src/app/@modal/(.)partido/[slug]/page.tsx`, con los mismos componentes.
 *
 * Lo único que cambia es de dónde salen los datos —del fixture demo y no de la
 * base— y a dónde apunta el link del pie. El mecanismo que se está probando
 * —interceptar, `<Ventana />`, cerrar con `router.back()`— es exactamente el
 * mismo código.
 */
export default async function VentanaDemo({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const partido = partidoDeLaFecha(slug)
  if (!partido) notFound()

  return (
    <Ventana titulo={tituloAccesible(partido)}>
      <PlanillaPartido partido={partido} variante="completa" nivelTitulo={3} />

      <Link
        href={`/demo/fixture/${partido.slug}`}
        className="tactil mt-6 flex items-center justify-center rounded border border-linea font-display text-[0.9rem] font-semibold text-verde-600 transition-colors hover:bg-papel-alt"
      >
        Ver la ficha completa del partido
      </Link>
    </Ventana>
  )
}
