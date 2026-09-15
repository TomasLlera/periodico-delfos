import type { Metadata } from 'next'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { FixtureTemporada } from '@/components/temporada/FixtureTemporada'
import { ListaGoleadoras } from '@/components/temporada/ListaGoleadoras'
import { TablaPosiciones } from '@/components/temporada/TablaPosiciones'
import {
  FECHA_TABLA_DEMO,
  fixtureDemo,
  goleadorasDemo,
  tablaDemo,
  temporadaDemo,
} from '@/app/demo/temporada/datos-demo'

/**
 * Las tres vistas de `/temporada/[slug]` con datos falsos.
 *
 * Acá van **apiladas**, una abajo de la otra; en la página real son tres
 * pestañas con `?ver=` y cada una carga sólo su propia query. Apiladas se
 * pueden mirar las tres de una en el navegador, que es para lo que existe esta
 * página: sin proyecto de Supabase no hay ningún slug real que visitar.
 *
 * No se indexa y no llega a producción.
 */
export const metadata: Metadata = {
  title: 'Temporada · banco de pruebas',
  robots: { index: false, follow: false },
}

export default function DemoTemporada() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <p className="meta">Banco de pruebas · datos falsos</p>
        <h1 className="mt-2 font-display text-[30px] font-bold leading-[1.1] tracking-[-0.02em] md:text-[44px]">
          La página de temporada
        </h1>
        <p className="prose-nota mt-4 text-gris">
          Esta página no se indexa y no llega a producción. El fixture, la tabla
          y las goleadoras son inventados. En la página real son tres pestañas
          —fixture, tabla y goleadoras— y cada una carga sólo lo suyo.
        </p>

        <section aria-labelledby="demo-fixture" className="mt-12">
          <h2 id="demo-fixture" className="marca border-b-[3px] border-tinta pb-2 text-[1.6rem] uppercase">
            Pestaña 1 · Fixture
          </h2>
          <div className="mt-6">
            <FixtureTemporada partidos={fixtureDemo} temporada={temporadaDemo.nombre} />
          </div>
        </section>

        <section aria-labelledby="demo-tabla" className="mt-16">
          <h2 id="demo-tabla" className="marca border-b-[3px] border-tinta pb-2 text-[1.6rem] uppercase">
            Pestaña 2 · Tabla
          </h2>
          <div className="mt-6">
            <TablaPosiciones
              filas={tablaDemo}
              fecha={FECHA_TABLA_DEMO}
              temporada={temporadaDemo.nombre}
            />
          </div>
        </section>

        <section aria-labelledby="demo-goleadoras" className="mt-16">
          <h2 id="demo-goleadoras" className="marca border-b-[3px] border-tinta pb-2 text-[1.6rem] uppercase">
            Pestaña 3 · Goleadoras
          </h2>
          <div className="mt-6 max-w-[720px]">
            <ListaGoleadoras goleadoras={goleadorasDemo} temporada={temporadaDemo.nombre} />
          </div>
        </section>

        <section aria-labelledby="demo-vacios" className="mt-16">
          <h2 id="demo-vacios" className="marca border-b-[3px] border-tinta pb-2 text-[1.6rem] uppercase">
            Los estados vacíos
          </h2>
          <p className="prose-nota mt-4 text-gris">
            Es lo que ve alguien que entra a una temporada recién creada. Se
            escriben, no se omiten: una pantalla en blanco no distingue
            &laquo;todavía no hay datos&raquo; de &laquo;está roto&raquo;.
          </p>
          <div className="mt-6 flex flex-col gap-6">
            <FixtureTemporada partidos={[]} temporada={temporadaDemo.nombre} />
            <TablaPosiciones filas={[]} fecha={null} temporada={temporadaDemo.nombre} />
            <ListaGoleadoras goleadoras={[]} temporada={temporadaDemo.nombre} />
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
