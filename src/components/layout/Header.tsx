import Link from 'next/link'
import { etiquetaTemperatura, temperaturaAccesible } from '@/lib/clima'
import { BuscadorHeader } from './BuscadorHeader'
import { FechaDeHoy } from './FechaDeHoy'
import { NavPrincipal } from './NavPrincipal'
import { ToggleTema } from './ToggleTema'

/**
 * La cabecera de los dos bocetos de `referencia/`.
 *
 * Un solo bloque oscuro con tres piezas arriba —marca, buscador y fecha— y la
 * navegación abajo, separada por un filete tenue. La marca usa `.marca`, que
 * es Archivo en su eje `wdth` 110: el "eje expandido" que pide el blueprint, y
 * lo único que distingue la marca de un titular cualquiera.
 *
 * **En celular la cabecera es una sola fila de unos 70px**: la marca a la
 * izquierda y la lupa a la derecha. Antes eran tres bloques apilados —marca,
 * campo de búsqueda y fecha— que medían más de 200px, o sea un tercio de la
 * pantalla ocupado por chrome antes de la primera noticia. El campo se
 * despliega tocando la lupa (ver `<BuscadorHeader />`) y la línea de fecha y
 * clima se apaga: son datos de diario impreso, y en un celular le ganan el
 * lugar al titular. De 768 para arriba vuelven las tres piezas del boceto.
 *
 * **El texto va en `header-text` y no en `text-text`.** `header-bg` es una
 * superficie oscura en los dos temas, así que acá el color lo manda el fondo y
 * no el tema: `text-text` en claro pintaría tinta sobre tinta. Medido:
 * 15.27:1 en claro, 15.58:1 en oscuro; "Delfos" en `block-accent`, 7.25:1.
 *
 * **Se eligió la cabecera oscura y no la crema con filete dorado.** Las dos
 * pasan AA, pero en la crema el dorado de "Delfos" tiene que bajar a
 * `accent-text` (5.56:1) y pierde el brillo de la marca; sobre tinta va el
 * dorado pleno a 7.25:1, y la cabecera no se confunde con el cuerpo.
 *
 * En oscuro la cabecera es un escalón más clara que la página (#181818 contra
 * #0E0E0E): lo separa el filete `block-border`, que en claro es invisible.
 *
 * **La tira de resultados que los dos bocetos tienen arriba no va acá adentro**:
 * es `<BarraEstado />`, y la pone el layout raíz, arriba de este componente, en
 * todas las páginas del sitio.
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
    <header className="border-b border-block-border bg-header-bg text-header-text">
      {/* `relative` para el panel del buscador, que en celular se despliega
          posicionado contra esta caja en lugar de empujar la nav. */}
      <div className="contenedor relative flex items-center justify-between gap-4 py-3 md:grid md:items-end md:gap-8 md:pb-[1.1rem] md:pt-[1.6rem] md:grid-cols-[auto_1fr_auto]">
        <Link href="/" className="marca min-w-0 text-[1.7rem] md:text-[2.3rem]">
          Periódico <span className="text-block-accent">Delfos</span>
          <span className="mt-[0.3rem] block text-[0.6rem] font-medium uppercase tracking-[0.14em] text-block-accent [font-variation-settings:'wdth'_100] md:mt-[0.55rem] md:text-[0.72rem]">
            La voz de las Tiburonas
          </span>
        </Link>

        {/* El buscador y el toggle de tema comparten la celda del medio: en
            celular son los dos botones de 44px a la derecha de la marca. */}
        <div className="flex items-center gap-2 md:gap-3">
          <BuscadorHeader />
          <ToggleTema />
        </div>

        {/* La línea de fecha del diario: dónde se escribe, cuándo y qué tiempo
            hace. Las dos líneas van con interlineado corto para que se lean
            como un bloque y no como dos datos sueltos. Se apaga en celular: son
            datos de diario impreso y ahí le ganan el lugar al titular. */}
        <div className="dato hidden text-[0.78rem] leading-snug text-header-text/60 md:block md:text-right">
          <span className="block">
            Mar del Plata
            {temperatura !== null && (
              <>
                <span aria-hidden="true" className="px-1.5 text-header-text/25">
                  ·
                </span>
                <span className="font-semibold text-block-accent">
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
