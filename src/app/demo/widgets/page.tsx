import type { Metadata } from 'next'
import { BarraEstado } from '@/components/layout/BarraEstado'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { FechaAFecha } from '@/components/partido/FechaAFecha'
import { Goleadoras } from '@/components/portada/Goleadoras'
import { UltimoResultado } from '@/components/portada/UltimoResultado'
import { partidoCompleto } from '@/app/demo/planilla/datos-demo'
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
 * **La portada real ya los tiene a los tres**, pero hoy no se ven: sin temporada
 * activa en la base reciben vacío y se borran solos, que es lo que exige la
 * regla no negociable 1. Esta página existe para verlos dibujados sin esperar a
 * que haya datos, y no se indexa ni llega a producción. **Es el único lugar
 * donde se miran**: `/demo/portada` no los dibuja, para que la demo de la
 * portada siga mostrando las notas y no los widgets, que ya tienen esta página.
 *
 * La barra va arriba de la cabecera, que es su lugar en los dos bocetos. Los
 * otros dos van donde irían en la portada: la franja debajo de las últimas
 * notas y las goleadoras abajo de todo.
 *
 * **Esta barra es la de la demo, con datos.** La de verdad la pone el layout
 * raíz en todas las páginas, y hoy no se dibuja porque no hay base. El día que
 * la haya se van a ver dos apiladas acá: para entonces esta página ya no tiene
 * razón de existir y se borra.
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

      <main className="contenedor py-10">
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

        {/* El bloque que va en la portada, abajo de la tapa. Los goles salen de
            la planilla de `/demo/planilla` y no del fixture: las crónicas del
            sitio viejo dicen quién convirtió pero no en qué minuto, y
            `eventos.minuto` es obligatorio. */}
        <UltimoResultado
          id="demo-ultimo-resultado"
          partido={partidoCompleto}
          eventos={partidoCompleto.eventos}
          rutaBase="/demo/fixture"
        />

        {/* La franja ya no va en la portada —ver `src/app/page.tsx`— pero sigue
            en `/temporada/[slug]`, así que se mira acá al lado de lo que la
            reemplazó. */}
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

          {/* Sin planilla cargada: es el estado que tiene hoy la base, donde el
              partido de la fecha 4 entró con su resultado y sin sus goles. */}
          <UltimoResultado
            id="demo-ultimo-resultado-vacio"
            partido={partidoCompleto}
            eventos={[]}
            rutaBase="/demo/fixture"
          />

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
