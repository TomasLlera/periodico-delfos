import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { PlanillaPartido } from '@/components/partido/PlanillaPartido'
import { tituloAccesible } from '@/lib/partido'
import { partidoDeLaFecha } from '@/app/demo/fixture/datos'
import { fixtureDemo } from '@/app/demo/temporada/datos-demo'

/**
 * La página entera de un partido del banco de pruebas: lo que se ve al recargar
 * con la ventana abierta, o al entrar sin JavaScript.
 *
 * Es la contraparte obligatoria de la ruta interceptada. Si esta página no
 * existiera, la ventana sería un modal disfrazado: una URL que sólo funciona
 * viniendo de otra página.
 */
export const metadata: Metadata = {
  title: 'Partido · banco de pruebas',
  robots: { index: false, follow: false },
}

export function generateStaticParams() {
  return fixtureDemo.map(({ slug }) => ({ slug }))
}

export default async function DemoPartidoDeFecha({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const partido = partidoDeLaFecha(slug)
  if (!partido) notFound()

  return (
    <>
      <Header temperatura={14} />

      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <p className="meta">Banco de pruebas</p>
        <h1 className="titular mt-2 text-[1.6rem] leading-tight md:text-[2rem]">
          {tituloAccesible(partido)}
        </h1>

        <p className="prose-nota mt-3 text-gris">
          Esto es la <strong>página</strong>, no la ventana: es lo que se ve al
          recargar o al entrar directo. La línea de tiempo es la planilla demo
          prestada y no se corresponde con el marcador.
        </p>

        <div className="mt-8">
          <PlanillaPartido partido={partido} variante="completa" nivelTitulo={2} />
        </div>

        <Link
          href="/demo/fixture"
          className="tactil mt-8 inline-flex items-center font-display text-[0.9rem] font-semibold text-verde-600 hover:underline"
        >
          Volver a la franja
        </Link>
      </main>

      <Footer />
    </>
  )
}
