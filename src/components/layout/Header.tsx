import Link from 'next/link'
import { Search } from 'lucide-react'
import { etiquetaTemperatura, temperaturaAccesible } from '@/lib/clima'
import { FechaDeHoy } from './FechaDeHoy'
import { NavPrincipal } from './NavPrincipal'

/**
 * La cabecera de los dos bocetos de `referencia/`.
 *
 * Un solo bloque verde con tres piezas arriba —marca, buscador y fecha— y la
 * navegación abajo, separada por un filete tenue. La marca usa `.marca`, que
 * es Archivo en su eje `wdth` 110: el "eje expandido" que pide el blueprint, y
 * lo único que distingue la marca de un titular cualquiera.
 *
 * **El texto va en blanco fijo y no en `text-tinta`.** `verde-900` es una
 * superficie oscura en los dos temas, así que acá el color lo manda el fondo y
 * no el tema. Antes de esto la cabecera era `.franja` con `text-tinta`, que en
 * el tema crema pintaba texto casi negro sobre verde oscuro: ilegible. Medido:
 * blanco 12.51:1 en claro, 15.32:1 en oscuro.
 *
 * **La tira de resultados que los dos bocetos tienen arriba no va acá adentro**:
 * es `<BarraEstado />`, y la pone el layout raíz, arriba de este componente, en
 * todas las páginas del sitio. Hoy no se dibuja en ninguna porque no hay base
 * —`getEstadoDelSitio()` devuelve todo en `null`—; con datos aparece sola. Se
 * la puede mirar con datos en `/demo/widgets`.
 *
 * **La temperatura es opcional y la pasa la página.** El componente no la
 * consulta: si la leyera él, las diez rutas estáticas del sitio pasarían a
 * revalidarse por una temperatura. Hoy se la pasa sólo la portada, que es donde
 * un diario impreso pone el clima. Sin dato, la cabecera queda como antes.
 */
interface Props {
  /** Grados enteros de Mar del Plata. `null` cuando no se pudieron leer. */
  temperatura?: number | null
}

export function Header({ temperatura = null }: Props) {
  return (
    <header className="bg-verde-900 text-white">
      <div className="mx-auto grid max-w-[1200px] items-end gap-4 px-4 pb-[1.1rem] pt-[1.6rem] md:grid-cols-[auto_1fr_auto] md:gap-8">
        <Link href="/" className="marca text-[2rem] md:text-[2.3rem]">
          Periódico <span className="text-amarillo">Delfos</span>
          <span className="mt-[0.55rem] block text-[0.72rem] font-medium uppercase tracking-[0.14em] text-amarillo [font-variation-settings:'wdth'_100]">
            La voz de las Tiburonas
          </span>
        </Link>

        {/* Un link y no un `<input>`: el buscador es un componente cliente del
            Step 10 y `/buscar` todavía no existe. Un campo de texto que no
            busca nada promete más de lo que hay. */}
        <Link
          href="/buscar"
          className="tactil flex items-center gap-2 border border-white/20 bg-white/10 px-[0.9rem] font-display text-[0.85rem] text-white/70 hover:bg-white/15 hover:text-white"
        >
          <Search size={16} aria-hidden="true" className="shrink-0" />
          Buscar crónicas, jugadoras…
        </Link>

        {/* La línea de fecha del diario: dónde se escribe, cuándo y qué tiempo
            hace. Las dos líneas van con interlineado corto para que se lean
            como un bloque y no como dos datos sueltos. */}
        <div className="dato text-[0.78rem] leading-snug text-white/60 md:text-right">
          <span className="block">
            Mar del Plata
            {temperatura !== null && (
              <>
                <span aria-hidden="true" className="px-1.5 text-white/25">
                  ·
                </span>
                <span className="font-semibold text-amarillo">
                  <span aria-hidden="true">{etiquetaTemperatura(temperatura)}</span>
                  <span className="sr-only">{temperaturaAccesible(temperatura)}</span>
                </span>
              </>
            )}
          </span>
          <FechaDeHoy />
        </div>
      </div>

      <NavPrincipal />
    </header>
  )
}
