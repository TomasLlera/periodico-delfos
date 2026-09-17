import type { Metadata } from 'next'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { BloqueArchivo } from '@/components/portada/BloqueArchivo'
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

/**
 * La portada con datos falsos.
 *
 * Existe porque `/` está vacía hasta que haya un proyecto de Supabase, y una
 * portada vacía no deja ver si el diseño funciona. Acá se ve el boceto
 * completo: la tapa, la grilla con la primera nota a dos columnas, el listado
 * de análisis y el bloque de plantel **con** sus caras y estadísticas, que la
 * portada real no muestra.
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

      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <p className="meta">Banco de pruebas · notas reales</p>
        <h1 className="mt-2 font-display text-[30px] font-bold leading-[1.1] tracking-[-0.02em] md:text-[44px]">
          La portada
        </h1>
        <p className="prose-nota mt-4 text-gris">
          Esta página no se indexa y no llega a producción. Las notas son{' '}
          <strong>las de verdad</strong>, leídas del sitio viejo con el script de
          migración: fijate que los títulos entran enteros, sin el
          &laquo;…&raquo; que los cortaba en la home de WordPress —el migrador
          les saca el sufijo con la fecha y el torneo—. La portada real sigue
          leyendo la base, que hoy está vacía.
        </p>

        <NotaTapa nota={notaDeTapa} palabras={1180} />

        <GrillaNotas
          id="demo-cronicas"
          titulo="Crónicas"
          notas={cronicas}
          enlace={{ href: '/cronicas', texto: 'Todas las crónicas' }}
          vacio="Todavía no hay crónicas publicadas."
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-[2fr_1fr]">
          <ListaAnalisis
            id="demo-analisis"
            titulo="Análisis"
            notas={analisis}
            enlace={{ href: '/analisis', texto: 'Ver más' }}
            vacio="Todavía no hay análisis publicados."
          />

          <TarjetaPlantel
            titulo="El plantel 2026"
            descripcion="Fichas, estadísticas y trayectoria de cada una de las jugadoras de Aldosivi."
            enlace={{ href: '/plantel', texto: 'Ver el plantel completo' }}
            caras={carasDemo}
            estadisticas={estadisticasDemo}
          />
        </div>

        <BloqueArchivo />
      </main>

      <Footer />
    </>
  )
}
