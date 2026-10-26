/**
 * Mide la complejidad ciclomática de cada función y falla si alguna pasa el
 * tope. Lo corre el CI; a mano:
 *
 *     pnpm complejidad
 *
 * **El tope es el máximo de hoy, no un ideal.** Con 25 —lo que mide
 * `renderNodo` en `lib/tiptap/render.tsx`— todo lo que ya existe pasa, y lo que
 * no puede pasar es que algo empeore más allá de eso. Cuando se refactorice la
 * función más compleja, el tope se baja a la siguiente: sólo se mueve para
 * abajo.
 *
 * Va aparte de `eslint.config.mjs` a propósito. Como regla del lint, la
 * complejidad sólo dice "pasa o no pasa" función por función; acá además sale
 * el panorama —promedio, cuántas hay por encima de cada umbral, el top— y en el
 * CI queda escrito en el resumen de la corrida, que es donde alguien lo mira.
 *
 * Los tests quedan afuera: un `describe` con muchos casos no es lógica que
 * haya que mantener simple.
 */

import { appendFile } from 'node:fs/promises'
import { ESLint } from 'eslint'

const TOPE = 25
const UMBRALES = [10, 15, 20] as const
const CUANTAS_EN_EL_TOP = 10

type Medida = { archivo: string; linea: number; funcion: string; complejidad: number }

/**
 * Con el umbral en 1 la regla reporta TODAS las funciones con su número, que
 * es la única forma de sacarle a ESLint la medida y no sólo el veredicto.
 */
async function medir(): Promise<Medida[]> {
  const eslint = new ESLint({
    overrideConfig: { rules: { complexity: ['warn', 1] } },
    ignorePatterns: ['**/*.test.ts'],
  })
  const resultados = await eslint.lintFiles(['src', 'scripts'])
  const raiz = process.cwd().replaceAll('\\', '/') + '/'

  return resultados.flatMap((r) =>
    r.messages.flatMap((m) => {
      if (m.ruleId !== 'complexity') return []
      const partes = m.message.match(/^(.*) has a complexity of (\d+)/)
      if (!partes) return []
      return [
        {
          archivo: r.filePath.replaceAll('\\', '/').replace(raiz, ''),
          linea: m.line,
          funcion: partes[1],
          complejidad: Number(partes[2]),
        },
      ]
    }),
  )
}

function resumen(medidas: Medida[], pasadas: Medida[]): string {
  const promedio = medidas.reduce((s, m) => s + m.complejidad, 0) / medidas.length
  const top = [...medidas].sort((a, b) => b.complejidad - a.complejidad).slice(0, CUANTAS_EN_EL_TOP)
  const fila = (m: Medida) => `| ${m.complejidad} | \`${m.archivo}:${m.linea}\` | ${m.funcion} |`

  return [
    '## Complejidad ciclomática',
    '',
    `${pasadas.length === 0 ? '✅' : '❌'} Tope: **${TOPE}** · ` +
      `${medidas.length} funciones · promedio **${promedio.toFixed(2)}** · ` +
      UMBRALES.map((u) => `> ${u}: **${medidas.filter((m) => m.complejidad > u).length}**`).join(' · '),
    '',
    ...(pasadas.length > 0
      ? ['### Pasan el tope', '', '| Complejidad | Dónde | Función |', '|---|---|---|', ...pasadas.map(fila), '']
      : []),
    `### Las ${CUANTAS_EN_EL_TOP} más complejas`,
    '',
    '| Complejidad | Dónde | Función |',
    '|---|---|---|',
    ...top.map(fila),
    '',
  ].join('\n')
}

async function principal(): Promise<void> {
  const medidas = await medir()
  if (medidas.length === 0) {
    // Cero funciones medidas es que la medición se rompió, no que el código
    // sea simple. Pasar en verde acá sería mentir.
    console.error('No se midió ninguna función: revisar la config de ESLint.')
    process.exit(1)
  }

  const pasadas = medidas
    .filter((m) => m.complejidad > TOPE)
    .sort((a, b) => b.complejidad - a.complejidad)
  const texto = resumen(medidas, pasadas)
  console.log(texto)

  // En GitHub Actions el resumen va también a la página de la corrida.
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, texto)

  if (pasadas.length > 0) {
    console.error(
      `\n${pasadas.length} función(es) pasan el tope de ${TOPE}. Partirlas antes de mergear; ` +
        'el tope no se sube.',
    )
    process.exit(1)
  }
}

principal()
