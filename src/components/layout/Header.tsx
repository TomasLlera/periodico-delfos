import Link from 'next/link'
import { etiquetaTemperatura, temperaturaAccesible } from '@/lib/clima'
import { BuscadorHeader } from './BuscadorHeader'
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
 * **En celular la cabecera es una sola fila de unos 70px**: la marca a la
 * izquierda y la lupa a la derecha. Antes eran tres bloques apilados —marca,
 * campo de búsqueda y fecha— que medían más de 200px, o sea un tercio de la
 * pantalla ocupado por chrome antes de la primera noticia. El campo se
 * despliega tocando la lupa (ver `<BuscadorHeader />`) y la línea de fecha y
 * clima se apaga: son datos de diario impreso, y en un celular le ganan el
 * lugar al titular. De 768 para arriba vuelven las tres piezas del boceto.
 *
 * **El texto va en blanco fijo y no en `text-tinta`.** `verde-900` es una
 * superficie oscura en los dos temas, así que acá el color lo manda el fondo y
 * no el tema. Antes de esto la cabecera era `.franja` con `text-tinta`, que en
 * el tema crema pintaba texto casi negro sobre verde oscuro: ilegible. Medido:
 * blanco 12.51:1 en claro, 15.32:1 en oscuro.
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
    <header className="bg-verde-900 text-white">
      {/* `relative` para el panel del buscador, que en celular se despliega
          posicionado contra esta caja en lugar de empujar la nav. */}
      <div className="contenedor relative flex items-center justify-between gap-4 py-3 md:grid md:items-end md:gap-8 md:pb-[1.1rem] md:pt-[1.6rem] md:grid-cols-[auto_1fr_auto]">
        <Link href="/" className="marca min-w-0 text-[1.7rem] md:text-[2.3rem]">
          Periódico <span className="text-amarillo">Delfos</span>
          <span className="mt-[0.3rem] block text-[0.6rem] font-medium uppercase tracking-[0.14em] text-amarillo [font-variation-settings:'wdth'_100] md:mt-[0.55rem] md:text-[0.72rem]">
            La voz de las Tiburonas
          </span>
        </Link>

        <BuscadorHeader />

        {/* La línea de fecha del diario: dónde se escribe, cuándo y qué tiempo
            hace. Las dos líneas van con interlineado corto para que se lean
            como un bloque y no como dos datos sueltos. Se apaga en celular: son
            datos de diario impreso y ahí le ganan el lugar al titular. */}
        <div className="dato hidden text-[0.78rem] leading-snug text-white/60 md:block md:text-right">
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
