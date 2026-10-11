'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ExternalLink, LogOut, Menu, X } from 'lucide-react'
import { salir } from '@/actions/sesion'
import { ToggleTema } from '@/components/layout/ToggleTema'
import { seccionActiva, type SeccionAdmin } from '@/components/admin/secciones'

/**
 * La barra del panel en celular: marca, sección actual y el botón del menú.
 *
 * **Reemplaza a una cabecera que ocupaba media pantalla.** Los nueve links
 * hacían tres renglones y debajo se apilaban el nombre, el tema, "Ver el sitio"
 * y "Salir": en un teléfono de 380px eso era más de 200px de chrome antes de la
 * primera fila de la tabla que se venía a mirar. Ahora es una fila de 56px.
 *
 * **El cajón es un `<dialog>` con `showModal()`**, que es el mismo patrón que
 * `<Ventana />` y por la misma razón: la trampa de foco, el cierre con Escape,
 * el `::backdrop` y devolver el foco al botón al cerrar vienen de fábrica.
 * Escritos a mano son doscientas líneas y tres bugs.
 *
 * Lo que sí hay que escribir son las tres cortesías que `<dialog>` no trae: el
 * bloqueo del scroll de atrás, cerrar al tocar el fondo, y cerrar al cambiar de
 * ruta —sin eso, tocar un link deja el cajón abierto encima de la pantalla
 * nueva—.
 *
 * De `lg` para arriba esto no existe: la barra de siempre está intacta.
 */
interface Props {
  secciones: readonly SeccionAdmin[]
  nombre: string
}

export function MenuAdmin({ secciones, nombre }: Props) {
  const ruta = usePathname()
  const cajon = useRef<HTMLDialogElement>(null)
  const [abierto, setAbierto] = useState(false)

  const actual = seccionActiva(ruta, secciones)

  // Abrir y cerrar de verdad el `<dialog>`, que no se maneja con una prop.
  useEffect(() => {
    const dialogo = cajon.current
    if (!dialogo) return

    if (abierto && !dialogo.open) dialogo.showModal()
    if (!abierto && dialogo.open) dialogo.close()
  }, [abierto])

  // El scroll de atrás. `showModal()` lo frena en casi todos los navegadores,
  // pero no en todos los de iOS, que es justo donde esto se usa.
  useEffect(() => {
    if (!abierto) return

    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previo
    }
  }, [abierto])

  // Al cambiar de ruta el cajón se cierra solo. Sin esto, tocar un link deja el
  // menú abierto tapando la pantalla a la que se acaba de llegar.
  useEffect(() => {
    setAbierto(false)
  }, [ruta])

  return (
    <div className="lg:hidden">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-3 px-4">
        <Link href="/admin" className="marca text-[1.05rem]">
          Delfos
        </Link>

        {/* Dónde está parado, que es lo que la barra de escritorio dice con el
            link resaltado y acá no tiene lugar para decir de otra forma. */}
        {actual && (
          <span className="meta min-w-0 truncate text-block-text/60">{actual.etiqueta}</span>
        )}

        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-expanded={abierto}
          aria-controls="cajon-admin"
          aria-label="Abrir el menú del panel"
          className="tactil ml-auto flex min-w-11 items-center justify-center rounded-sm border border-block-text/20 bg-block-text/10"
        >
          <Menu size={18} aria-hidden="true" />
        </button>
      </div>

      <dialog
        ref={cajon}
        id="cajon-admin"
        onClose={() => setAbierto(false)}
        // Tocar el fondo cierra. El `<dialog>` ocupa la pantalla entera y el
        // panel es el hijo: si el click fue en el diálogo y no adentro del
        // panel, fue en el fondo.
        onClick={(evento) => {
          if (evento.target === cajon.current) setAbierto(false)
        }}
        className="m-0 ml-auto h-dvh max-h-dvh w-[min(20rem,85vw)] max-w-none bg-transparent p-0 backdrop:bg-overlay/70"
      >
        <div className="flex h-full flex-col bg-block-bg text-block-text">
          <div className="flex items-center gap-3 border-b border-block-text/15 px-4 py-3">
            <span className="marca text-[1.05rem]">Delfos</span>

            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar el menú"
              className="tactil ml-auto flex min-w-11 items-center justify-center rounded-sm border border-block-text/20 bg-block-text/10"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Secciones del panel" className="flex-1 overflow-y-auto overscroll-contain">
            <ul className="flex flex-col py-2">
              {secciones.map((seccion) => {
                const activa = actual?.href === seccion.href

                return (
                  <li key={seccion.href}>
                    <Link
                      href={seccion.href}
                      aria-current={activa ? 'page' : undefined}
                      className={`tactil flex items-center px-4 font-display text-[0.95rem] font-bold ${
                        activa
                          ? 'bg-block-text text-block-bg'
                          : 'text-block-text hover:bg-block-text/10'
                      }`}
                    >
                      {seccion.etiqueta}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* El pie: quién está adentro y las tres salidas. Van juntas y abajo
              porque se usan una vez por sesión, al revés que los links. */}
          <div className="flex flex-col gap-1 border-t border-block-text/15 p-2">
            <Link
              href="/admin/perfil"
              className="tactil flex items-center px-2 text-[0.9rem] text-block-text/70 hover:underline"
            >
              {nombre}
            </Link>

            <div className="flex items-center gap-2">
              <ToggleTema />

              <Link
                href="/"
                target="_blank"
                className="tactil flex flex-1 items-center gap-2 px-2 text-[0.9rem] hover:underline"
              >
                Ver el sitio
                <ExternalLink size={14} aria-hidden="true" />
              </Link>
            </div>

            <form action={salir}>
              <button
                type="submit"
                className="tactil flex w-full items-center gap-2 px-2 text-left text-[0.9rem] hover:underline"
              >
                <LogOut size={14} aria-hidden="true" />
                Salir
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  )
}
