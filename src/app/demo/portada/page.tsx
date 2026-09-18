import type { Metadata } from 'next'
import { BarraEstado } from '@/components/layout/BarraEstado'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { BloqueArchivo } from '@/components/portada/BloqueArchivo'
import { FechaAFecha } from '@/components/portada/FechaAFecha'
import { Goleadoras } from '@/components/portada/Goleadoras'
import { GrillaNotas } from '@/components/portada/GrillaNotas'
import { ListaAnalisis } from '@/components/portada/ListaAnalisis'
import { NotaTapa } from '@/components/portada/NotaTapa'
import { TarjetaPlantel } from '@/components/portada/TarjetaPlantel'
import { dividirFixture } from '@/lib/temporada'
import {
  analisis,
  carasDemo,
  cronicas,
  estadisticasDemo,
  notaDeTapa,
} from '@/app/demo/portada/datos-demo'
import {
  fixtureDemo,
  goleadorasDemo,
  tablaDemo,
  temporadaDemo,
} from '@/app/demo/temporada/datos-demo'

/**
 * La portada con datos falsos.
 *
 * Existe porque `/` está vacía hasta que haya un proyecto de Supabase, y una
 * portada vacía no deja ver si el diseño funciona. Acá se ve el boceto
 * completo: la barra de estado, la tapa, la grilla con la primera nota a dos
 * columnas, la cinta de fecha a fecha, el listado de análisis, el bloque de
 * plantel **con** sus caras y estadísticas y el top de goleadoras. Nada de eso
 * deportivo lo muestra la portada real, que sólo dibuja lo que haya en la
 * base.
 *
 * Los datos deportivos salen de `/demo/temporada/datos-demo`, que ya tiene un
 * fixture, una tabla y un ranking coherentes entre sí. Duplicarlos acá sería
 * mantener dos temporadas inventadas que se contradicen a la primera.
 *
 * No se indexa y no llega a producción. Se borra —junto con `datos-demo.ts`—
 * cuando la migración cargue notas reales.
 */
export const metadata: Metadata = {
  title: 'Portada · banco de pruebas',
  robots: { index: false, follow: false },
}

const { jugados, porJugar } = dividirFixture(fixtureDemo)

/** Los mismos que alimentarían la barra desde la base: el último y el que viene. */
const ultimoDemo = jugados.at(-1) ?? null
const proximoDemo = porJugar.at(0) ?? null
const posicionDemo = tablaDemo.find((fila) => fila.equipo.es_aldosivi) ?? null

export default function DemoPortada() {
  return (
    <>
      <BarraEstado
        ultimo={ultimoDemo}
        proximo={proximoDemo}
        posicion={posicionDemo}
        temporada={temporadaDemo}
      />

      <Header />

      <main className="mx-auto max-w-[1200px] px-4 py-10">
        {/* El título de la demo NO es un `<h1>`: el `<h1>` de esta página es el
            titular de la nota de tapa, como en la portada real. Con los dos, la
            página tenía dos `<h1>` —lo que un lector de pantalla lee como dos
            títulos de página— y dejaba de ser la copia fiel que tiene que ser. */}
        <p className="meta">Banco de pruebas · datos falsos</p>
        <p className="mt-2 font-display text-[30px] font-bold leading-[1.1] tracking-[-0.02em] md:text-[44px]">
          La portada
        </p>
        <p className="prose-nota mt-4 text-gris">
          Esta página no se indexa y no llega a producción. Los marcadores que
          se nombran en los títulos, la barra de arriba, la cinta de fecha a
          fecha y las goleadoras son inventados y sólo viven acá: la portada
          real no muestra ningún dato deportivo hasta que esté la base.
        </p>

        <NotaTapa nota={notaDeTapa} palabras={1180} />

        <GrillaNotas
          id="demo-cronicas"
          titulo="Crónicas"
          notas={cronicas}
          enlace={{ href: '/cronicas', texto: 'Todas las crónicas' }}
          vacio="Todavía no hay crónicas publicadas."
        />

        <FechaAFecha partidos={fixtureDemo} temporada={temporadaDemo} />

        <div className="mt-14 grid gap-12 lg:grid-cols-[2fr_1fr]">
          <ListaAnalisis
            id="demo-analisis"
            titulo="Análisis"
            notas={analisis}
            enlace={{ href: '/analisis', texto: 'Ver más' }}
            vacio="Todavía no hay análisis publicados."
          />

          <div>
            <TarjetaPlantel
              titulo="El plantel 2026"
              descripcion="Fichas, estadísticas y trayectoria de cada una de las jugadoras de Aldosivi."
              enlace={{ href: '/plantel', texto: 'Ver el plantel completo' }}
              caras={carasDemo}
              estadisticas={estadisticasDemo}
            />

            <Goleadoras goleadoras={goleadorasDemo} temporada={temporadaDemo} />
          </div>
        </div>

        <BloqueArchivo temporadas={[temporadaDemo]} />
      </main>

      <Footer />
    </>
  )
}
