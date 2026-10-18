'use client'

import { useEffect, useState } from 'react'
import { TablaPosiciones } from '@/components/temporada/TablaPosiciones'
import {
  cambiosDePuesto,
  fechaPedidaDeTabla,
  fechasDisponibles,
  tablaDeLaFecha,
  tablaPrevia,
  type TablaDeFecha,
} from '@/lib/temporada'

/**
 * La tabla de posiciones con su selector de fecha: cómo estaba el campeonato al
 * terminar la fecha 3, la 7 o la última.
 *
 * **Las fechas llegan todas juntas del servidor y el cambio pasa en el
 * cliente.** Son once filas por fecha —menos de lo que pesa una foto de la
 * portada— y traerlas de una tiene dos consecuencias que la alternativa no
 * tiene: la página no lee `?fecha=` en el servidor, así que no se cae del
 * prerender, y cambiar de fecha no es una navegación con su ida y vuelta.
 *
 * **La URL la escribe el cliente con `replaceState`.** La fecha elegida queda en
 * `?fecha=3` para que el link se pueda compartir, pero sin agregar una entrada
 * al historial por click: con `pushState`, mirar seis fechas deja seis entradas
 * y el botón de atrás no vuelve a la página anterior sino a la fecha anterior.
 * Y como no se usa el router, el servidor no se entera: es lo que mantiene a la
 * página fuera del render dinámico.
 *
 * **El `?fecha=` de entrada se lee en un efecto y no en el primer render.**
 * Leer `window.location` mientras se dibuja daría HTML distinto en el servidor
 * y en el cliente —el error de hidratación clásico—, así que la primera pintura
 * es siempre la última fecha cargada, que es la que vale para el 99% de las
 * visitas y la que queda en el HTML para Google. Quien entra con un link a la
 * fecha 3 ve el cambio apenas hidrata.
 *
 * El selector solo ofrece las fechas que tienen tabla cargada —`tablas` sale de
 * `tabla_posiciones`, no del fixture— y son botones y no un `<select>`: se
 * recorren con Tab, se activan con Enter o espacio y se ven todas de una.
 */
interface Props {
  tablas: readonly TablaDeFecha[]
  temporada: string
}

export function TablaPorFecha({ tablas, temporada }: Props) {
  const fechas = fechasDisponibles(tablas)
  const [fecha, setFecha] = useState<number | null>(fechas[fechas.length - 1] ?? null)

  useEffect(() => {
    const pedida = new URLSearchParams(window.location.search).get('fecha')
    setFecha(fechaPedidaDeTabla(pedida, tablas.map((tabla) => tabla.fecha)))
  }, [tablas])

  function elegir(numero: number) {
    setFecha(numero)

    // Se preservan los otros parámetros: en `/temporada/[slug]` la pestaña
    // viaja en `?ver=tabla` y perderla devolvería al fixture al recargar.
    const url = new URL(window.location.href)
    url.searchParams.set('fecha', String(numero))
    window.history.replaceState(null, '', url)
  }

  const actual = tablaDeLaFecha(tablas, fecha)
  const previa = fecha === null ? null : tablaPrevia(tablas, fecha)

  return (
    <div className="flex flex-col gap-5">
      {/* Con una sola fecha cargada no hay nada que elegir, y una fila de un
          botón solo parece una pestaña que no hace nada. A qué fecha
          corresponde la tabla lo dice igual el `<caption>`. */}
      {fechas.length > 1 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span id="selector-de-fecha" className="meta text-text-muted">
            Tabla al terminar la fecha
          </span>

          <div
            role="group"
            aria-labelledby="selector-de-fecha"
            className="flex flex-wrap gap-1.5"
          >
            {fechas.map((numero) => (
              <button
                key={numero}
                type="button"
                onClick={() => elegir(numero)}
                aria-pressed={numero === fecha}
                className={
                  'flex min-h-[40px] min-w-[40px] items-center justify-center px-2 font-display text-[0.9rem] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text ' +
                  (numero === fecha
                    ? 'bg-text text-bg'
                    : 'border border-border-control text-text hover:bg-bg-muted')
                }
              >
                {numero}
              </button>
            ))}
          </div>
        </div>
      )}

      <TablaPosiciones
        filas={actual?.filas ?? []}
        fecha={fecha}
        temporada={temporada}
        rotulo={
          fecha === null
            ? undefined
            : `${temporada} · tal como quedó al terminar la fecha ${fecha}.`
        }
        cambios={cambiosDePuesto(actual?.filas ?? [], previa?.filas ?? null)}
      />
    </div>
  )
}
