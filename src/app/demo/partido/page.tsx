import type { Metadata } from 'next'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { NotasRelacionadas } from '@/components/content/NotasRelacionadas'
import { PlanillaPartido } from '@/components/partido/PlanillaPartido'
import { partidoCompleto } from '@/app/demo/planilla/datos-demo'
import { cronicas } from '@/app/demo/portada/datos-demo'
import { FECHA_TABLA_DEMO, tablaDemo, temporadaDemo } from '@/app/demo/temporada/datos-demo'
import { TablaPosiciones } from '@/components/temporada/TablaPosiciones'

/**
 * La ficha de partido con datos falsos.
 *
 * `/demo/planilla` ya muestra las tres variantes de la planilla sueltas; esto
 * muestra la **página** de `/partido/[slug]`: la planilla completa sin plegar,
 * con las notas del partido debajo. Sin base no hay ningún slug real que
 * visitar, así que es la única forma de mirarla.
 *
 * No se indexa y no llega a producción.
 */
export const metadata: Metadata = {
  title: 'Ficha de partido · banco de pruebas',
  robots: { index: false, follow: false },
}

export default function DemoPartido() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <p className="meta">Banco de pruebas · datos falsos</p>
        <h1 className="mt-2 font-display text-[30px] font-bold leading-[1.1] tracking-[-0.02em] md:text-[44px]">
          La ficha de un partido
        </h1>
        <p className="prose-nota mt-4 text-text-muted">
          Esta página no se indexa y no llega a producción. El marcador y los
          eventos son inventados: la ficha real se dibuja con lo que se cargue
          en la planilla.
        </p>

        <div className="mt-12">
          <PlanillaPartido partido={partidoCompleto} variante="completa" nivelTitulo={2} />
        </div>

        {/* La tabla a la fecha del partido, que en la ficha real sale de
            `tabla_posiciones` y hoy no se ve porque esa tabla está vacía. Acá
            va con los datos de prueba para poder mirarla. */}
        <section aria-labelledby="demo-tabla-a-la-fecha" className="mt-12">
          <h2 id="demo-tabla-a-la-fecha" className="titular text-[22px]">
            La tabla después de esta fecha
          </h2>
          <p className="mt-1 font-body text-[0.9rem] text-text-muted">
            Cómo quedaba el campeonato una vez jugada la fecha {FECHA_TABLA_DEMO}.
          </p>

          <div className="mt-4">
            <TablaPosiciones
              filas={tablaDemo}
              fecha={FECHA_TABLA_DEMO}
              temporada={temporadaDemo.nombre}
            />
          </div>
        </section>

        <NotasRelacionadas
          notas={cronicas.slice(0, 3)}
          titulo="Lo que se escribió sobre este partido"
        />
      </main>

      <Footer />
    </>
  )
}
