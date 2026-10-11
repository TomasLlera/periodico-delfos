import Link from 'next/link'
import { ExternalLink, LogOut } from 'lucide-react'
import { salir } from '@/actions/sesion'
import { MenuAdmin } from '@/components/admin/MenuAdmin'
import { seccionesDe } from '@/components/admin/secciones'
import { ToggleTema } from '@/components/layout/ToggleTema'
import type { Autor } from '@/types'

/**
 * El chrome del panel: quién está adentro, la salida al sitio y el logout.
 *
 * **Son dos barras y no una que se adapta.** De `lg` para arriba, la de
 * siempre: los links en fila y las acciones a la derecha. Abajo de `lg`,
 * `<MenuAdmin />`: una sola fila de 56px con la marca, la sección actual y el
 * botón del menú, y todo lo demás adentro de un cajón.
 *
 * El motivo es de medidas. En un teléfono de 380px los nueve links hacían tres
 * renglones y debajo se apilaban el nombre, el tema, "Ver el sitio" y "Salir":
 * más de 200px de chrome antes de la primera fila de la tabla que se venía a
 * mirar. Hacer que la misma barra "se achique" habría terminado en links de
 * 11px o en un scroll horizontal; son dos formas distintas para dos anchos
 * distintos.
 *
 * **Las dos leen la misma lista** (`secciones.ts`). Antes estaba escrita a mano
 * adentro de este JSX, y dos listas de nueve links que hay que acordarse de
 * tocar juntas son nueve chances de que una pantalla exista en escritorio y no
 * en el teléfono.
 *
 * Sigue siendo un Server Component. La regla de CLAUDE.md —todo `/admin` es
 * `"use client"`— apunta a las pantallas con estado y mutaciones; esta barra no
 * tiene ninguno. El que sí es cliente es el cajón, porque abre, cierra y
 * necesita saber en qué ruta está.
 */
export function BarraAdmin({ autor }: { autor: Autor }) {
  const secciones = seccionesDe(autor.rol)

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-block-bg text-block-text">
      <MenuAdmin secciones={secciones} nombre={autor.nombre} />

      <div className="mx-auto hidden max-w-[1200px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 lg:flex">
        <Link href="/admin" className="marca text-[1.1rem]">
          Delfos
        </Link>

        {/* Las secciones del panel. Se agregan en `secciones.ts` y en
            `docs/admin.md`: una pantalla a la que no se llega desde esta barra
            es una pantalla que nadie va a encontrar. */}
        <nav aria-label="Secciones del panel" className="flex flex-wrap items-center gap-1">
          {secciones.map((seccion) => (
            <Seccion key={seccion.href} href={seccion.href}>
              {seccion.etiqueta}
            </Seccion>
          ))}
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
 * Un link de la barra de escritorio.
 *
 * Sin `aria-current`: marcar el activo necesita la ruta actual, que en un
 * Server Component no está, y volver cliente toda la barra por un subrayado
 * sería pagar de más. En el cajón de celular sí se marca, porque ahí ya hay un
 * componente cliente que conoce la ruta.
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
