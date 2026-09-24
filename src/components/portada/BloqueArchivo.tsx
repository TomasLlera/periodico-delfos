import Link from 'next/link'
import { CabeceraBloque } from '@/components/portada/CabeceraBloque'

/**
 * El cierre de la portada: adónde ir cuando se terminaron las notas nuevas.
 *
 * Es el punto 6 de la portada del blueprint (7.2) y lo que el Build Order llama
 * "archivo". Existe para que las temporadas viejas tengan una puerta de
 * entrada: la migración trajo notas de cuatro temporadas y hoy, sin este
 * bloque, a las de 2023 y 2024 sólo se llega por buscador.
 *
 * `temporadas` es opcional y la portada no se la pasa todavía: los slugs salen
 * de la tabla `temporadas`, que no está cargada. Sin ellas el bloque muestra
 * igual las tres secciones fijas, que sí existen.
 */
interface Props {
  temporadas?: readonly { slug: string; nombre: string }[]
}

const SECCIONES = [
  { href: '/cronicas', label: 'Todas las crónicas' },
  { href: '/analisis', label: 'Todos los análisis' },
  { href: '/plantel', label: 'El plantel' },
] as const

export function BloqueArchivo({ temporadas }: Props) {
  return (
    <section aria-labelledby="archivo" className="mt-bloque pb-4">
      <CabeceraBloque id="archivo" titulo="Archivo" />

      {/* Grilla de dos columnas en celular y no `flex-wrap`: envueltos, los
          tres botones caían 2 + 1 con el tercero a media pantalla y el resto
          del renglón vacío, que se lee como un botón roto. En la grilla los dos
          primeros quedan parejos y el tercero ocupa el ancho entero. De `sm`
          para arriba vuelve el envoltorio, que es lo que deja entrar las
          temporadas sin dejar huecos. */}
      <ul className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
        {SECCIONES.map((seccion, i) => (
          <li
            key={seccion.href}
            className={i === SECCIONES.length - 1 ? 'col-span-2 sm:col-span-1' : undefined}
          >
            <Link
              href={seccion.href}
              className="tactil flex items-center justify-center border border-linea-fuerte bg-tarjeta px-4 text-center font-display text-[0.9rem] font-bold hover:border-verde-600 hover:text-verde-600 sm:inline-flex sm:justify-start sm:text-left"
            >
              {seccion.label}
            </Link>
          </li>
        ))}

        {temporadas?.map((temporada) => (
          <li key={temporada.slug}>
            <Link
              href={`/temporada/${temporada.slug}`}
              className="tactil flex items-center justify-center border border-linea-fuerte bg-tarjeta px-4 text-center font-display text-[0.9rem] font-bold hover:border-verde-600 hover:text-verde-600 sm:inline-flex sm:justify-start sm:text-left"
            >
              {temporada.nombre}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
