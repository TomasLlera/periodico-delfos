import type { Metadata } from 'next'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { NotasRelacionadas } from '@/components/content/NotasRelacionadas'
import { CabeceraJugadora } from '@/components/jugadora/CabeceraJugadora'
import { ListaGoles } from '@/components/jugadora/ListaGoles'
import { TablaEstadisticas } from '@/components/jugadora/TablaEstadisticas'
import { totalesJugadora } from '@/lib/jugadora'
import { nombreCompleto, puestoEnTemporada } from '@/lib/plantel'
import {
  estadisticasDemo,
  filaPlantelDemo,
  golesDemo,
  jugadoraDemo,
  temporadaDemo,
  temporadasDemo,
} from '@/app/demo/temporada/datos-demo'
import { cronicas } from '@/app/demo/portada/datos-demo'

/**
 * La ficha de jugadora con datos falsos.
 *
 * Sin proyecto de Supabase no hay ningún slug real que visitar, así que es la
 * única forma de mirarla. Los números salen de las dos temporadas de la demo,
 * y la fecha es fija para que la edad no cambie entre capturas.
 *
 * No se indexa y no llega a producción.
 */
export const metadata: Metadata = {
  title: 'Ficha de jugadora · banco de pruebas',
  robots: { index: false, follow: false },
}

/** Fija a propósito: con `new Date()` la edad cambiaría de una captura a otra. */
const HOY = new Date('2026-08-05T12:00:00.000Z')

export default function DemoJugadora() {
  const filas = estadisticasDemo
    .map((fila) => ({
      fila,
      temporada: temporadasDemo.find((t) => t.id === fila.temporada_id) ?? null,
    }))
    .sort((a, b) => (b.temporada?.anio ?? 0) - (a.temporada?.anio ?? 0))
    .map(({ fila, temporada }) => ({
      estadisticas: fila,
      temporadaNombre: temporada?.nombre ?? 'Temporada',
      temporadaSlug: temporada?.slug ?? null,
    }))

  return (
    <>
      <Header />

      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <p className="meta">Banco de pruebas · campaña 2026 real</p>
        <h1 className="mt-2 font-display text-[30px] font-bold leading-[1.1] tracking-[-0.02em] md:text-[44px]">
          La ficha de una jugadora
        </h1>
        <p className="prose-nota mt-4 text-gris">
          Esta página no se indexa y no llega a producción, pero la campaña de
          Morena Larea es <strong>la de verdad</strong>, contada de las doce
          crónicas: goleadora del torneo con ocho goles, titular en todas las
          fechas menos la sexta. <strong>La lista de goles muestra cuatro</strong>,
          y no es un error del diseño: las incidencias de las fechas 3, 4 y 7
          dicen que convirtió pero no en qué minuto, y un gol sin minuto no
          entra en la planilla. Es el agujero que hay que completar a mano antes
          de correr la migración de verdad.
        </p>

        {/* El título de la ficha real es el nombre de la jugadora, en `<h1>`.
            Acá baja a `<h2>`: el `<h1>` de esta página es el del banco de
            pruebas, y dos h1 en una página son uno de más. */}
        <div className="mt-12">
          <CabeceraJugadora
            jugadora={jugadoraDemo}
            puesto={puestoEnTemporada(filaPlantelDemo)}
            dorsal={filaPlantelDemo.dorsal}
            capitana={filaPlantelDemo.capitana}
            temporadaActual={temporadaDemo.nombre}
            totales={totalesJugadora(estadisticasDemo)}
            hoy={HOY}
            nivelTitulo={2}
          />
        </div>

        <section aria-labelledby="demo-estadisticas" className="mt-12">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-7 w-2.5 shrink-0 rounded-sm bg-verde-600" />
            <h2 id="demo-estadisticas" className="titular text-[22px]">
              Temporada a temporada
            </h2>
          </div>
          <div className="mt-5">
            <TablaEstadisticas filas={filas} />
          </div>
        </section>

        <section aria-labelledby="demo-goles" className="mt-12">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-7 w-2.5 shrink-0 rounded-sm bg-verde-600" />
            <h2 id="demo-goles" className="titular text-[22px]">
              Sus goles
            </h2>
            <span className="dato text-[0.8rem] text-gris">{golesDemo.length}</span>
          </div>
          <div className="mt-5 max-w-[720px]">
            <ListaGoles goles={golesDemo} />
          </div>
        </section>

        <NotasRelacionadas
          notas={cronicas.slice(0, 3)}
          titulo={`Notas donde aparece ${nombreCompleto(jugadoraDemo)}`}
        />
      </main>

      <Footer />
    </>
  )
}
