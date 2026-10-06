import Link from 'next/link'
import { etiquetaTemperatura, temperaturaAccesible } from '@/lib/clima'
import { BuscadorHeader } from './BuscadorHeader'
import { CompactarCabecera } from './CompactarCabecera'
import { FechaDeHoy } from './FechaDeHoy'
import { NavPrincipal } from './NavPrincipal'
import { ToggleTema } from './ToggleTema'

/**
 * La cabecera del sitio: la marca y los controles quedan fijos arriba y se
 * achican al bajar; las secciones se van con el scroll.
 *
 * Un solo bloque oscuro con la marca a la izquierda, la línea de fecha y clima
 * a la derecha y, al final, los botones. La marca usa `.marca`, que es Archivo
 * en su eje `wdth` 110: el "eje expandido" que pide el blueprint, y lo único que
 * distingue la marca de un titular cualquiera.
 *
 * **Lo que queda fijo es sólo esta fila**, y por eso `<NavPrincipal />` quedó
 * afuera del `<header>` en lugar de adentro. `position: sticky` pega el elemento
 * entero y lo encierra en el alto de su padre: con la nav adentro, o se pegaban
 * las dos —unos 150px de chrome persiguiendo al lector por una crónica— o no se
 * pegaba ninguna. Son dos cajas porque son dos comportamientos.
 *
 * **Nada se pierde de semántica**: la nav tiene su propio landmark
 * (`<nav aria-label="Secciones">`), así que un lector de pantalla la encuentra
 * igual estando al lado del `<header>` y no adentro. Lo que sí se mudó son el
 * fondo y el filete, que antes heredaba de acá: ahora los lleva ella.
 *
 * **Se compacta al bajar.** Se apagan la bajada de la marca y la línea de fecha,
 * y la marca se achica: la fila pasa de unos 90px a unos 56px. La fecha y el
 * clima son datos de diario impreso: valen en la tapa, no persiguiendo al lector
 * hasta el pie. Quién prende el estado es `<CompactarCabecera />` —un componente
 * que no dibuja nada—, y qué se achica lo decide el CSS de `globals.css`, bajo
 * `html[data-scrolleado]`.
 *
 * **El buscador es una lupa en todos los anchos, y no un campo.** Antes era un
 * campo desplegable en celular y un campo siempre visible de 768 para arriba.
 * Con la cabecera fija ese campo se lleva la mitad del alto que hay que ahorrar,
 * y además obliga a elegir entre un campo angosto o una marca chica. El panel se
 * abre tocando la lupa y sigue andando sin JavaScript: ver `<BuscadorHeader />`.
 *
 * **Los tres botones de la derecha son del mismo tamaño y comparten el borde**:
 * la lupa, el tema y el hueco donde va a ir el ingreso. No son iconos sueltos
 * sino una fila de controles, que es lo que hace que se lean como un grupo y no
 * como tres adornos.
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
 * es `<BarraEstado />`, y la pone el layout raíz, arriba de este componente. Esa
 * sí se va con el scroll, a propósito: es el estado del campeonato, no una
 * herramienta, y repetirlo fijo en pantalla le saca sitio al titular.
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
    <>
      <header className="cabecera sticky top-0 z-30 border-b border-block-border bg-header-bg text-header-text">
        <CompactarCabecera />

        <div className="cabecera-fila contenedor flex items-center justify-between gap-4 py-3 md:gap-8 md:py-4">
          <Link href="/" className="marca cabecera-marca min-w-0 text-[1.7rem] md:text-[2.3rem]">
            Periódico <span className="text-block-accent">Delfos</span>
            <span className="cabecera-bajada mt-[0.3rem] block text-[0.6rem] font-medium uppercase tracking-[0.14em] text-block-accent [font-variation-settings:'wdth'_100] md:mt-[0.55rem] md:text-[0.72rem]">
              El diario de las Tiburonas
            </span>
          </Link>

          <div className="flex items-center gap-2 md:gap-4">
            {/* La línea de fecha del diario: dónde se escribe, cuándo y qué tiempo
                hace. Las dos líneas van con interlineado corto para que se lean
                como un bloque y no como dos datos sueltos. Se apaga en celular
                —son datos de diario impreso y ahí le ganan el lugar al titular— y
                también al compactar, por lo mismo. */}
            <div className="cabecera-datos dato hidden text-[0.78rem] leading-snug text-header-text/60 md:block md:text-right">
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

            {/* Los controles. Son los únicos que sobreviven a la compactación:
                lo que se usa en cada visita se queda, lo que se lee una vez se va. */}
            <div className="flex items-center gap-2">
              <BuscadorHeader />
              <ToggleTema />

              {/* EL HUECO DEL INGRESO, todavía sin botón.
                
                  Está reservado y no es un olvido: el día que haya cuentas de
                  lector —o un acceso directo al panel— el botón entra acá, con el
                  mismo tamaño que los otros dos, y nada se mueve de lugar. Pedido
                  de Charlie, que lo quiso previsto desde ahora.

                  Va `aria-hidden` y vacío: un botón que todavía no hace nada se
                  anuncia igual a quien usa lector de pantalla y se aprieta igual
                  con el teclado. Un hueco no. En celular no se reserva: ahí el
                  ancho es el recurso escaso y el botón, cuando exista, va a tener
                  que entrar sacando otra cosa. */}
              <div aria-hidden="true" className="hidden w-11 shrink-0 md:block" />
            </div>
          </div>
        </div>

      </header>

      {/* Afuera del `<header>` y sin pegarse: las secciones se leen al entrar y
          se eligen una vez. Es `sticky` lo que obliga a separarlas —ver el
          comentario de arriba—, no el gusto. */}
      <NavPrincipal />
    </>
  )
}
