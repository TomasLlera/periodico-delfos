import Link from 'next/link'
import {
  PESTANAS_ESTADISTICAS,
  PESTANA_ESTADISTICAS_POR_OMISION,
  type PestanaEstadisticas,
} from '@/lib/estadisticas'

/**
 * Las cuatro vistas de las estadísticas.
 *
 * **Son links, no `role="tablist"`.** Es la misma decisión que
 * `<PestanasTemporada />`, y por el mismo motivo: unas pestañas ARIA de verdad
 * necesitan manejo de foco con flechas y estado en el cliente, y esta página es
 * un Server Component. Unas pestañas falsas —el `role` puesto sin el teclado
 * que implica— son peores que unos links, que ya se navegan con Tab y se
 * anuncian solos.
 *
 * **Cada link arrastra el rango.** Cambiar de pestaña y perder los 30 días que
 * se acababan de elegir es el tipo de cosa que obliga a hacer dos clicks cada
 * vez; las dos cosas viven en la URL y las dos tienen que viajar juntas.
 */
interface Props {
  actual: PestanaEstadisticas
  rango: number
}

const BASE =
  'tactil -mb-px flex items-center border-b-[3px] px-4 font-display text-[0.9rem] font-bold tracking-[0.02em]'

export function PestanasEstadisticas({ actual, rango }: Props) {
  return (
    // Como la nav del header: en 375px scrollea en lugar de apilarse.
    <nav aria-label="Vistas de las estadísticas" className="border-b border-border">
      <ul className="-mx-4 flex overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PESTANAS_ESTADISTICAS.map((pestana) => {
          const activa = pestana.clave === actual
          const parametros = new URLSearchParams({ rango: String(rango) })
          if (pestana.clave !== PESTANA_ESTADISTICAS_POR_OMISION) {
            parametros.set('ver', pestana.clave)
          }

          return (
            <li key={pestana.clave} className="shrink-0">
              <Link
                href={`/admin/estadisticas?${parametros}`}
                aria-current={activa ? 'page' : undefined}
                className={
                  activa
                    ? `${BASE} border-accent-text text-accent-text`
                    : `${BASE} border-transparent text-text-muted hover:text-text`
                }
              >
                {pestana.titulo}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
