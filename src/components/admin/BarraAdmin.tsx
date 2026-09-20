import Link from 'next/link'
import { ExternalLink, LogOut } from 'lucide-react'
import { salir } from '@/actions/sesion'
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
    <header className="sticky top-0 z-10 border-b border-linea bg-verde-900 text-white">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/admin" className="marca text-[1.1rem]">
          Delfos
        </Link>
        <span className="meta text-white/70">Redacción</span>

        <span className="ml-auto text-[0.85rem] text-white/70">{autor.nombre}</span>

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
