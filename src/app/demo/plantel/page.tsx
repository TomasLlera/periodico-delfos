import type { Metadata } from 'next'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { GrillaPlantel } from '@/components/plantel/GrillaPlantel'
import { plantelDemo, temporadaDemo } from '@/app/demo/temporada/datos-demo'

/**
 * El plantel agrupado por puesto, con datos falsos.
 *
 * Ninguna de las jugadoras de la demo tiene foto, que es justamente el caso
 * que hay que mirar: es el estado real de hoy y el que desarma la grilla si el
 * respaldo no reserva el mismo alto que la foto.
 *
 * No se indexa y no llega a producción.
 */
export const metadata: Metadata = {
  title: 'Plantel · banco de pruebas',
  robots: { index: false, follow: false },
}

export default function DemoPlantel() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <p className="meta">Banco de pruebas · datos falsos</p>
        <h1 className="mt-2 font-display text-[30px] font-bold leading-[1.1] tracking-[-0.02em] md:text-[44px]">
          El plantel
        </h1>
        <p className="prose-nota mt-4 text-gris">
          Esta página no se indexa y no llega a producción. Las jugadoras son
          inventadas. En la página real cada tarjeta lleva a la ficha de la
          jugadora, con sus estadísticas y sus goles.
        </p>

        <div className="mt-12">
          <GrillaPlantel plantel={plantelDemo} />
        </div>

        <p className="meta mt-12">{temporadaDemo.nombre}</p>
      </main>

      <Footer />
    </>
  )
}
