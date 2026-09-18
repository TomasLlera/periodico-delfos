# Encargo — La suite de Playwright (parte del Step 20)

Rama: `fase/20-e2e`

## Qué hay que hacer

Convertir en una suite commiteada, en `e2e/`, la verificación de navegador que
hace seis sesiones se escribe a mano, se corre y se tira.

**No arrancás de cero.** En `e2e/borradores/` están los dos scripts que ya
corrieron y encontraron bugs reales:

- `medir.js` — barre 17 rutas × 375 y 1280 px × tema claro y oscuro (68
  combinaciones) y chequea scroll horizontal, un solo `<h1>` por página y
  errores de consola.
- `ventana.js` — los nueve chequeos de la ventana de la planilla: que el chip
  sea un link de verdad, que abra, que la URL cambie, que sea modal con nombre
  accesible, que Escape la cierre, que el foco vuelva al chip, que entrar
  directo dé la página y que sin JavaScript el chip navegue.

Son scripts sueltos de node, no specs. El trabajo es convertirlos a
`@playwright/test`, agregar `playwright.config.ts` y un script `test:e2e` en
`package.json`.

## Lo que ya se sabe que hay que cuidar

- **`vitest.config.mts` tiene que seguir sin ver `e2e/`.** `@playwright/test` y
  vitest se pisan.
- `playwright.config.ts` con `webServer` que levante `next start` en un puerto
  propio, `projects` para 1280 y 375 px, y `colorScheme` claro y oscuro.
- **En esta máquina no hay Chrome, sólo Edge.** Los scripts lanzan
  `chromium.launch({ channel: 'msedge' })`. Si en la tuya hay Chrome, sacalo; si
  no, `npx playwright install chromium` baja el navegador propio.
- Los 404 de prefetch de Next (`?_rsc=`) a rutas que sin base no existen son
  ruido conocido: **filtralos por URL, no por el texto del mensaje**, que no la
  trae.
- **Esperá a que el `<time>` de la cabecera tenga texto** si necesitás
  hidratación.

## Los bugs que la primera corrida ya encontró

Están sin arreglar y son de la rama `fix/accesibilidad-y-pie`, no de ésta. Pero
la suite tiene que fallar por ellos hasta que se arreglen, o marcarlos:

- `/quienes-somos` no tiene ningún `<h1>`. Es un bug de verdad.
- `/`, `/cronicas` y `/analisis` tampoco, pero ahí se explica por la base
  vacía.
- `/demo/nota` y `/demo/articulo` tiran `ERR_NAME_NOT_RESOLVED` en consola.
- `/demo/nota` loguea `[tiptap] El cuerpo de la nota no tiene forma de
  documento TipTap`.

## Qué NO tocar

Esta rama debería tocar **sólo** `e2e/`, `playwright.config.ts`, `package.json`
(una línea) y `.gitignore` (los artefactos de Playwright). Nada de `src/`.

Reservado para la rama de Supabase: `src/lib/supabase/types.ts`, `vercel.json`,
`supabase/migrations/` y los scripts de migración.

**`HANDOFF.md` lo tocan todas las ramas**: escribir sólo en una sección nueva al
final.

## Por qué vale la pena

La medición que produjo estos scripts encontró cuatro cosas en su primera
pasada, después de que cinco sesiones dijeran "verificado en el navegador". No
es higiene: es lo que va a encontrar lo próximo.
