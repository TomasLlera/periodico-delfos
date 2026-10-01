import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ShieldCheck, UserPlus } from 'lucide-react'
import { Aviso } from '@/components/admin/Aviso'
import { BotonRol } from '@/components/admin/BotonRol'
import { getAutorDeLaSesion, getAutores } from '@/lib/supabase/queries/autores'

/**
 * Las cuentas del panel.
 *
 * **Sólo para editores**, y se chequea acá además de en el action: una pantalla
 * que lista cuentas y ofrece cambiarles el rol no tiene por qué abrirse para
 * alguien que no puede hacer ninguna de las dos cosas. Quien no es editor cae
 * en `/admin`, no en el login: tiene sesión y es autor, lo que no tiene es esta
 * pantalla.
 *
 * La defensa real sigue siendo la base: `gestion_de_autores` y el trigger
 * `autores_rol_solo_por_editor` de la `0014`.
 *
 * Dinámica y sin cache, como todo el panel: el que mira es el que escribe.
 */
export const metadata: Metadata = { title: 'Autores' }
export const dynamic = 'force-dynamic'

export default async function Autores() {
  const yo = await getAutorDeLaSesion()
  if (!yo) redirect('/admin/login')
  if (yo.rol !== 'editor') redirect('/admin')

  const autores = await getAutores()

  return (
    <main className="mx-auto max-w-[900px] px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <h1 className="titular text-[1.6rem]">Autores</h1>

        <Link
          href="/admin/autores/nuevo"
          className="tactil ml-auto flex items-center gap-2 bg-accent px-4 font-display text-[0.9rem] font-extrabold text-accent-contrast hover:bg-accent/90"
        >
          <UserPlus size={16} aria-hidden="true" />
          Cuenta nueva
        </Link>
      </div>

      <Aviso>
        Un <strong>editor</strong> ve y edita todas las notas y da de alta
        cuentas. Un <strong>redactor</strong> ve y edita sólo las suyas. Los
        partidos, las jugadoras, las planillas y la tabla las carga cualquiera de
        los dos: el reparto es de las notas, que son lo que se firma.
      </Aviso>

      <ul className="mt-6">
        {autores.map((autor) => (
          <li
            key={autor.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border py-3"
          >
            {/* El rol se dice con la palabra y no sólo con el ícono: es la
                misma regla que el equipo propio y que el estado de las notas. */}
            {autor.rol === 'editor' && (
              <span className="meta flex items-center gap-1 bg-text px-2 py-0.5 text-bg">
                <ShieldCheck size={12} aria-hidden="true" />
                Editor
              </span>
            )}

            <span className="font-display text-[1rem] font-bold">{autor.nombre}</span>

            <span className="text-[0.85rem] text-text-muted">/autor/{autor.slug}</span>

            {/* Una cuenta que firma como otra no es un autor del medio: es la
                técnica o la de la suite. Decirlo evita que alguien se pregunte
                por qué sus notas salen con otro nombre. */}
            {autor.firma_como && (
              <span className="text-[0.8rem] text-text-muted">
                firma como otra cuenta
              </span>
            )}

            <span className="ml-auto">
              <BotonRol
                id={autor.id}
                rolDeHoy={autor.rol}
                nombre={autor.nombre}
                esUnoMismo={autor.id === yo.id}
              />
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-[0.85rem] text-text-muted">
        El mail de cada cuenta no sale acá: vive en Supabase Auth y no se copia a
        esta tabla, para que no queden dos versiones del mismo dato. Para dar de
        baja una cuenta hay que borrarla en Auth, que es lo único que la deja
        afuera de verdad.
      </p>
    </main>
  )
}
