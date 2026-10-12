import Link from 'next/link'
import { ExternalLink, LogOut } from 'lucide-react'
import { salir } from '@/actions/sesion'
import { GruposDelPanel } from '@/components/admin/GruposDelPanel'
import { MenuAdmin } from '@/components/admin/MenuAdmin'
import { gruposDe } from '@/components/admin/secciones'
import { ToggleTema } from '@/components/layout/ToggleTema'
import type { Autor } from '@/types'

/**
 * El chrome del panel: quién está adentro, la salida al sitio y el logout.
 *
 * **Son dos barras y no una que se adapta.** De `lg` para arriba, la de
 * escritorio. Abajo de `lg`, `<MenuAdmin />`: una sola fila de 56px con la
 * marca, la sección actual y el botón del menú, y todo lo demás adentro de un
 * cajón.
 *
 * El motivo es de medidas. En un teléfono de 380px los links hacían tres
 * renglones y debajo se apilaban el nombre, el tema, "Ver el sitio" y "Salir":
 * más de 200px de chrome antes de la primera fila de la tabla que se venía a
 * mirar. Hacer que la misma barra "se achique" habría terminado en links de
 * 11px o en un scroll horizontal; son dos formas distintas para dos anchos
 * distintos.
 *
 * **La de escritorio volvió a ser un solo renglón, y pudo volver porque las
 * secciones ahora son cuatro categorías y no diez links.** Con los diez sueltos
 * no entraban, y las tres formas de hacerlos entrar fallaron, cada una peor que
 * la anterior: con `flex-wrap` se caía "Salir" solo al segundo renglón, con
 * scroll horizontal quedaban cortadas las últimas dos sin ningún indicio de que
 * se podía scrollear —una sección escondida es una pantalla que deja de
 * existir—, y achicar la tipografía compraba ochenta píxeles hasta la próxima
 * sección que se agregara.
 *
 * Agrupadas (`secciones.ts`) el problema se termina de raíz: lo que crece
 * cuando Charlie suma una pantalla es el largo de un desplegable, no el ancho
 * de la barra. Por eso esto entra hoy y va a seguir entrando.
 *
 * Igual las acciones van agrupadas en su propio contenedor `shrink-0`: es
 * barato, y es lo que evita que vuelva a caerse una sola suelta el día que algo
 * crezca.
 *
 * **Las dos barras leen la misma lista.** Antes estaba escrita a mano adentro
 * de este JSX, y dos listas de diez links que hay que acordarse de tocar juntas
 * son diez chances de que una pantalla exista en escritorio y no en el
 * teléfono.
 *
 * Sigue siendo un Server Component. La regla de CLAUDE.md —todo `/admin` es
 * `"use client"`— apunta a las pantallas con estado y mutaciones; esta barra no
 * tiene ninguno. Los que sí son cliente son el cajón y la fila de categorías,
 * porque abren, cierran y necesitan saber en qué ruta estamos.
 */
export function BarraAdmin({ autor }: { autor: Autor }) {
  const grupos = gruposDe(autor.rol)

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-block-bg text-block-text">
      <MenuAdmin grupos={grupos} nombre={autor.nombre} />

      <div className="mx-auto hidden max-w-sitio items-center gap-x-3 px-4 py-2 lg:flex">
        {/* La marca, en recuadro y en dorado: es lo único de la barra que no
            es un link más, y el `--block-accent` existe justamente para texto
            sobre el bloque oscuro (7.25:1). */}
        <Link
          href="/admin"
          className="marca shrink-0 rounded-sm bg-block-text/10 px-2.5 py-1 text-[1.1rem] text-block-accent"
        >
          Delfos
        </Link>

        {/* Las categorías. Se agregan en `secciones.ts` y en `docs/admin.md`:
            una pantalla a la que no se llega desde esta barra es una pantalla
            que nadie va a encontrar. */}
        <nav aria-label="Secciones del panel" className="min-w-0">
          <GruposDelPanel grupos={grupos} />
        </nav>

        {/* Las acciones, juntas y en bloque. `shrink-0` para que no se
            compriman, y agrupadas para que ninguna se caiga sola a un segundo
            renglón si alguna vez falta lugar. */}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {/* El nombre lleva al perfil: es donde se edita la firma y la bio, y
              el lugar donde alguien la busca es justo donde ve su nombre. */}
          <Link
            href="/admin/perfil"
            className="tactil flex items-center px-2 text-[0.85rem] text-block-text/70 hover:underline"
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
      </div>
    </header>
  )
}
