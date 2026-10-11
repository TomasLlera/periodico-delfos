'use client'

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DiaDeVisitas } from '@/lib/estadisticas'

/**
 * La curva de visitas por día.
 *
 * **Es el único componente cliente de la pantalla**, y existe sólo porque
 * Recharts mide el ancho del contenedor en el navegador: un gráfico que se
 * renderiza en el servidor no sabe cuántos píxeles tiene para dibujar. Los
 * datos llegan ya calculados desde el servidor; acá no se consulta nada.
 *
 * **Los colores salen de las variables del tema y no de literales.** Recharts
 * pide colores como strings y no acepta clases de Tailwind, así que se leen las
 * mismas variables CSS que usa el resto del sitio —`--accent-text`, `--text`,
 * `--border`—. Con un `#hex` acá, el modo oscuro quedaría con una línea
 * invisible sobre fondo oscuro, que es exactamente el bug que la paleta por
 * tokens vino a evitar.
 *
 * **Dos líneas y no dos gráficos**: vistas y visitantes se leen comparadas —la
 * distancia entre las dos dice cuánto vuelve la gente— y separadas en dos
 * cuadros esa distancia hay que calcularla a ojo.
 */
interface Props {
  serie: readonly DiaDeVisitas[]
}

/** El día como se lee: `2026-10-11` → `11/10`. El año no entra en un eje. */
function etiquetaDeDia(dia: string): string {
  const [, mes, numero] = dia.split('-')
  return `${numero}/${mes}`
}

export function GraficoVisitas({ serie }: Props) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={[...serie]} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />

          <XAxis
            dataKey="dia"
            tickFormatter={etiquetaDeDia}
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            stroke="var(--border)"
            // Con 30 días no entran 30 etiquetas: Recharts saltea las que no
            // entran en vez de encimarlas.
            interval="preserveStartEnd"
            minTickGap={24}
          />

          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            stroke="var(--border)"
            allowDecimals={false}
            width={48}
          />

          <Tooltip
            labelFormatter={(dia) => etiquetaDeDia(String(dia))}
            contentStyle={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-control)',
              borderRadius: 4,
              fontSize: 13,
            }}
            labelStyle={{ color: 'var(--text)' }}
          />

          <Line
            type="monotone"
            dataKey="vistas"
            name="Páginas vistas"
            stroke="var(--accent-text)"
            strokeWidth={2}
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="visitantes"
            name="Visitantes"
            stroke="var(--text-muted)"
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
