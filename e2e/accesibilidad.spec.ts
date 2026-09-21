import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/**
 * La auditoría de accesibilidad del Step 20, automatizada.
 *
 * El Build Order la pide con tres palabras —"contraste AA, foco visible,
 * jerarquía de headings"— y axe mide las tres, más un centenar de reglas que a
 * mano no se revisan nunca: roles mal puestos, formularios sin etiqueta,
 * atributos ARIA que no existen, listas con hijos que no son `<li>`.
 *
 * **Lo que axe encuentra es un piso, no un techo.** Una auditoría automática
 * detecta alrededor de la mitad de los problemas reales: no sabe si el texto
 * alternativo de una foto la describe o dice "imagen1", ni si el orden de
 * tabulación tiene sentido. Eso hay que mirarlo a mano, y sigue pendiente.
 *
 * Corre en los cuatro proyectos —375 y 1280 px, claro y oscuro— y eso no es
 * repetición: **el contraste se mide sobre los colores que se están pintando**,
 * así que un token que falla AA sólo en tema oscuro aparece únicamente en las
 * dos corridas oscuras. Era la razón de tener los dos temas en la suite.
 */

const RUTAS = [
  '/',
  '/cronicas',
  '/analisis',
  '/buscar',
  '/quienes-somos',
  '/demo/portada',
  '/demo/nota',
  '/demo/temporada',
  '/demo/planilla',
  '/demo/partido',
  '/demo/jugadora',
  '/demo/plantel',
]

/**
 * Las reglas que se exigen: WCAG 2 nivel A y AA.
 *
 * Se deja afuera `best-practice`, que es el criterio propio de axe y no una
 * norma: tiene reglas razonables y otras discutibles, y mezclarlas haría que
 * un rojo de la suite no distinga "incumple WCAG" de "a axe no le gusta".
 * El proyecto se comprometió a AA, así que eso es lo que se mide.
 */
const NORMAS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

for (const ruta of RUTAS) {
  test(`${ruta} cumple WCAG 2.1 AA`, async ({ page }) => {
    await page.goto(ruta, { waitUntil: 'load' })

    const { violations } = await new AxeBuilder({ page }).withTags(NORMAS).analyze()

    // El mensaje importa más que el número: "3 violaciones" no dice qué tocar.
    // Esto imprime la regla, qué exige y en qué elemento, que es lo que hace
    // falta para arreglarlo sin volver a correr nada.
    const detalle = violations
      .map((v) => {
        const nodos = v.nodes.map((n) => `      ${n.target.join(' ')}`).join('\n')
        return `  [${v.id}] ${v.help}\n${nodos}`
      })
      .join('\n')

    expect(violations, `${ruta} incumple WCAG AA:\n${detalle}`).toEqual([])
  })
}
