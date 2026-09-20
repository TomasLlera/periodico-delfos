'use client'

/**
 * La barra de compartir. **WhatsApp primero.**
 *
 * Es la omisión más cara del sitio actual (blueprint 7.3): la nota se
 * distribuye por WhatsApp y hoy no hay un botón para mandarla. El orden no es
 * estético, es el orden en que se usa.
 *
 * Sobre Instagram Stories, que el blueprint pide: **no existe un link web que
 * abra Stories con la nota cargada.** Las historias sólo se pueden componer
 * desde la app, y el único camino real desde el navegador es la hoja de
 * compartir del sistema, que en el celular lista Instagram. Por eso el botón
 * "Compartir" usa `navigator.share` y aparece **sólo si el navegador lo
 * soporta**: un botón de Instagram que no lleva a ningún lado sería peor que
 * no tenerlo.
 *
 * Es el único `"use client"` del sitio público, junto con el buscador: necesita
 * `navigator.share`, el portapapeles y estado para el "¡Copiado!".
 *
 * **"Más" y "Copiar link" son excluyentes, y son el mismo botón.** Donde hay
 * `navigator.share` —el celular— la hoja del sistema ya trae "Copiar" adentro,
 * así que el botón de copiar sería una segunda puerta a lo mismo; donde no la
 * hay —el escritorio— copiar es justamente lo único que reemplaza a WhatsApp
 * para mandar la nota por otro lado. Mostrar los dos dejaba cuatro círculos y
 * un rótulo, que en 390px se parte en dos filas.
 *
 * Quedan **tres círculos siempre**, en cualquier ancho y en los dos casos.
 */

import { useEffect, useState } from 'react'
import { Check, Link2, MessageCircle, Share2 } from 'lucide-react'

interface Props {
  /** URL absoluta y canónica de la nota. */
  url: string
  titulo: string
  /**
   * El rótulo de la izquierda. La nota lo usa dos veces con textos distintos:
   * arriba alcanza "Compartir", y al final —donde ya se leyó todo— "Compartí
   * esta nota" pide algo en vez de sólo nombrar los botones.
   */
  etiqueta?: string
}

