import type { Metadata } from 'next'
import { BarraEstado } from '@/components/layout/BarraEstado'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { FechaAFecha } from '@/components/partido/FechaAFecha'
import { Goleadoras } from '@/components/portada/Goleadoras'
import { estadoTemporada, filaDeAldosivi } from '@/lib/temporada'
import {
  fixtureDemo,
  goleadorasDemo,
  tablaDemo,
  temporadaDemo,
} from '@/app/demo/temporada/datos-demo'

/**
 * Los tres widgets deportivos de la portada, con datos falsos.
 *
 * Son `<BarraEstado />`, `<FechaAFecha />` y `<Goleadoras />` (blueprint 7.2).
 * **La portada real no los muestra**: el Build Order los deja para el Step 19,
 * cuando haya partidos cargados, y rellenarlos con marcadores de ejemplo en `/`
 * viola la regla no negociable 1. Acá se pueden mirar porque esta página no se
 * indexa y no llega a producción.
 *
 * La barra va arriba de la cabecera, que es su lugar en los dos bocetos. Los
 * otros dos van donde irían en la portada: la franja debajo de las últimas
 * notas y las goleadoras abajo de todo.
 *
 * Se borra —con `datos-demo.ts`— cuando la migración cargue datos reales.
 */
export const metadata: Metadata = {
  title: 'Widgets deportivos · banco de pruebas',
  robots: { index: false, follow: false },
}

export default function DemoWidgets() {
  const { ultimo, proximo } = estadoTemporada(fixtureDemo)
  const posicion = filaDeAldosivi(tablaDemo)

  return (
    <>
      <BarraEstado
        temporada={temporadaDemo}
        ultimo={ultimo}
        proximo={proximo}
        posicion={posicion}
      />

      <Header />

      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <p className="meta">Banco de pruebas · Primera B 2026 real</p>
        <h1 className="mt-2 font-display text-[30px] font-bold leading-[1.1] tracking-[-0.02em] md:text-[44px]">
          Los widgets deportivos
        </h1>
        <p className="prose-nota mt-4 text-gris">
          Esta página no se indexa y no llega a producción. El último resultado,
          la franja y las goleadoras son <strong>los de verdad</strong>, leídos
          de las doce crónicas del sitio viejo; la posición en la tabla es lo
          único inventado. La barra de arriba es{' '}
          <code>&lt;BarraEstado /&gt;</code> en su lugar real: la primera franja
          del documento, arriba de la cabecera. No hay próximo partido porque el
          sitio no publicó ninguno después de la fecha 12.
        </p>

        <FechaAFecha id="demo-fecha-a-fecha" partidos={fixtureDemo} temporada={temporadaDemo} />

        <div className="max-w-[560px]">
          <Goleadoras
            id="demo-goleadoras"
            goleadoras={goleadorasDemo}
            temporada={temporadaDemo}
          />
        </div>

        <section aria-labelledby="demo-vacios" className="mt-16">
          <h2
            id="demo-vacios"
            className="marca border-b-[3px] border-tinta pb-2 text-[1.6rem] uppercase"
          >
            Los estados vacíos
          </h2>
          <p className="prose-nota mt-4 text-gris">
            Es lo que ve alguien que entra el día que arranca la temporada. La
            barra de estado no aparece —una franja fija que dice &laquo;todavía
            no hay nada&raquo; arriba de todas las páginas es ruido—, y los
            otros dos bloques explican de dónde van a salir los datos.
          </p>

          <FechaAFecha id="demo-fecha-a-fecha-vacia" partidos={[]} temporada={temporadaDemo} />

          <div className="max-w-[560px]">
            <Goleadoras id="demo-goleadoras-vacias" goleadoras={[]} temporada={temporadaDemo} />
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
