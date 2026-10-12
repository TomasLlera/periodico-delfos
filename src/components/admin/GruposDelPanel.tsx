'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { grupoActivo, seccionActiva, type GrupoAdmin } from '@/components/admin/secciones'

/**
 * La fila de categorías de la barra de escritorio.
 *
 * **Es cliente y el resto de la barra no**, que es la misma división que con
 * `<MenuAdmin />`: `<BarraAdmin />` no tiene estado y se queda en el servidor;
 * lo que necesita saber si un desplegable está abierto y en qué ruta estamos
 * vive acá, en el pedazo más chico posible.
 *
 * **Uno abierto por vez.** El estado es el título del grupo abierto y no un
 * booleano por grupo: abrir "Fútbol" con "Contenido" todavía desplegado deja
 * dos listas encimadas sobre el contenido de la página.
 *
 * Las tres cortesías que un desplegable necesita y nadie regala: cerrar con
 * Escape **devolviendo el foco al botón** —si no, el foco queda en un elemento
 * que acaba de desaparecer y el siguiente Tab arranca desde el principio del
 * documento—, cerrar al tocar afuera, y cerrar al cambiar de ruta.
 *
 * **La lista se renderiza siempre y se esconde con `hidden`**, en vez de
 * montarse y desmontarse. Así el `aria-controls` del botón apunta a algo que
 * existe, y un elemento con `hidden` no es foqueable, así que los links de un
 * grupo cerrado tampoco aparecen en el recorrido del Tab.
 */
interface Props {
  grupos: readonly GrupoAdmin[]
}

/** Para el `id` del `aria-controls`: "Administración" → "administracion". */
function identificador(titulo: string): string {
  return `grupo-${titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z]/g, '')}`
}

const BOTON =
  'tactil flex items-center gap-1 whitespace-nowrap px-2 font-display text-[0.85rem] font-bold'

export function GruposDelPanel({ grupos }: Props) {
  const ruta = usePathname()
  const barra = useRef<HTMLUListElement>(null)
  const [abierto, setAbierto] = useState<string | null>(null)

  const todas = grupos.flatMap((grupo) => grupo.secciones)
  const actual = seccionActiva(ruta, todas)
  const activo = grupoActivo(ruta, grupos)

  // Al navegar se cierra solo: sin esto, el desplegable queda abierto tapando
  // la pantalla a la que se acaba de llegar.
  useEffect(() => {
    setAbierto(null)
  }, [ruta])

  // Tocar afuera cierra. `pointerdown` y no `click` para que cierre apenas se
  // aprieta, antes de que el click llegue a lo que haya debajo.
  useEffect(() => {
    if (abierto === null) return

    function afuera(evento: PointerEvent) {
      if (!barra.current?.contains(evento.target as Node)) setAbierto(null)
    }

    document.addEventListener('pointerdown', afuera)
    return () => document.removeEventListener('pointerdown', afuera)
  }, [abierto])

  return (
    <ul ref={barra} className="flex flex-wrap items-center gap-x-1">
      {grupos.map((grupo) => {
        // Una sección suelta: va como link, sin botón ni lista de uno.
        if (grupo.titulo === null) {
          const sola = grupo.secciones[0]
          const aqui = actual?.href === sola.href

          return (
            <li key={sola.href}>
              <Link
                href={sola.href}
                aria-current={aqui ? 'page' : undefined}
                className={`${BOTON} ${aqui ? 'underline underline-offset-4' : 'hover:underline'}`}
              >
                {sola.etiqueta}
              </Link>
            </li>
          )
        }

        return (
          <Desplegable
            key={grupo.titulo}
            grupo={grupo}
            abierto={abierto === grupo.titulo}
            alCambiar={(valor) => setAbierto(valor ? grupo.titulo : null)}
            tieneLaActual={activo?.titulo === grupo.titulo}
            hrefActual={actual?.href ?? null}
          />
        )
      })}
    </ul>
  )
}

/**
 * Un grupo con su lista.
 *
 * El grupo donde estamos parados va subrayado: es lo único que dice "lo que
 * estás mirando está acá adentro" cuando la lista está cerrada y la sección
 * actual no se ve.
 */
function Desplegable({
  grupo,
  abierto,
  alCambiar,
  tieneLaActual,
  hrefActual,
}: {
  grupo: GrupoAdmin
  abierto: boolean
  alCambiar: (abierto: boolean) => void
  tieneLaActual: boolean
  hrefActual: string | null
}) {
  const boton = useRef<HTMLButtonElement>(null)
  const titulo = grupo.titulo as string
  const id = identificador(titulo)

  return (
    <li
      className="relative"
      onKeyDown={(evento) => {
        if (evento.key !== 'Escape' || !abierto) return
        alCambiar(false)
        boton.current?.focus()
      }}
    >
      <button
        ref={boton}
        type="button"
        onClick={() => alCambiar(!abierto)}
        aria-expanded={abierto}
        aria-controls={id}
        className={`${BOTON} ${tieneLaActual ? 'underline underline-offset-4' : 'hover:underline'}`}
      >
        {titulo}
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`transition-transform motion-reduce:transition-none ${abierto ? 'rotate-180' : ''}`}
        />
      </button>

      <ul
        id={id}
        hidden={!abierto}
        className="absolute left-0 top-full z-20 min-w-44 border border-block-text/20 bg-block-bg py-1 shadow-lg"
      >
        {grupo.secciones.map((seccion) => {
          const aqui = hrefActual === seccion.href

          return (
            <li key={seccion.href}>
              <Link
                href={seccion.href}
                aria-current={aqui ? 'page' : undefined}
                className={`tactil flex items-center whitespace-nowrap px-3 text-[0.85rem] ${
                  aqui ? 'bg-block-text text-block-bg' : 'hover:bg-block-text/10'
                }`}
              >
                {seccion.etiqueta}
              </Link>
            </li>
          )
        })}
      </ul>
    </li>
  )
}
