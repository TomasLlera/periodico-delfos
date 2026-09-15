import { CabeceraBloque } from '@/components/portada/CabeceraBloque'
import { TarjetaNota } from '@/components/portada/TarjetaNota'
import type { NotaResumen } from '@/types'

/**
 * La grilla de notas del boceto: tres columnas con la primera ocupando dos.
 *
 * Es el "nota principal + últimas 4" que pide el Build Order, dibujado como en
 * el boceto. La nota de tapa no entra acá: la portada le pasa una lista que ya
 * la excluye, porque el problema número uno de la home de WordPress es mostrar
 * las mismas notas cuatro veces (blueprint 7.2).
 *
 * **El estado vacío se escribe, no se omite.** Sin proyecto de Supabase la
 * portada entera está vacía, y una sección que desaparece en silencio no
 * distingue "todavía no hay nada" de "se rompió la query".
 */
interface Props {
  id: string
  titulo: string
  notas: readonly NotaResumen[]
  enlace?: { href: string; texto: string }
  vacio: string
}

export function GrillaNotas({ id, titulo, notas, enlace, vacio }: Props) {
  return (
    <section aria-labelledby={id} className="mt-14">
      <CabeceraBloque id={id} titulo={titulo} enlace={enlace} />

      {notas.length === 0 ? (
        <p className="font-body text-gris">{vacio}</p>
      ) : (
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {notas.map((nota, i) => (
            <li
              key={nota.id}
              // La primera ocupa dos columnas en las dos grillas donde hay más
              // de una columna. En 375px no hay nada que expandir.
              className={i === 0 ? 'sm:col-span-2' : undefined}
            >
              <TarjetaNota nota={nota} destacada={i === 0} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
