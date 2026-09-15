/**
 * Notas relacionadas, **filtradas por la misma temporada**.
 *
 * Hoy el sitio muestra partidos de la Primera C 2024 como contexto de una nota
 * de 2026. El filtro lo hace la query (`getNotasRelacionadas`), que devuelve
 * lista vacía cuando la nota no tiene temporada: es preferible no mostrar nada
 * a mostrar cualquier cosa.
 *
 * Por eso el componente **no se dibuja si no hay notas**: un bloque "Seguí
 * leyendo" vacío ocupa lugar y no ofrece nada.
 */

import Link from 'next/link'
import { ImagenResponsive } from '@/components/content/ImagenResponsive'
import { fechaCorta } from '@/lib/formato'
import type { NotaResumen } from '@/types'

const ETIQUETA_CATEGORIA = {
  cronica: 'Crónica',
  analisis: 'Análisis',
  temporada: 'Temporada',
  plantel: 'Plantel',
  institucional: 'Institucional',
} as const

export function NotasRelacionadas({ notas }: { notas: readonly NotaResumen[] }) {
  if (notas.length === 0) return null

  return (
    <section aria-labelledby="relacionadas" className="mt-12 pt-4">
      {/* El filete vertical verde antes del título es el marcador de sección
          del rediseño, en lugar de la línea horizontal de arriba. */}
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="h-7 w-2.5 shrink-0 rounded-sm bg-verde-600" />
        <h2 id="relacionadas" className="titular text-[22px]">
          Seguí leyendo
        </h2>
      </div>

      <ul className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {notas.map((nota) => (
          <li key={nota.id}>
            <TarjetaNota nota={nota} />
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * La tarjeta entera es un solo link, y la imagen va con `alt=""`: repetir el
 * texto alternativo del título obliga a un lector de pantalla a escuchar lo
 * mismo dos veces por tarjeta.
 */
function TarjetaNota({ nota }: { nota: NotaResumen }) {
  return (
    <Link
      href={`/nota/${nota.slug}`}
      className="tarjeta group flex h-full flex-col overflow-hidden transition-colors hover:bg-tarjeta-hover"
    >
      {nota.imagen_portada && (
        <div className="relative overflow-hidden">
          <ImagenResponsive
            src={nota.imagen_portada}
            alt=""
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            className="aspect-[3/2] w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* La categoría va sobre la foto, como badge, y no arriba del título:
              es el patrón del rediseño. */}
          <span className="absolute left-3 top-3 rounded-sm bg-amarillo px-2 py-0.5 font-display text-[12px] font-bold uppercase tracking-[0.08em] text-negro-cancha">
            {ETIQUETA_CATEGORIA[nota.categoria]}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
        <p className="meta">
          {!nota.imagen_portada && `${ETIQUETA_CATEGORIA[nota.categoria]} · `}
          {nota.publicada_en && fechaCorta(nota.publicada_en)}
        </p>

        <h3 className="titular mt-2 text-[17px] leading-[1.15] group-hover:text-verde-600">
          {nota.titulo}
        </h3>

        <p className="mt-2 line-clamp-2 font-body text-[15px] leading-snug text-gris">
          {nota.bajada}
        </p>

        {/* Va en verde y no en amarillo como el mockup: el amarillo del
            rediseño sobre una tarjeta clara da 2.6:1 y no llega a AA. El verde
            pasa en los dos temas (5.1:1 oscuro, 5.4:1 claro). */}
        <span className="meta mt-auto pt-3 text-verde-600">Leer nota →</span>
      </div>
    </Link>
  )
}
