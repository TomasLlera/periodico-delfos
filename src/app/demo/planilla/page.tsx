import type { Metadata } from 'next'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { PlanillaPartido } from '@/components/partido/PlanillaPartido'
import {
  partidoCompleto,
  partidoDeVisitante,
  partidoProgramado,
} from '@/app/demo/planilla/datos-demo'

/**
 * Banco de pruebas de `<PlanillaPartido />` con datos falsos.
 *
 * Existe para poder mirar el componente antes de que haya un proyecto de
 * Supabase. Se borra —junto con `datos-demo.ts`— cuando la migración cargue
 * partidos reales.
 */
export const metadata: Metadata = {
  title: 'Planilla · banco de pruebas',
  robots: { index: false, follow: false },
}

export default function DemoPlanilla() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <p className="meta">Banco de pruebas · datos falsos</p>
        <h1 className="mt-2 font-display text-[30px] font-bold leading-[1.1] tracking-[-0.02em] md:text-[44px]">
          &lt;PlanillaPartido /&gt;
        </h1>
        <p className="prose-nota mt-4 text-gris">
          Esta página no se indexa y no llega a producción. Está para mirar las
          tres variantes juntas, probar el ancho de 375px y escuchar cómo se lee
          la línea de tiempo con un lector de pantalla.
        </p>

        <Seccion
          titulo="1 · Completa"
          nota="La de /partido/[slug]. Aldosivi de local, gana 2 a 1, con los nueve tipos de evento cargados."
        >
          <PlanillaPartido partido={partidoCompleto} variante="completa" nivelTitulo={3} />
        </Seccion>

        <Seccion
          titulo="2 · Embebida en la crónica"
          nota="Dentro de .prose-nota: no hereda la serif ni el filete verde de los subtítulos, y se mantiene en la medida de 68ch."
        >
          <div className="prose-nota">
            <p>
              Aldosivi se lo dio vuelta en el segundo tiempo y volvió a meterse en
              la pelea por el reducido. El penal de Garro a los 67 minutos terminó
              de sellar una tarde larga en el Minella.
            </p>
            <PlanillaPartido
              partido={partidoCompleto}
              variante="embebida"
              nivelTitulo={3}
            />
            <p>
              El próximo domingo, otra vez de local, con Deportivo Español como
              rival y la chance de quedar a dos puntos de la punta.
            </p>
          </div>
        </Seccion>

        <Seccion
          titulo="3 · Compacta"
          nota="La de la portada. Cada tarjeta es un solo link, con el marcador completo como nombre accesible."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <PlanillaPartido partido={partidoCompleto} variante="compacta" />
            <PlanillaPartido partido={partidoDeVisitante} variante="compacta" />
            <PlanillaPartido partido={partidoProgramado} variante="compacta" />
          </div>
        </Seccion>

        <Seccion
          titulo="4 · Aldosivi de visitante, con gol en contra"
          nota="Aldosivi sigue a la izquierda aunque juegue afuera. El gol en contra de Vera cae del lado de Aldosivi, que es el que suma, con el (e/c) al lado del apellido de quien lo hizo."
        >
          <PlanillaPartido partido={partidoDeVisitante} variante="completa" nivelTitulo={3} />
        </Seccion>

        <Seccion
          titulo="5 · Partido sin jugar"
          nota="Estados vacíos escritos: sin marcador, sin eventos y sin formación cargada."
        >
          <PlanillaPartido partido={partidoProgramado} variante="completa" nivelTitulo={3} />
        </Seccion>
      </main>

      <Footer />
    </>
  )
}

function Seccion({
  titulo,
  nota,
  children,
}: {
  titulo: string
  nota: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-14">
      <h2 className="border-t-[3px] border-verde-600 pt-2 font-display text-[22px] font-semibold">
        {titulo}
      </h2>
      <p className="mt-1 max-w-[68ch] font-display text-[13px] leading-relaxed text-gris">
        {nota}
      </p>
      <div className="mt-5">{children}</div>
    </section>
  )
}
