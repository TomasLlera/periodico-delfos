import { Esqueleto, EsqueletoTarjeta } from '@/components/layout/Esqueleto'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'

/**
 * Lo que se ve mientras la búsqueda va a la base.
 *
 * **ESTE ARCHIVO ESTABA EN LA RAÍZ —`src/app/loading.tsx`— Y DE AHÍ HAY QUE
 * DEJARLO AFUERA.** No es una preferencia de diseño, es la causa de un bug
 * medido: un `loading.tsx` crea un límite de Suspense, y con uno en la raíz
 * Next empieza a mandar la respuesta —con el status ya puesto en 200— antes de
 * que la página termine de resolver. Cuando después la página llama
 * `notFound()`, el 404 ya no se puede escribir: el sitio devolvía **200 en
 * todas** las páginas inexistentes —`/nota/cualquier-cosa`, `/partido/...`,
 * `/jugadora/...`, `/temporada/...`, `/plantel/...`— sirviendo la pantalla de
 * 404 con el código de una página válida. Para Google eso es contenido bueno, y
 * lo indexa.
 *
 * Medido con `curl` contra `next start`, sacando y poniendo el archivo: con él,
 * 200; sin él, 404. Lo cubre `e2e/estados.spec.ts`, que es lo que impide que
 * vuelva a pasar.
 *
 * **Por qué acá sí.** `/buscar` es la única ruta pública que a la vez se
 * renderiza en cada visita —lee `?q=` y pega un full-text a Postgres, así que
 * la espera es de verdad— y no puede devolver 404 nunca: una búsqueda sin
 * resultados es una respuesta exitosa que dice "no encontré nada", y
 * contestarla con 404 sería incorrecto. Sin 404 posible, el límite de Suspense
 * no rompe nada.
 *
 * El resto del sitio no lo necesita: la portada, las crónicas, los análisis y
 * las fichas son ISR, se sirven desde el cache y el esqueleto no llegaba a
 * dibujarse. Las que sí tardan —`/cronicas?pagina=3`— son justamente las que
 * tienen que poder contestar 404 cuando la página no existe.
 *
 * **Dibuja la cabecera y el pie de verdad, no su esqueleto.** En este proyecto
 * cada página monta su propio `<Header />` y `<Footer />` —no están en un
 * layout—, así que un `loading` sin ellos haría desaparecer el chrome entero
 * durante la carga y volver a aparecer después: un parpadeo peor que la espera.
 */
export default function Cargando() {
  return (
    <>
      <Header />

      <main
        role="status"
        aria-label="Buscando"
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

        <span className="sr-only">Buscando…</span>
      </main>

      <Footer />
    </>
  )
}
