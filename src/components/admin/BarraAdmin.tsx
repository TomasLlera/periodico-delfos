import Link from 'next/link'
import { ExternalLink, LogOut } from 'lucide-react'
import { salir } from '@/actions/sesion'
import { ToggleTema } from '@/components/layout/ToggleTema'
import type { Autor } from '@/types'

/**
 * El chrome del panel: quién está adentro, la salida al sitio y el logout.
 *
 * Es un Server Component aunque esté en `/admin`. La regla de CLAUDE.md —todo
 * `/admin` es `"use client"`— apunta a las pantallas con estado y mutaciones
 * optimistas; esta barra no tiene estado, y el logout es un `<form>` con un
 * Server Action, que anda sin JavaScript. Hacerla cliente sería mandar al
 * bundle algo que no lo necesita.
 */
export function BarraAdmin({ autor }: { autor: Autor }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-block-bg text-block-text">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/admin" className="marca text-[1.1rem]">
          Delfos
        </Link>

        {/* Las secciones del panel. Se agregan acá y en `docs/admin.md`: una
            pantalla a la que no se llega desde esta barra es una pantalla que
            nadie va a encontrar. */}
        <nav aria-label="Secciones del panel" className="flex flex-wrap items-center gap-1">
          <Seccion href="/admin">Notas</Seccion>
          <Seccion href="/admin/partidos">Partidos</Seccion>
          <Seccion href="/admin/jugadoras">Jugadoras</Seccion>
          <Seccion href="/admin/equipos">Equipos</Seccion>
          {/* El plantel y la tabla de posiciones no tienen link propio: cuelgan
              de una temporada y se entra desde su listado, que es donde ya se
              sabe de cuál. Seis links en la barra la parten en dos renglones
              en un celular. */}
          <Seccion href="/admin/temporadas">Temporadas</Seccion>
          <Seccion href="/admin/posteos">Posteos</Seccion>
          {/* Sólo para editores: un redactor no puede dar de alta una cuenta ni
              cambiar un rol, así que el link lo llevaría a una pantalla que lo
              rebota. La puerta de verdad está en la página y en RLS. */}
          {autor.rol === 'editor' && <Seccion href="/admin/autores">Autores</Seccion>}
        </nav>

        {/* El nombre lleva al perfil: es donde se edita la firma y la bio, y
            el lugar donde alguien la busca es justo donde ve su nombre. */}
        <Link
          href="/admin/perfil"
          className="tactil ml-auto flex items-center px-2 text-[0.85rem] text-block-text/70 hover:underline"
        >
          {autor.nombre}
        </Link>

        <ToggleTema />

        <Link
          href="/"
          target="_blank"
          className="tactil flex items-center gap-1 px-2 text-[0.85rem] hover:underline"
        >
          Ver el sitio
          <ExternalLink size={14} aria-hidden="true" />
        </Link>

        <form action={salir}>
          <button
            type="submit"
            className="tactil flex items-center gap-1 px-2 text-[0.85rem] hover:underline"
          >
            <LogOut size={14} aria-hidden="true" />
            Salir
          </button>
        </form>
      </div>
    </header>
  )
}

/**
 * Un link de la barra.
 *
 * Sin `aria-current`: marcar el activo necesita la ruta actual, que en un
 * Server Component no está, y volver cliente toda la barra por un subrayado
 * sería pagar de más. `NavPrincipal` del sitio público sí lo hace, y por eso
 * es el único `"use client"` del chrome.
 */
function Seccion({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="tactil flex items-center px-2 font-display text-[0.85rem] font-bold hover:underline"
    >
      {children}
    </Link>
  )
}
