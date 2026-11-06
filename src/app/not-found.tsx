import Link from 'next/link'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'

/**
 * La página que se ve cuando algo no existe.
 *
 * **Antes no había ninguna**, así que salía la de Next: "This page could not be
 * found", en inglés y sin un solo link. Incumplía la regla no negociable 9
 * —todo string en español— en la única pantalla que ve quien llegó siguiendo un
 * link roto, que es justo cuando hay que ayudarlo a quedarse.
 *
 * **Es la segunda mitad de un arreglo.** La primera fue el código HTTP: el
 * sitio devolvía 200 en todas las páginas inexistentes porque un `loading.tsx`
 * en la raíz abría la respuesta antes de que el `notFound()` llegara (ver
 * `src/app/buscar/loading.tsx`). Con el status ya en 404, faltaba que lo que se
 * lee también estuviera bien.
 *
 * La usan las dos formas de no existir, y por eso el texto no nombra ninguna:
 * una URL que el router no reconoce, y una ruta que existe pero cuya fila no
 * está en la base —una nota borrada, un partido que nunca se cargó—, que es la
 * que llama `notFound()`. Decir "esta nota no existe" sería mentir en la mitad
 * de los casos.
 *
 * **Lleva `Header` y `Footer` de verdad.** En este proyecto cada página monta
 * su propio chrome —no está en un layout—, así que sin ellos el 404 aparecería
 * como una pantalla pelada, sin menú ni buscador: exactamente lo que no hay que
 * hacer con alguien que ya no encontró lo que buscaba. Puede hacerlo porque es
 * un Server Component, al revés que `error.tsx`, que tiene que ser cliente para
 * su botón de reintentar.
 *
 * **No exporta `metadata`.** El `<title>` lo pone el layout raíz y queda
 * "Periódico Delfos". Un `generateMetadata` de la ruta que falló puede ganarle
 * —en local se ve "Nota no encontrada"— y eso no se puede controlar desde acá.
 */
export default function NoEncontrado() {
  return (
    <>
      <Header />

      <main className="mx-auto flex max-w-[700px] flex-col gap-4 px-4 py-16">
        <p className="meta text-text-muted">Error 404</p>

        <h1 className="titular text-[1.8rem]">No encontramos esta página</h1>

        <p className="max-w-[60ch] text-[1.05rem] text-text-soft">
          Puede que la dirección esté mal escrita, o que la nota que buscabas ya no esté
          publicada. Lo que sigue en el sitio está acá abajo.
        </p>

        <nav aria-label="Dónde seguir" className="mt-2 flex flex-wrap gap-3">
          <Link
            href="/"
            className="tactil flex items-center bg-text px-5 font-display text-[0.9rem] font-extrabold text-bg hover:bg-text/85"
          >
            Ir a la portada
          </Link>

          <Link
            href="/cronicas"
            className="tactil flex items-center border border-border-control px-5 font-display text-[0.9rem] font-bold hover:bg-bg-muted"
          >
            Las crónicas
          </Link>

          <Link
            href="/buscar"
            className="tactil flex items-center border border-border-control px-5 font-display text-[0.9rem] font-bold hover:bg-bg-muted"
          >
            Buscar
          </Link>
        </nav>
      </main>

      <Footer />
    </>
  )
}
