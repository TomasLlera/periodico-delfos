import type { Metadata } from 'next'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { NotasRelacionadas } from '@/components/content/NotasRelacionadas'
import { PlanillaPartido } from '@/components/partido/PlanillaPartido'
import { partidoCompleto } from '@/app/demo/planilla/datos-demo'
import { cronicas } from '@/app/demo/portada/datos-demo'

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
        <p className="prose-nota mt-4 text-gris">
          Esta página no se indexa y no llega a producción. El marcador y los
          eventos son inventados: la ficha real se dibuja con lo que se cargue
          en la planilla.
        </p>

        <div className="mt-12">
          <PlanillaPartido partido={partidoCompleto} variante="completa" nivelTitulo={2} />
        </div>

        <NotasRelacionadas
          notas={cronicas.slice(0, 3)}
          titulo="Lo que se escribió sobre este partido"
        />
      </main>

      <Footer />
    </>
  )
}
