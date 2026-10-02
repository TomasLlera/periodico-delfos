'use client'

import { useEffect } from 'react'

/**
 * Prende `data-scrolleado` en `<html>` cuando la página bajó, para que la
 * cabecera fija se achique.
 *
 * **No dibuja nada.** Es la única forma de que `<Header />` siga siendo un
 * Server Component: lo que necesita JavaScript es saber cuánto se scrolleó, no
 * la cabecera entera. Marcar el `<html>` y dejar que el CSS decida qué se achica
 * es además lo que permite que mañana se enganche otra cosa al mismo estado sin
 * tocar este archivo.
 *
 * **Tiene histéresis: compacta a los 72px y vuelve recién abajo de los 24.** Con
 * un solo umbral, la cabecera que se achica mueve el contenido hacia arriba, el
 * scroll cruza el umbral al revés y la cabecera vuelve a crecer: un parpadeo que
 * no termina nunca. Son los dos valores los que lo cortan.
 *
 * **`passive: true` y `requestAnimationFrame`.** Un listener de scroll que no
 * se declara pasivo bloquea el desplazamiento mientras corre, y en un celular
 * eso se siente. El rAF deja una sola lectura por cuadro en lugar de una por
 * evento, que en un trackpad son cientos por segundo.
 *
 * El atributo se pone en un efecto y no en el servidor: el HTML del servidor no
 * puede saber dónde está el scroll, y escribirlo ahí sería una diferencia de
 * hidratación. Al montar se lee la posición real, que es lo que importa cuando
 * alguien entra a una URL con ancla o vuelve atrás a mitad de página.
 */

/** Dónde se achica, y dónde vuelve a crecer. */
const COMPACTA_DESDE = 72
const VUELVE_ABAJO_DE = 24

export function CompactarCabecera() {
  useEffect(() => {
    const raiz = document.documentElement
    let pedido = 0

    const mirar = () => {
      pedido = 0
      const y = window.scrollY

      if (y > COMPACTA_DESDE) raiz.dataset.scrolleado = ''
      else if (y < VUELVE_ABAJO_DE) delete raiz.dataset.scrolleado
    }

    const alScrollear = () => {
      if (pedido) return
      pedido = window.requestAnimationFrame(mirar)
    }

    mirar()
    window.addEventListener('scroll', alScrollear, { passive: true })

    return () => {
      window.removeEventListener('scroll', alScrollear)
      if (pedido) window.cancelAnimationFrame(pedido)
      // Sin esto, una navegación que desmonte la cabecera deja el atributo
      // puesto y la próxima pantalla arranca compactada arriba de todo.
      delete raiz.dataset.scrolleado
    }
  }, [])

  return null
}