export function BotonesCompartir({ url, titulo, etiqueta = 'Compartir' }: Props) {
  const [copiado, setCopiado] = useState(false)
  const [puedeCompartir, setPuedeCompartir] = useState(false)

  // Se resuelve después del montaje: en el servidor no hay `navigator`, y
  // decidirlo durante el render rompería la hidratación.
  useEffect(() => {
    setPuedeCompartir(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  // El "¡Copiado!" vuelve solo a su estado original.
  useEffect(() => {
    if (!copiado) return
    const id = setTimeout(() => setCopiado(false), 2000)
    return () => clearTimeout(id)
  }, [copiado])

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
    } catch {
      // Sin permiso de portapapeles no se hace nada: el link está en la barra
      // de direcciones. Un alert de error acá no le sirve a nadie.
    }
  }

  async function compartir() {
    try {
      await navigator.share({ title: titulo, url })
    } catch {
      // Incluye el caso normal de que la persona cierre la hoja de compartir.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="meta mr-1">{etiqueta}</span>

      <EnlaceCompartir
        href={`https://wa.me/?text=${encodeURIComponent(`${titulo} ${url}`)}`}
        etiqueta="Compartir por WhatsApp"
      >
        <MessageCircle size={16} aria-hidden="true" />
        <Rotulo>WhatsApp</Rotulo>
      </EnlaceCompartir>

      <EnlaceCompartir
        href={`https://x.com/intent/tweet?text=${encodeURIComponent(titulo)}&url=${encodeURIComponent(url)}`}
        etiqueta="Compartir en X"
      >
        <LogoX />
        <Rotulo>X</Rotulo>
      </EnlaceCompartir>

      {/* Uno o el otro, nunca los dos: ver el comentario de arriba. */}
      {puedeCompartir ? (
        <BotonCompartir onClick={compartir} etiqueta="Abrir opciones para compartir">
          <Share2 size={16} aria-hidden="true" />
          <Rotulo>Más</Rotulo>
        </BotonCompartir>
      ) : (
        <BotonCompartir onClick={copiar} etiqueta="Copiar el link de la nota">
          {copiado ? (
            <>
              <Check size={16} aria-hidden="true" />
              <Rotulo>¡Copiado!</Rotulo>
            </>
          ) : (
            <>
              <Link2 size={16} aria-hidden="true" />
              <Rotulo>Copiar link</Rotulo>
            </>
          )}
        </BotonCompartir>
      )}

      {/* El cambio a "¡Copiado!" es visual; sin esto un lector de pantalla no
          se entera de que la acción funcionó. */}
      <span role="status" aria-live="polite" className="sr-only">
        {copiado ? 'Link copiado al portapapeles' : ''}
      </span>
    </div>
  )
}

/**
 * Círculos con anillo verde y el icono solo: 40px en móvil, 44 desde `sm`.
 *
 * Con los cuatro rótulos al lado del icono la barra no entraba en 390px y se
 * partía en dos o tres filas. Lo primero que se sacó fue el texto, que en
 * WhatsApp y X es redundante con un logo que todo el mundo reconoce.
 *
 * **En móvil miden 40px y no 44, que es la única excepción a `.tactil` del
 * sitio.** Es deliberada y vale anotar el costo: 44px es el criterio 2.5.5 de
 * WCAG, que es AAA. El que rige a nivel AA es el 2.5.8, que pide 24px, y estos
 * botones lo cumplen con holgura incluso a 40 —además el `gap-2` entre ellos
 * satisface la excepción por espaciado—. O sea que se pierde el AAA en este
 * control y sólo en móvil, a cambio de que la barra entre en una línea.
 *
 * Si alguna vez se decide volver a 44, es cambiar `size-10` por `size-11` y
 * borrar este párrafo.
 *
 * Redondos y no cuadrados porque es la forma con la que se leen estos botones
 * en cualquier sitio de noticias: un icono en un círculo es "compartir en",
 * antes de leer nada.
 *
 * El texto no desaparece, se vuelve invisible: cada botón lleva su `aria-label`
 * y el rótulo va en un `sr-only`, así que el árbol de accesibilidad queda igual
 * que cuando el texto se veía.
 *
 * El hover invierte a `verde-900`, que es una superficie del sistema y lleva
 * texto blanco en los dos temas.
 */
// Sin `.tactil`: esa clase fija `min-width: 44px` y le ganaría a `size-10`.
const ESTILO_BOTON =
  'flex size-10 shrink-0 items-center justify-center rounded-full border border-verde-600 text-tinta transition-colors hover:bg-verde-900 hover:text-white sm:size-11'

/** El rótulo de cada botón: sólo para lectores de pantalla. */
function Rotulo({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>
}

function EnlaceCompartir({
  href,
  etiqueta,
  children,
}: {
  href: string
  etiqueta: string
  children: React.ReactNode
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={etiqueta} className={ESTILO_BOTON}>
      {children}
    </a>
  )
}

function BotonCompartir({
  onClick,
  etiqueta,
  children,
}: {
  onClick: () => void
  etiqueta: string
  children: React.ReactNode
}) {
  return (
    <button type="button" onClick={onClick} aria-label={etiqueta} className={ESTILO_BOTON}>
      {children}
    </button>
  )
}

/** lucide v1 ya no trae logos de marca. Misma excepción que en `CajaAutor`. */
function LogoX() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.9 2H22l-7.1 8.1L23.2 22h-6.5l-5.1-6.6L5.8 22H2.7l7.6-8.7L1.9 2h6.6l4.6 6.1L18.9 2Zm-1.1 18h1.7L7.3 3.8H5.5L17.8 20Z" />
    </svg>
  )
}
