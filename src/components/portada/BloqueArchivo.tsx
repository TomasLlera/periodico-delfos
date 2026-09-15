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
    <section aria-labelledby="archivo" className="mt-14 pb-4">
      <CabeceraBloque id="archivo" titulo="Archivo" />

      <ul className="flex flex-wrap gap-3">
        {SECCIONES.map((seccion) => (
          <li key={seccion.href}>
            <Link
              href={seccion.href}
              className="tactil inline-flex items-center border border-linea-fuerte bg-tarjeta px-4 font-display text-[0.9rem] font-bold hover:border-verde-600 hover:text-verde-600"
            >
              {seccion.label}
            </Link>
          </li>
        ))}

        {temporadas?.map((temporada) => (
          <li key={temporada.slug}>
            <Link
              href={`/temporada/${temporada.slug}`}
              className="tactil inline-flex items-center border border-linea-fuerte bg-tarjeta px-4 font-display text-[0.9rem] font-bold hover:border-verde-600 hover:text-verde-600"
            >
              {temporada.nombre}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
