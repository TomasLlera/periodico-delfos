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
 * **Sin notas, lo decide quien lo usa.** Con `vacio` el bloque escribe su
 * estado; sin `vacio` no se dibuja. No es indecisión: son dos situaciones
 * distintas y la sección sola no puede distinguirlas.
 *
 * Si la portada tiene contenido y a esta sección le falta —hay crónicas pero
 * todavía ningún análisis—, un titular con una línea gris debajo es ruido que
 * empuja hacia abajo lo que sí hay, y conviene omitirla.
 *
 * Si la portada está **entera** vacía, omitir todo la deja en cuatro bloques
 * sueltos que no se parecen a un diario ni al boceto. Ahí las secciones se
 * dibujan con su estado escrito: dicen "todavía no hay nada" en lugar de dejar
 * un hueco que se lee como que la página se rompió.
 */
interface Props {
  id: string
  titulo: string
  notas: readonly NotaResumen[]
  enlace?: { href: string; texto: string }
  /** El texto del estado vacío. Sin esto, un bloque sin notas no se dibuja. */
  vacio?: string
}

export function GrillaNotas({ id, titulo, notas, enlace, vacio }: Props) {
  if (notas.length === 0 && !vacio) return null

  return (
    <section aria-labelledby={id} className="mt-bloque">
      <CabeceraBloque id={id} titulo={titulo} enlace={enlace} />

      {notas.length === 0 && <p className="font-body text-gris">{vacio}</p>}

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
    </section>
  )
}
