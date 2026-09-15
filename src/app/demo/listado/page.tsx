import type { Metadata } from 'next'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { ListadoNotas } from '@/components/listado/ListadoNotas'
import { analisis, cronicas } from '@/app/demo/portada/datos-demo'

/**
 * Banco de pruebas de `<ListadoNotas />` con datos falsos.
 *
 * Existe para mirar el paginador, que es lo único de los listados que no se
 * puede ver en `/cronicas` sin base: sin notas cargadas el listado real muestra
 * su estado vacío y la paginación no se dibuja.
 *
 * Se muestra la **página 2 de 4** a propósito: es el único estado donde
 * "Anterior" y "Siguiente" están los dos activos y se ve el número actual
 * marcado en el medio de la serie. Los otros dos casos —primera y última— son
 * los que dejan un extremo apagado.
 *
 * No se indexa y no llega a producción. Se borra cuando la migración cargue
 * notas reales.
 */
export const metadata: Metadata = {
  title: 'Listados · banco de pruebas',
  robots: { index: false, follow: false },
}

export default function DemoListado() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-[1200px] px-4 py-10">
        <p className="meta">Banco de pruebas · datos falsos</p>
        <h1 className="mt-2 font-display text-[30px] font-bold leading-[1.1] tracking-[-0.02em] md:text-[44px]">
          Los listados
        </h1>
        <p className="prose-nota mt-4 text-gris">
          Esta página no se indexa y no llega a producción. Los links del
          paginador apuntan a <code>/cronicas</code>, que es la ruta real: desde
          acá se puede comprobar que funcionan sin JavaScript.
        </p>

        <div className="mt-12">
          <ListadoNotas
            id="demo-listado-lleno"
            titulo="Crónicas"
            descripcion="El partido a partido de las Tiburonas: qué pasó en cada fecha, contado el mismo día."
            notas={[...cronicas, ...analisis]}
            base="/cronicas"
            pagina={2}
            totalPaginas={4}
            vacio="Todavía no hay crónicas publicadas."
          />
        </div>

        <div className="mt-20">
          <ListadoNotas
            id="demo-listado-vacio"
            titulo="Análisis"
            descripcion="Los números, la táctica y las cuentas del torneo, más allá del resultado de la fecha."
            notas={[]}
            base="/analisis"
            pagina={1}
            totalPaginas={1}
            vacio="Todavía no hay análisis publicados."
          />
        </div>
      </main>

      <Footer />
    </>
  )
}
