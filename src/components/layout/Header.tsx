import Link from 'next/link'
import { Search } from 'lucide-react'
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
 * es `<BarraEstado />`, y la pone la página, arriba de este componente. No está
 * en ninguna ruta pública todavía —necesita `partidos` cargado, Step 19— y se
 * la puede mirar en `/demo/widgets`. Rellenarla con marcadores de ejemplo viola
 * la regla no negociable 1: un resultado inventado en el borde superior del
 * sitio real es peor que no tener la tira.
 */
export function Header() {
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

        <div className="dato text-[0.78rem] leading-relaxed text-white/60 md:text-right">
          <span className="block">Mar del Plata</span>
          <FechaDeHoy />
        </div>
      </div>

      <NavPrincipal />
    </header>
  )
}
