# Cómo arrancar — el reparto de trabajo

Tres frentes que se pueden hacer en paralelo sin pisarse, más lo que está
bloqueado esperando a Supabase.

Cada rama tiene su encargo escrito al lado de este archivo. Este documento es
el índice: qué hay, quién toma qué y cómo se arranca.

---

## El estado, en tres líneas

El sitio está terminado como cáscara y **espera datos**. Todas las rutas
públicas del blueprint existen menos `/contacto` y `/privacidad`; la portada ya
es el boceto entero y los tres widgets deportivos están enchufados y se dibujan
solos el día que haya base.

**No hay proyecto de Supabase todavía**, así que `/` sale vacía. No está roto:
es el estado real. Todo lo que hay para mirar está en las once rutas de
`/demo/`.

Lo único que desbloquea el resto está en `HANDOFF.md`, sección **"Arrancar el
backend"**, y los primeros cuatro pasos no los puede hacer un agente.

---

## Setup, igual para los tres

```bash
git clone https://github.com/TomasLlera/periodico-delfos.git
cd periodico-delfos
pnpm install
pnpm dev
```

Cuatro cosas que conviene saber antes de descubrirlas asustándose:

**`pnpm lint` falla y no es culpa tuya.** `eslint.config.mjs` quedó de un
scaffolding de Next 16 e importa `eslint-config-next/core-web-vitals` sin
extensión. No afecta a `pnpm build`. Está documentado en `CLAUDE.md`.

**No hay `.env.local`.** Hay `.env.example` para el día que haya proyecto.
Mientras tanto, nada que dependa de leer o escribir en la base se puede probar.

**Parar el server antes de buildear, y matar el proceso, no la terminal.** Van
tres sesiones encontrando un `next start` vivo de la anterior: el build no puede
reemplazar los archivos tomados y el server sigue sirviendo el build viejo, así
que una tanda entera de verificación dice cosas falsas. En Windows:
`Get-NetTCPConnection -LocalPort 3100` → `Stop-Process -Force`. Ante la duda,
borrar `.next` y buildear limpio.

**Next está fijado en 15 a propósito.** No subirlo sin revisar el blueprint.

### Qué leer antes de escribir una línea

| Archivo | Qué es |
|---|---|
| `HANDOFF.md` | **El estado real.** Empezar por la sección de arriba de todo |
| `CLAUDE.md` | Las reglas no negociables, el sistema de diseño y las convenciones |
| `periodico-delfos-blueprint-v2.md` | El plan completo. El Build Order es la sección 10 |
| `CONTRIBUTING.md` | Cómo trabajamos de a tres |

`CLAUDE.md` describe la arquitectura **objetivo**. Para saber qué existe hoy de
verdad, manda `HANDOFF.md`.

### Cómo se verifica, en cualquier rama

```bash
npx tsc --noEmit
npx vitest run        # 347 tests hoy; tienen que seguir pasando
npx next build
```

Y **medir el scroll horizontal en cada pantalla que toques**, a 375px:
comparar `document.documentElement.scrollWidth` con `clientWidth` **y** mirar
`document.body.scrollWidth`. Los dos, no uno: si el body mide bien y el
documento no, hay un absoluto escapándose de un contenedor con scroll.

---

## Las tres ramas

Las tres arrancan exactamente en `main`, sin diferencias. Se toma una con
`git switch <rama>` y listo.

| Rama | Tamaño | Toca |
|---|---|---|
| `fase/13-planilla-de-carga` | Grande | `src/app/admin/` y `src/components/admin/`, que no existen |
| `fase/20-e2e` | Acotada | Sólo `e2e/`, `playwright.config.ts`, `package.json`, `.gitignore` |
| `fix/accesibilidad-y-pie` | Chica, divisible | Páginas sueltas, `Footer.tsx`, `globals.css` |

### `fase/13-planilla-de-carga` — la más grande

Para quien pueda sentarse un rato largo. Es la pantalla con la que Charlie carga
un partido —`/admin/partidos/[id]/planilla`, sección 7.6 del blueprint— y es el
Step que el Build Order marca con estrella: **es el motivo por el que existe el
proyecto**. Hoy las crónicas del sitio viejo traen la ficha, la formación y los
goles escritos a mano adentro del texto, setenta veces.

**Primer paso:** leer `planilla-de-carga.md`, después la sección 7.6 del
blueprint, y **abrir `/demo/planilla` y `/demo/partido` en el navegador**. Ahí
está la planilla de *lectura*, que ya existe y está testeada; la de carga es su
reverso y conviene que hablen el mismo idioma de datos.

