import { Esqueleto, EsqueletoTarjeta } from '@/components/layout/Esqueleto'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'

/**
 * Lo que se ve mientras carga cualquier página pública.
 *
 * **Antes no había ninguno en todo el proyecto**, y es la razón de que la
 * navegación se sintiera lenta aparte de serlo: sin `loading.tsx`, Next deja la
 * pantalla anterior congelada hasta que el servidor termina de responder la
 * siguiente. El lector aprieta un link, no pasa nada durante medio segundo, y
 * vuelve a apretar. Con esto la respuesta es inmediata aunque los datos tarden
 * lo mismo.
 *
 * **Dibuja la cabecera y el pie de verdad, no su esqueleto.** En este proyecto
 * cada página monta su propio `<Header />` y `<Footer />` —no están en un
 * layout—, así que un `loading` sin ellos haría desaparecer el chrome entero
 * durante la carga y volver a aparecer después: un parpadeo peor que la espera.
 * El chrome no depende de los datos de la página, así que se dibuja terminado.
 *
 * **Uno solo para todo el sitio público**, con la forma de un listado de notas,
 * que es la forma que tienen la portada, las crónicas, los análisis y la
 * búsqueda. Una ficha de partido se verá un poco distinta por dentro mientras
 * carga, y es un precio bajo frente a mantener ocho esqueletos que se
 * desincronizan del diseño al primer cambio.
 */
export default function Cargando() {
  return (
    <>
      <Header />

      <main
        role="status"
        aria-label="Cargando la página"
        className="mx-auto max-w-[1200px] px-4 py-10"
      >
        <Esqueleto alto="h-10" ancho="w-64" className="mb-8" />

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Seis tarjetas: lo que entra en una pantalla de escritorio sin
              scrollear. Más sería dibujar un esqueleto que nadie ve. */}
          {Array.from({ length: 6 }, (_, indice) => (
            <EsqueletoTarjeta key={indice} />
          ))}
        </div>

        <span className="sr-only">Cargando…</span>
      </main>

      <Footer />
    </>
  )
}
