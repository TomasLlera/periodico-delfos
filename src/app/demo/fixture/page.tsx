import type { Metadata } from 'next'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { FechaAFecha } from '@/components/partido/FechaAFecha'
import { fixtureDemo, temporadaDemo } from '@/app/demo/temporada/datos-demo'

/**
 * El banco de pruebas de la ventana de la planilla.
 *
 * La franja de fecha a fecha con **todas** las fechas y no la ventana de siete
 * que muestra la portada: acá lo que importa es poder apretar cualquiera.
 *
 * No se indexa y no llega a producción. Se borra cuando haya temporada cargada
 * y esto mismo se pueda probar en `/`.
 */
export const metadata: Metadata = {
  title: 'La ventana de la planilla · banco de pruebas',
  robots: { index: false, follow: false },
}

export default function DemoFixture() {
  return (
    <>
      <Header temperatura={14} />

      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <p className="meta">Banco de pruebas · Primera B 2026 real</p>
        <h1 className="mt-2 font-display text-[30px] font-bold leading-[1.1] tracking-[-0.02em] md:text-[44px]">
          La ventana de la planilla
        </h1>

        <div className="prose-nota mt-4 text-gris">
          <p>
            Apretá cualquier fecha: la planilla se abre como ventana encima de
            esta página. Lo que hay que comprobar es que el chip{' '}
            <strong>sigue siendo un link de verdad</strong>, no un botón.
          </p>
          <ul>
            <li>La URL cambia a la del partido mientras la ventana está abierta.</li>
            <li>
              <strong>Atrás</strong> cierra la ventana y deja esta página donde
              estaba.
            </li>
            <li>
              <strong>F5</strong> con la ventana abierta muestra la página
              entera del partido, no la ventana.
            </li>
            <li>
              <strong>Escape</strong> la cierra, y el foco vuelve al chip que la
              abrió.
            </li>
            <li>Con el JavaScript apagado, el chip navega como cualquier link.</li>
          </ul>
          <p>
            <strong>Los marcadores y las fechas son reales</strong>, leídos del
            sitio viejo. La línea de tiempo de adentro de la ventana{' '}
            <strong>no</strong>: es siempre la misma planilla demo prestada,
            porque las incidencias por fecha no existen todavía y no se
            inventan.
          </p>
        </div>

        <FechaAFecha
          id="demo-fixture"
          partidos={fixtureDemo}
          temporada={temporadaDemo}
          rutaBase="/demo/fixture"
          ventana={{ jugados: 20, porJugar: 20 }}
        />
      </main>

      <Footer />
    </>
  )
}
