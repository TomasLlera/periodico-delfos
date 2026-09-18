import type { Metadata } from 'next'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { FechaAFecha } from '@/components/partido/FechaAFecha'
import { BloqueArchivo } from '@/components/portada/BloqueArchivo'
import { Goleadoras } from '@/components/portada/Goleadoras'
import { GrillaNotas } from '@/components/portada/GrillaNotas'
import { ListaAnalisis } from '@/components/portada/ListaAnalisis'
import { NotaTapa } from '@/components/portada/NotaTapa'
import { TarjetaPlantel } from '@/components/portada/TarjetaPlantel'
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
  temporadaDemo,
} from '@/app/demo/temporada/datos-demo'

/**
 * La portada con datos falsos.
 *
 * Existe porque `/` está vacía hasta que haya un proyecto de Supabase, y una
 * portada vacía no deja ver si el diseño funciona. Acá se ve el boceto
 * completo: la tapa, la grilla con la primera nota a dos columnas, la franja de
 * fecha a fecha, el listado de análisis, las goleadoras y el bloque de plantel
 * **con** sus caras y estadísticas, que la portada real no muestra.
 *
 * Los dos widgets deportivos son los mismos componentes que usa `/`, en el
 * mismo lugar de la página: acá reciben la Primera B 2026 leída del sitio
 * viejo, y en `/` lo que haya en la base, que hoy es nada.
 *
 * No se indexa y no llega a producción. Se borra —junto con `datos-demo.ts`—
 * cuando la migración cargue notas reales.
 */
export const metadata: Metadata = {
  title: 'Portada · banco de pruebas',
  robots: { index: false, follow: false },
}

export default function DemoPortada() {
  return (
    <>
      {/* Fija, para ver la línea de fecha con clima sin depender de la red. */}
      <Header temperatura={14} />

      {/* Las mismas clases que `/`: sin padding arriba, porque la tapa abre la
          página y trae su propio margen. */}
      <main className="mx-auto max-w-[1200px] px-4 pb-4">
        <NotaTapa nota={notaDeTapa} palabras={1180} />

        <GrillaNotas
          id="demo-cronicas"
          titulo="Crónicas"
          notas={cronicas}
          enlace={{ href: '/cronicas', texto: 'Todas las crónicas' }}
          vacio="Todavía no hay crónicas publicadas."
        />

        <FechaAFecha
          id="demo-fecha-a-fecha"
          partidos={fixtureDemo}
          temporada={temporadaDemo}
        />

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

            <Goleadoras
              id="demo-goleadoras"
              goleadoras={goleadorasDemo}
              temporada={temporadaDemo}
            />
          </div>
        </div>

        <BloqueArchivo />

        {/* Abajo y en una línea: la advertencia tiene que estar —esta ruta no
            se indexa y no llega a producción— pero no adelante de la tapa, que
            es lo que la portada tiene que mostrar primero. */}
        <p className="mt-10 border-t border-linea pt-4 font-display text-[0.8rem] text-gris">
          Banco de pruebas · no se indexa y no llega a producción. Las notas son
          las de verdad, leídas del sitio viejo con el script de migración; la
          portada real sigue leyendo la base, que hoy está vacía.
        </p>
      </main>

      <Footer />
    </>
  )
}