**Se empieza sin base:** componentes puros con datos falsos en `src/app/demo/`,
que es el patrón de todo el proyecto. Cuando Supabase esté, se cablea el
guardado y nada más.

**Lo que decide si sirve no se puede hacer desde la computadora:** probarla en
un celular de verdad y **cronometrar la carga de un partido completo. Si pasa de
tres minutos, iterar antes de seguir.** Una planilla que funcione pero sea lenta
no sirve: Charlie vuelve a escribir los goles a mano.

### `fase/20-e2e` — la más acotada

**No arranca de cero.** En `e2e/borradores/` están los dos scripts que ya
corrieron y encontraron bugs reales:

```bash
pnpm dev                                    # en una terminal
cd e2e/borradores
npm install playwright
node medir.js
```

`medir.js` barre 17 rutas × 375 y 1280 px × tema claro y oscuro —68
combinaciones— y chequea scroll horizontal, un solo `<h1>` por página y errores
de consola. `ventana.js` son los nueve chequeos de la ventana de la planilla.

**Primer paso:** correrlos y leer la salida. Van a fallar en cuatro cosas, y
**esas fallas son reales** — están listadas en `e2e.md`. Recién después,
convertirlos a `@playwright/test` con su `playwright.config.ts` y un script
`test:e2e`.

Dos trampas ya conocidas: **`vitest.config.mts` no puede ver `e2e/`** —
`@playwright/test` y vitest se pisan — y en la máquina donde se escribieron no
hay Chrome sino Edge, por eso lanzan `chromium.launch({ channel: 'msedge' })`.

### `fix/accesibilidad-y-pie` — la de ratos cortos

Cuatro arreglos independientes entre sí, así que se pueden hacer y mergear de a
uno.

**Por dónde empezar:** el `h1` que le falta a `/quienes-somos`. Es el más
aislado —un solo archivo— y es un bug de verdad, no un efecto de la base vacía.
Después el contorno de foco sobre las superficies oscuras, que da **1.98:1** y
no se ve: son tres líneas en `globals.css`, pero cambian el foco en **todo** el
sitio, así que hay que mirarlo en varias páginas antes de darlo por cerrado.

**El cuarto no se puede hacer solo.** `/contacto` y `/privacidad` dan 404 desde
el pie de *todas* las páginas, y están bloqueadas por cuatro datos que sólo
tiene Charlie: el mail del medio, los handles de las redes, el responsable de
datos y si el sitio va a usar analítica. **Una política de privacidad inventada
es un documento legal falso.** O están los datos y se escriben las páginas, o se
sacan los dos links del pie —una constante en `Footer.tsx`— hasta que existan.

---

## Las dos reglas que evitan la pelea

**`HANDOFF.md` es el imán de conflictos.** Las tres ramas lo van a tocar y en
las mismas secciones. Que cada uno escriba **sólo en una sección nueva al
final**, nunca editando las de otro, y que quien mergea consolide. `.gitattributes`
admite `HANDOFF.md merge=union` si hace falta algo más fuerte.

**Hay archivos reservados para la rama que levante Supabase.** Nadie más los
toca:

- `src/lib/supabase/types.ts` — se regenera con el CLI
- `vercel.json` — las 82 redirecciones salen de un script
- `supabase/migrations/`
- los scripts de migración, y `alt.json` / `bajadas.json`

Y cada tanto, `git merge origin/main` en la rama propia, para no divergir.

---

## La rama que no se toca

**`wip/portada-15-sep` no se mergea nunca.** Es una implementación paralela de
los widgets deportivos que quedó sin commitear el 15/09 y se parqueó para no
perderla. Tiene su propio `BarraEstado`, `ChipResultado`, `FechaAFecha` y un
`lib/portada.ts` que **compiten** con los que están en `main`. Mergearla
duplicaría los cuatro componentes.

Lo que valía la pena de esa rama ya se portó a `main`: la tipografía de los
títulos del cuerpo y la regla del `.sr-only`. Está contado en `HANDOFF.md`,
sección "La rama de rescate".

---

## Lo que está bloqueado, y por quién

**Levantar Supabase** es lo único que desbloquea el resto: los Steps 5, 6 y 7
—auth, migración y editor— están todos esperando eso, y es lo que hace que `/`
deje de estar vacía y que los widgets deportivos aparezcan solos. Los once pasos
están en `HANDOFF.md`, en "Arrancar el backend"; **los primeros cuatro son de
consola y no los puede hacer un agente**.

**Los datos de contacto y privacidad**, y la biografía del autor para
`/quienes-somos`, sólo los tiene Charlie.

La migración ya se probó en seco contra el sitio real y salió limpia: 70 notas,
0 categorías sin mapear, 82 reglas de redirección. No es un salto a ciegas.
