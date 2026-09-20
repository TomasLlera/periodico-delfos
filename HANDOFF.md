# Handoff — Periódico Delfos

Copiá el bloque de "Prompt para la próxima sesión" en un chat nuevo. Está escrito
para que un agente arranque en frío, sin haber visto nada de este proyecto.

Actualizar este archivo al terminar cada step.

---

## Estado al cierre del Step 14 (páginas deportivas)

> **LEER PRIMERO.** El tema se invirtió **dos veces** en un mismo día: primero a
> oscuro (rediseño "portal deportivo"), después de vuelta a **claro/crema**, que
> es el estado actual y el definitivo. Si algo de este archivo más abajo dice
> "el tema por omisión es el oscuro", **está viejo**: vale esta sección. El
> blueprint y `CLAUDE.md` ya **no** mienten — se corrigieron. Lo que sigue
> vigente del rediseño oscuro es todo lo que no es color: la planilla plegable,
> la línea de tiempo horizontal, `.titular`/`.meta`/`.tarjeta`/`.franja` y la
> decisión de no usar Barlow Condensed.

**Lo último que se hizo: los tres widgets deportivos de la portada**
—`<BarraEstado />`, `<FechaAFecha />` y `<Goleadoras />`—, **y su cableado, que
cierra el Step 19**. La barra va en el layout raíz y los otros dos en `/`. Los
tres se dibujan **sólo si la base tiene con qué**: sin temporada activa reciben
vacío y se borran solos, así que hoy no se ve ninguno en la ruta pública. Para
verlos dibujados está `/demo/widgets`, con sus estados vacíos; **`/demo/portada`
no los muestra a propósito** —lo decidió el usuario mirándolo—: esa demo es la
de las notas, y los widgets ya tienen banco propio. Ver "Los widgets deportivos,
en detalle" más abajo.

**Antes de eso, las tres páginas deportivas que cierran el Step 14** —
`/temporada/[slug]`, `/plantel/[temporadaSlug]` y `/jugadora/[slug]`—, que son
las que completan las puertas `/plantel` y `/fixture`. Ver "Las páginas
deportivas, en detalle" más abajo. Se pueden mirar con datos falsos en
`/demo/temporada`, `/demo/plantel` y `/demo/jugadora`.

Antes de eso, en sesiones anteriores: la portada del Step 9 según
`referencia/boceto-portada.html`, la puesta al día de la documentación con la
paleta crema y el chrome portado (`Header` y `Footer`); todo detallado más
abajo.

La portada tiene la nota de tapa en bloque verde a dos columnas, la grilla de
crónicas con la primera ocupando dos columnas, el listado de análisis con el
bloque de plantel al costado, y el archivo. Los componentes son puros y reciben
todo por props: **`/demo/portada` los muestra con datos falsos** y `/` los
muestra con lo que haya en la base, que hoy es nada.

**Después del Step 10 se siguió con rutas públicas que no necesitan la base:**
`/buscar`, `/plantel`, `/fixture` y `/partido/[slug]`. Las tres primeras
tapaban links rotos que estaban en el menú de **todas** las páginas. Y se
encontró y arregló un bug de scroll horizontal que venía de antes. Ver "Las
rutas públicas, en detalle" más abajo.

**El Step 9 está terminado** —portada y listados— **y el Step 10 casi.** Del 10
están hechas todas las piezas técnicas: `robots.ts`, `sitemap.ts`, `/rss.xml`,
`/api/og` y los canonicals. `/quienes-somos` también. **Faltan `/contacto` y
`/privacidad`**, que están bloqueadas por datos que sólo tiene el autor y que
no se inventan: el mail del medio, los handles de redes, el responsable de datos
y si el sitio va a usar analítica. Ver "El SEO técnico, en detalle" más abajo.

**Ninguna nota se repite entre bloques.** Cada query de `/` excluye los ids que
ya salieron. Es el problema número uno de la home de WordPress —muestra las
mismas seis notas cuatro veces— y la razón por la que `getUltimasNotas` tiene
`excluirIds`.

**Lo del boceto que quedó afuera de `/`, a propósito:** la barra de resultados
de arriba del header, la planilla del último partido, el widget de próximo
partido y la tabla de posiciones. Son `<BarraEstado />`, `<FechaAFecha />` y
`<Goleadoras />`: **los componentes ya existen** —se miran en `/demo/widgets`—
pero el Build Order los excluye de la portada porque todavía no hay datos
deportivos, y ahí siguen afuera. El bloque de plantel acepta caras y
estadísticas como props opcionales y **`/` no se las pasa**: los "24 jugadoras ·
19 goles · 3° en la tabla" del boceto son datos de base y sólo viven en la
demo. El newsletter tampoco entró: no está en el Build Order y la decisión sigue
sin tomarse.

**Un token cambió de valor** al portar el chrome: `--color-verde-900` en oscuro
era `#007A41`. El token está documentado como **superficie** —la cabecera, la
tapa, el aside— y un verde de acento con texto blanco encima parece un
resaltador. Pasó a `#102A1E` (blanco 15.32:1, amarillo 7.56:1). Es el único
valor de la paleta oscura que se tocó.

**Verificado en esta sesión:** `tsc --noEmit` limpio, **333 tests** (los 286 de
antes más 47 nuevos: `plantel.ts`, `temporada.ts`, `jugadora.ts` y el caso del
partido sin eventos en `partido.ts`), y `next build` verde con **26 rutas**.
`/temporada/[slug]` sale **dinámica** —lee `searchParams`, que es lo que saca a
una página del prerender—; `/plantel/[temporadaSlug]` y `/jugadora/[slug]` salen
SSG como `/nota/[slug]`, sin prerenderizar ninguna porque no hay base.

Y se miró en un navegador de verdad: `/demo/temporada`, `/demo/plantel`,
`/demo/jugadora`, `/plantel`, `/fixture` y `/buscar`, a **1280 y 375 px**, en
**tema claro y oscuro** —24 combinaciones—. Todas: **sin scroll horizontal**
(`documentElement.scrollWidth === clientWidth` **y** `body.scrollWidth` igual),
**un solo `<h1>` por página**, sin warnings de hidratación y sin errores de
consola propios. `/temporada/no-existe`, `/jugadora/no-existe` y
`/plantel/no-existe` devuelven **404**, y `?ver=chirimbolo` no rompe: cae en el
fixture.

**Lo único que sigue apareciendo en la consola** son prefetch de Next (`?_rsc=`)
a rutas que hoy no existen: `/jugadora/<slug>` y `/partido/<slug>` desde las
demos —no hay base que resuelva esos slugs— y **`/contacto` y `/privacidad`
desde el pie, que están en el pie de *todas* las páginas y todavía no existen**.
Ese último es un 404 real y visible para el lector: hay que escribir las dos
páginas o sacar los dos links del pie hasta que estén. Está bloqueado por datos
del autor (ver "Decisiones que el usuario todavía no tomó").

**No verificado:** nada de la escritura a Supabase (`--escribir`), no hay
proyecto todavía. Y sigue sin mirarse en el navegador `/demo/nota` y
`/demo/planilla` a 375 px en los dos temas: ahí siguen sin revisarse el CSS de
listas, `<code>` y `<hr>`, y los iconos de la planilla que pasaron a lucide.

**Una trampa para el día que haya credenciales:** `/nota/[slug]`,
`/partido/[slug]`, `/plantel/[temporadaSlug]` y `/jugadora/[slug]` declaran
`generateStaticParams`, pero sus queries usan `createClient()`, que pide
`cookies()`. Hoy eso no se nota porque sin base `generateStaticParams` devuelve
`[]` y no se prerenderiza nada. Con el proyecto arriba, Next puede cortar con
"Dynamic server usage" al intentar generarlas en build. El arreglo es el que ya
existe para el sitemap: `createStaticClient()`, que es el cliente sin cookies.
**Probarlo con el primer deploy con base**, y no dar por sentado que anda.

**Nota de entorno:** `node` responde `v22.20.0` en el PATH y `npx tsc` /
`npx vitest` / `npx next build` funcionan directo. **Parar el server antes de
buildear de verdad**: en esta sesión un `next start` quedó vivo, el build nuevo
no pudo reemplazar los archivos que tenía tomados y el server siguió sirviendo
el build viejo con los chunks del nuevo — páginas sin CSS, sin hidratar, y una
tanda entera de verificación que decía cosas falsas. Matar el proceso que
escucha el puerto (`Get-NetTCPConnection -LocalPort <puerto>` → `Stop-Process`),
no sólo el shell que lo lanzó, y ante la duda borrar `.next` y buildear limpio.

> **Pasa igual con `next dev`, y el síntoma engaña.** Un `pnpm build` con el dev
> server levantado le pisa `.next`: el server sigue en pie pero tira
> `Cannot find module './716.js'` y devuelve 500 en los chunks, así que la
> página se dibuja **sin hidratar**. Lo primero que se nota es que **la fecha de
> la cabecera desaparece** —`<FechaDeHoy />` la escribe recién en el
> `useEffect`—, y parece un bug del componente cuando es el server podrido.
> Se arregla parando el server, borrando `.next` y volviendo a arrancar. `pnpm` no se usó, así que no
está confirmado que ande; si falla, hay un Node 22 portátil en `~/tools/node22`
y pnpm preparado con `corepack prepare pnpm@11.1.2 --activate`. **No arrancar el
dev server con `| head`**: cuando `head` cierra el pipe, el server queda colgado
escuchando el puerto pero sin responder. Redirigir a un archivo.

### Hecho

| Step | Qué | Dónde |
|---|---|---|
| 1 | Scaffolding Next 15.5.23 + React 19 + Tailwind 4 + deps | `periodico-delfos/` |
| 2 | Schema completo: 9 migraciones con RLS, vistas y constraints | `supabase/migrations/0001-0009` |
| 3 | Tipos de dominio + 3 clientes de Supabase | `src/types/index.ts`, `src/lib/supabase/` |
| 3b | Queries centralizadas | `src/lib/supabase/queries/` |
| 4 | Tokens, fuentes, root layout `lang="es-AR"` | `src/app/globals.css`, `layout.tsx` |
| 4b | Header, Footer, ImagenResponsive, helpers de formato | `src/components/`, `src/lib/formato.ts` |
| 5 | `<PlanillaPartido />` con sus tres variantes, lógica pura y tests | `src/components/partido/`, `src/lib/partido.ts` |
| 6 | Renderer de TipTap JSON → React, validado con Zod | `src/lib/tiptap/` |
| 7 | Migración desde WordPress: lógica pura + script de I/O | `src/lib/migracion/`, `scripts/migrate-wp.ts` |
| **8** | **El copy de las tres redes, con el peso Unicode de X** | `src/lib/social/` |
| 9 | `generate-redirects.ts`: `redirects.json` → `vercel.json`, mergea claves existentes | `scripts/generate-redirects.ts`, `formatoVercel()` en `src/lib/migracion/redirecciones.ts` |
| **10** | **La página de nota (Step 8 del Build Order), mirala en `/demo/articulo`** | `src/app/nota/[slug]/`, `src/components/content/`, `src/lib/seo.ts` |
| **4c** | **El chrome portado a los bocetos: `Header` con nav `aria-current` y fecha del día, `Footer` a cuatro bandas** | `src/components/layout/` |
| **11** | **La portada (Step 9). Mirala con datos en `/demo/portada`** | `src/app/page.tsx`, `src/components/portada/` |
| **12** | **Los listados con paginación (cierran el Step 9). Mirá el paginador en `/demo/listado`** | `src/app/cronicas/`, `src/app/analisis/`, `src/components/listado/`, `src/lib/paginacion.ts` |
| **13** | **SEO técnico del Step 10: robots, sitemap, RSS, imagen OG, canonicals, y `/quienes-somos`** | `src/app/robots.ts`, `sitemap.ts`, `rss.xml/`, `api/og/`, `quienes-somos/`, `src/lib/rss.ts` |
| **14** | **`/buscar`, y `/plantel` y `/fixture` como puertas a la temporada en curso** | `src/app/buscar/`, `plantel/`, `fixture/`, `src/lib/busqueda.ts` |
| **15** | **`/partido/[slug]` con JSON-LD `SportsEvent`. Mirala en `/demo/partido`** | `src/app/partido/[slug]/`, `jsonLdPartido()` en `src/lib/seo.ts` |
| **16** | **Lo que faltaba del Step 14: `/temporada/[slug]` (fixture, tabla y goleadoras), `/plantel/[temporadaSlug]` y `/jugadora/[slug]`. Miralas en `/demo/temporada`, `/demo/plantel` y `/demo/jugadora`** | `src/app/temporada/`, `plantel/[temporadaSlug]/`, `jugadora/[slug]/`, `src/components/` (temporada, plantel, jugadora), `src/lib/temporada.ts`, `plantel.ts`, `jugadora.ts` |
| **17** | **Los tres widgets deportivos del Step 19 como componentes puros. Miralos en `/demo/widgets`** | `src/components/layout/BarraEstado.tsx`, `src/components/partido/FechaAFecha.tsx` y `ChipResultado.tsx`, `src/components/portada/Goleadoras.tsx`, `src/lib/temporada.ts` |
| **18** | **La temperatura de Mar del Plata en la línea de fecha de la cabecera (fuera del Build Order, lo pidió el usuario)** | `src/lib/clima.ts`, `src/components/layout/Header.tsx`, `src/app/page.tsx` |
| **19** | **Los títulos del cuerpo (`h3` y `h4`) y la regla del `.sr-only`, rescatados de la versión del 15/09** | `src/app/globals.css`, `CLAUDE.md` |
| **20** | **`<FechaAFecha />` y `<Goleadoras />` enchufadas a `/`: cierra el cableado del Step 19** | `src/app/page.tsx`, `src/lib/supabase/queries/estado.ts` |
| **21** | **La ventana de la planilla: apretar un chip de la franja la abre encima de la página, con rutas interceptadas. Probala en `/demo/fixture`** | `src/app/@modal/`, `src/components/layout/Ventana.tsx`, `src/app/demo/fixture/`, `ChipResultado.tsx`, `FechaAFecha.tsx` |

---

## El copy de redes, en detalle

```
src/lib/social/limites.ts       Peso Unicode de X + recorte por palabra
src/lib/social/limites.test.ts  20 tests
src/lib/social/compose.ts       El copy de las tres redes (blueprint 6.3)
src/lib/social/compose.test.ts  41 tests
```

Puro y sin I/O. No consulta la base ni le pega a ninguna API: recibe la nota, su
partido y la URL del sitio, y devuelve el texto listo para postear.

```ts
componerTodos({ nota, partido, urlSitio })  // → Record<Red, CopyDeRed>
componerCopy('x', { nota, partido, urlSitio })
```

`CopyDeRed` trae `texto`, `largo`, `limite`, `entra` y `recortado`. **`entra` se
mide, no se afirma**: es lo único que separa un posteo de un 403 de la API de X.

Las tres formas, decididas por el partido y no por la categoría de la nota:

```
⚽ Fecha 11 · Aldosivi 2-1 All Boys      finalizado, con marcador
🔍 Previa Fecha 11 · Aldosivi vs …       programado, con día y cancha
{título}                                 sin partido, o sin resultado que dar
```

### Lo que se arregló de la sesión anterior

Los dos archivos venían escritos pero nunca typechequeados ni testeados.
`npx tsc --noEmit` salió limpio de entrada, y `limites.ts` resultó correcto tal
cual estaba: los rangos livianos son los de `twitter-text` v3, los emoji pesan
2, los acentos 1 y el recorte no parte palabras. Los 20 tests lo confirman.

`compose.ts` sí tenía cinco problemas, cuatro de ellos porque el código no hacía
lo que decía su propio comentario:

1. **El orden de sacrificio de X estaba invertido.** El docstring dice "primero
   la línea de datos, después la bajada se recorta, y por último se va entera",
   pero `armar(true)` devolvía un resultado apenas entrara **una palabra** de
   bajada, así que las goleadoras sobrevivían y lo que se recortaba era la
   bajada. La línea de datos sólo se caía cuando la bajada quedaba aniquilada:
   exactamente al revés. Ahora son cuatro escalones y el primero que entra gana.
2. **`recortado` mentía en las notas sin bajada.** Una nota con `bajada: ''`
   caía al último escalón y se declaraba recortada sin haber sacrificado nada.
   Importa: hoy 43 de las 70 notas migradas no tienen bajada.
3. **`entra: true` estaba escrito a mano** en el camino feliz de X, y
   `componerFacebook` lo afirmaba siempre. Ahora las tres redes lo miden.
4. **Un partido suspendido se leía igual que uno cualquiera.** La rama de
   `en_curso`/`suspendido`/`postergado` mostraba sólo "Fecha 11 · Primera B
   2026". Ahora usa `ETIQUETA_ESTADO`, que existía justo para esto.
5. **La bajada no se trimeaba**, así que un salto de línea al final metía un
   blanco de más y hacía que el recorte se declarara distinto del original.

### Decisiones del copy que no hay que volver a discutir

- **Aldosivi va siempre primero en el marcador**, de local o de visitante, con
  la misma regla que la planilla (`ladosDelPartido()`).
- **`marcador()` de `formato.ts` no se puede usar acá**, y no es un olvido:
  pone al local primero y separa con " - ". El copy necesita Aldosivi primero y
  el `0-1` sin espacios del blueprint. `marcadorDelCopy()` es la misma idea
  sobre `ladosDelPartido()`, que es lo que fija el orden.
- **`rival()` tampoco se llama**: `ladosDelPartido().derecha` ya es el rival y
  además garantiza el orden. Llamar a las dos sería tener dos fuentes.
- **`resultadoParaAldosivi()` no entra en el copy.** El blueprint 6.3 no pide un
  "ganó/perdió" y agregarlo sería inventar copy que nadie especificó.
- **El orden de sacrificio de X es datos → recorte de bajada → bajada entera.**
  Las goleadoras y la cita son lindas de tener y además están en la nota; la
  bajada es lo único que explica de qué se trata. **El título y el link no se
  tocan nunca**: sin link no hay razón para postear.
- **El link cuenta 23 y no su largo real.** Un slug de 64 caracteres más entra
  con exactamente la misma bajada; medir con `.length` tiraría bajada que sí
  entraba. Hay un test que lo prueba con los dos slugs.
- **Instagram no lleva link**, porque en el caption no es clickeable. Va el
  dominio pelado ("Nota completa en periodicodelfos.com"): no lleva a ningún
  lado con un toque, pero es lo que alguien tipea si le interesó. Un caption que
  termina en la bajada no le da a dónde ir.
- **Los hashtags son tres y son los mismos en las tres redes.** Instagram admite
  30; una tira de hashtags genéricos no acerca lectores de fútbol femenino de
  Mar del Plata, los acerca aparecer siempre bajo los mismos tres.
- **`largoEnX()` sólo detecta links con esquema** (`http://`, `https://`). X
  también cobra 23 por un `dominio.com` pelado, y ahí contaríamos de menos —la
  dirección peligrosa, la que termina en 403. No se agregó una lista de TLD
  porque el único link que insertamos siempre lleva esquema y la bajada es prosa
  de una crónica. Si alguna vez una bajada menciona un dominio pelado, este es
  el lugar.

---

## La migración, en detalle

```
src/lib/migracion/tipos.ts          Payload de WP (Zod) + NotaMigrada
src/lib/migracion/texto.ts          Entidades HTML, texto plano, diacríticos
src/lib/migracion/titulo.ts         El sufijo: título limpio + fecha + temporada
src/lib/migracion/categorias.ts     Slugs de WP → enum categoria_t
src/lib/migracion/bajada.ts         Decide si el extracto sirve. No inventa uno.
src/lib/migracion/extensiones.ts    Extensiones de TipTap para parsear (nodo `imagen`)
src/lib/migracion/cuerpo.ts         HTML → JSON, podado al contrato del renderer
src/lib/migracion/imagenes.ts       Rutas del bucket, epígrafe/crédito
src/lib/migracion/redirecciones.ts  El mapa de 301
src/lib/migracion/transformar.ts    Orquesta todo. Puro: entra JSON, sale JSON.
src/lib/migracion/informe.ts        El informe en Markdown
src/lib/migracion/*.test.ts         92 tests, sin red y sin credenciales
scripts/migrate-wp.ts               Sólo I/O: red, disco y Supabase
```

Correrlo:

```
pnpm tsx scripts/migrate-wp.ts               # en seco, no escribe nada
pnpm tsx scripts/migrate-wp.ts --escribir    # sube al bucket y escribe en notas
pnpm tsx scripts/migrate-wp.ts --ayuda
```

Todo cae en `.migracion-wp/` (gitignoreado): `crudo/` con los cuatro JSON de la
API, `media/` con los binarios, `notas.json`, `redirects.json`, `informe.md` y
los dos archivos para completar a mano.

### Lo que dio la corrida en seco sobre las 70 notas reales

| | |
|---|---|
| Notas leídas | 70 |
| Con bajada aprovechable | 27 |
| **Sin bajada — hay que escribirla** | **43** (39 copiadas del cuerpo, 4 truncadas) |
| Imágenes | 109 |
| **Imágenes con `alt` en WordPress** | **0 de 233** |
| Categorías sin mapear | 0 |
| Redirecciones 301 | 82 (70 notas + 8 categorías + 1 autor + 3 fijas) |
| Largo promedio del título | 35 caracteres, contra 75 antes |
| Notas con la ficha del partido tipeada en el cuerpo | 68 |

**Ninguna nota se escribe hasta que tenga bajada, y ninguna se publica con un
`alt` pendiente.** Como WordPress no tiene un solo `alt_text` cargado, hoy las
70 quedarían en borrador. El camino es: completar `.migracion-wp/bajadas.json` y
`.migracion-wp/alt.json` y volver a correr — el script es idempotente (`upsert`
por `slug`) y nunca pisa lo que ya está escrito en esos dos archivos.

### Decisiones de la migración que no hay que volver a discutir

- **La lógica pura vive en `src/lib/migracion/` y el script es un envoltorio.**
  No sólo porque `vitest.config.mts` únicamente levanta `src/**`: una migración
  que se corre una vez en la vida no se puede depurar contra la API del sitio
  en producción.
- **`generateJSON` se importa de `@tiptap/html/server`, no de `@tiptap/html`.**
  El pelado tira *"generateJSON can only be used in a browser environment"*.
  Necesita `happy-dom`, que ahora está declarado en devDependencies en vez de
  aparecer por `autoInstallPeers`. `@tiptap/core` también se declaró: se importa
  directo en `extensiones.ts`.
- **Se parsea con vocabulario amplio y se poda después.** StarterKit trae
  `strike`, `underline` y `codeBlock` que el renderer no dibuja; es más seguro
  que el parser tenga dónde poner cada cosa y descartar en `sanearDocumento()`
  que perder un párrafo porque no había nodo que lo aceptara.
- **La migración y el renderer usan las mismas funciones** de
  `lib/tiptap/esquema.ts` (`hrefSeguro`, `atributosImagen`). Es imposible migrar
  un link o una imagen que después la nota no muestre.
- **El nodo `imagen` es un `atom`.** Sin eso ProseMirror baja a los hijos del
  `<figure>`, tira el `<img>` y deja el `<figcaption>` convertido en un párrafo
  huérfano abajo de la foto.
- **No se generan tres anchos con `sharp`.** El blueprint (sección 5, paso 2) lo
  pedía, pero se escribió antes que `<ImagenResponsive />`, que arma su `srcset`
  contra el transformador de Supabase Storage (`/render/image/public/…?width=800`),
  que ya entrega WebP en el ancho pedido. Generar las variantes sería subir
  cuatro archivos para servir uno y dejar copias que nadie regenera.
- **Se sube el original, no la variante escalada** que WordPress mete en el
  cuerpo (`…-1024x576.jpg`). El transformador achica pero no inventa píxeles.
- **La imagen destacada no se repite en el cuerpo.** WordPress la pone como
  portada y además como primer `<figure>`: pasa en 68 de las 70 notas. Sin esto
  la página mostraría la misma foto arriba del título y tres párrafos abajo.
- **Los slugs viejos se preservan tal cual.** Son largos y repiten el sufijo que
  se le saca al título, y aun así conviene: acortarlos obligaría a una 301
  igual, no mejora una URL ya indexada y rompería los links compartidos. El
  sufijo molesta en el título, que es lo que se lee.
- **La bajada se decide con cuatro señales** (vacía, marca de continuación,
  copiada del cuerpo, cortada sin signo de cierre) y todas fallan hacia el mismo
  lado: ante la duda queda pendiente y la mira una persona. Perder una bajada
  buena cuesta un renglón; publicar una mala cuesta la portada.
- **Los datos deportivos del cuerpo no se tocan.** Las 53 crónicas traen la
  formación y las incidencias tipeadas —violando la regla no negociable 1— pero
  convertirlas en filas de `partidos` y `eventos` a fuerza de regex es
  exactamente lo que el blueprint descarta (sección 5: se cargan a mano desde el
  admin). El informe deja la lista de las 68 notas afectadas.
- **El mapeo de categorías va por slug, no por id.** Los ids son de esa
  instalación de WordPress y no significan nada fuera de ella. `futbol-femenino`
  se ignora: está en 69 de 70 notas y no distingue nada.
- **La fecha del título no tiene columna en `notas`.** Es de
  `partidos.fecha_numero`. Viaja igual en `notas.json` y en el informe para no
  releer 70 títulos cuando se vinculen las notas con sus partidos.

### Lo que la migración todavía no hace

- **Vincular cada nota con su partido** (`notas.partido_id`). Necesita los
  partidos cargados a mano; el informe ya trae la tabla slug → temporada → fecha.
- **Escribir de verdad.** `--escribir` está implementado y typechequeado, pero
  nunca se ejecutó porque no hay proyecto de Supabase.

`scripts/generate-redirects.ts` ya está (Step 9 de la tabla de arriba): lee
`.migracion-wp/redirects.json`, traduce `origen`/`destino`/`permanente` a
`source`/`destination`/`permanent` con `formatoVercel()` (`src/lib/migracion/vercel.ts`,
con test) y escribe `vercel.json`, conservando cualquier otra clave que el
archivo ya tuviera (`headers`, `rewrites`, etc.). `formatoVercel()` también
corta la corrida si dos reglas comparten `origen` o si alguna redirige a sí
misma (loop de 301) — lo primero no debería pasar nunca porque
`unificarRedirecciones()` ya dedupea antes de escribir `redirects.json`, pero
es la clase de bug que conviene que tire error y no un `vercel.json` corrupto.
Sobre la barra final (`origen` siempre la trae, `destino` nunca) se decidió no
tocarla: Vercel matchea `source` literal contra la URL vieja indexada, así que
una sola forma alcanza — el comentario de `vercel.ts` lo explica.

No se corrió todavía contra el `redirects.json` real porque no existe en esta
máquina (`.migracion-wp/` está gitignoreado y la corrida en seco se hizo en
otra sesión) — se probó con fixtures chicos a mano, incluyendo uno con un loop
para confirmar que corta. Ver `--ayuda` para las opciones. **Falta**: correrlo
de verdad contra los 82 registros reales y confirmar el conteo.

## La página de nota, en detalle

```
src/app/nota/[slug]/page.tsx        Lee, resuelve y arma metadata + JSON-LD
src/app/demo/articulo/              Banco de pruebas con datos falsos — BORRAR después
src/components/content/
  ArticuloNota.tsx                  El artículo entero. Puro: no consulta nada.
  Bajada.tsx                        El resumen escrito a mano
  LineaAutor.tsx                    Firma + <time> + tiempo de lectura
  BotonesCompartir.tsx              "use client" — WhatsApp primero
  CuerpoNota.tsx                    Costura entre la página y <CuerpoTipTap />
  CajaAutor.tsx                     Foto, bio y redes
  NotasRelacionadas.tsx             Grilla de 3, misma temporada
src/lib/seo.ts + seo.test.ts        JSON-LD NewsArticle y la canonical (11 tests)
```

Mirarla: `pnpm dev` y entrar a `/demo/articulo`. La ruta real `/nota/[slug]`
necesita Supabase; hoy tira 500 apuntando a `NEXT_PUBLIC_SUPABASE_URL`, que es
lo correcto para un entorno sin configurar.

### Decisiones de la página de nota que no hay que volver a discutir

- **`<ArticuloNota />` es puro y la página sólo trae datos.** Es la misma regla
  que `<PlanillaPartido />`, y es lo que permite que exista `/demo/articulo`:
  sin esa costura no habría forma de mirar el artículo hasta que haya base.
- **Las planillas se resuelven en una sola consulta.** `partidoIdsDelCuerpo()`
  (nuevo, en `lib/tiptap/esquema.ts`, con 5 tests) junta los `partidoId` de los
  nodos `planilla`, se les suma el `partido_id` de la nota, y
  `getPartidosPorIds()` los trae todos juntos. El renderer nunca consulta.
- **La planilla va UNA sola vez por nota.** Si el cuerpo ya embebe el nodo
  `planilla` de ese partido, esa manda y la del pie no se dibuja
  (`partidoIdsDelCuerpo()` lo resuelve dentro de `<ArticuloNota />`, no en la
  página, para que ningún llamador futuro se lo olvide). La del pie existe sólo
  como respaldo para la crónica que no puso el nodo: sin ella esa nota se
  quedaría sin los datos del partido. **Salió duplicada en la primera versión y
  lo detectó el usuario** — el mismo eco que el blueprint le critica a la home
  de WordPress.
- **La planilla es plegable dentro de una nota** (`plegable`), con `<details>`
  nativo: sin JavaScript, accesible por teclado de fábrica y sigue siendo
  Server Component. Cerrada muestra igual el marcador, con Aldosivi primero
  (`ladosDelPartido()`, no `marcador()`): un acordeón cerrado que no dice el
  resultado obliga a abrirlo para ver lo único que la mayoría vino a buscar.
  **Arranca abierta a propósito** — los datos del partido son el corazón del
  proyecto y arrancar cerrada los esconde. En `/partido/[slug]` el prop va
  apagado: ahí la planilla *es* la página.
- **Compartir aparece dos veces: arriba y al final.** Arriba porque el blueprint
  lo ubica ahí (7.3, entre la portada y el cuerpo) y porque quien ya conoce la
  nota la reenvía sin scrollear novecientas palabras; al final porque el momento
  natural de compartir es cuando terminaste de leer. Son dos instancias
  independientes del componente: el "¡Copiado!" de una no toca a la otra.
- **No hay botón de Instagram Stories, y es a propósito.** No existe un link web
  que abra Stories con la nota cargada: las historias se componen desde la app.
  El único camino real desde el navegador es la hoja de compartir del sistema,
  así que hay un botón "Más" con `navigator.share` que **sólo se dibuja si el
  navegador lo soporta**. Un botón de Instagram que no lleva a ningún lado es
  peor que no tenerlo.
- **`PROFUNDIDAD_MAXIMA` se mudó de `render.tsx` a `esquema.ts`.** Ahora lo
  comparten los dos recorridos del árbol: el que dibuja y el que junta ids.
- **Hay un cuarto cliente de Supabase: `createStaticClient()`.** El de request
  pide cookies, y en build no hay request: `generateStaticParams` y el sitemap
  cortaban con *"`cookies` was called outside a request scope"*. **No era un
  problema de credenciales — pasa igual con el proyecto andando.** Las tres
  queries de slugs (`getSlugsNotas`, `getSlugsPartidos`, `getSlugsJugadoras`)
  ya usan el nuevo. No se usó `admin.ts` porque bypassea RLS: para decidir qué
  prerenderizar hay que ver lo que ve un anónimo, no más.
- **`haySupabase()` corta el prerenderizado cuando no hay proyecto.** El build
  no puede depender de que haya una base alcanzable. Sin variables no se
  prerenderiza ninguna nota y cada una se sirve a demanda; el día que existan,
  el build las genera sin tocar una línea.
- **lucide v1 no trae logos de marca.** `Instagram` y el pájaro de Twitter
  existían en la v0 y ya no: el import se cae. Los dos logos se dibujan a mano
  en `CajaAutor.tsx` y `BotonesCompartir.tsx`, misma excepción que la pelota.
- **Las tarjetas de relacionadas llevan `alt=""`.** El título está al lado; un
  alt que lo repita obliga a escuchar lo mismo dos veces por tarjeta.

### El renderer, en detalle

```
src/lib/tiptap/esquema.ts       Validación con Zod + filtrado de URLs. TS puro.
src/lib/tiptap/esquema.test.ts  70 tests con Vitest
src/lib/tiptap/render.tsx       <CuerpoTipTap /> — el recorrido del árbol
src/app/demo/nota/              Banco de pruebas con documentos falsos — BORRAR después
```

Mirarlo: `pnpm dev` y entrar a `/demo/nota`.

```tsx
<CuerpoTipTap cuerpo={nota.cuerpo} partidos={mapaDePartidos([partido])} nivelBase={2} />
```

- `cuerpo` entra como `unknown` a propósito: viene de la base y no se confía.
- `partidos` es un `ReadonlyMap<string, PartidoCompleto>` que arma la página.
  **El renderer no consulta la base.** Un `Map` y no un objeto plano porque el
  `partidoId` sale de un JSON ajeno y un `Record` respondería a `constructor`.
- `nivelBase` es el encabezado más alto que puede usar el cuerpo: 2 en
  `/nota/[slug]`, donde el `h1` es el título. Corre los headings y el título de
  la planilla embebida.
- La clase `.prose-nota` la pone el propio componente. La regla no negociable 2
  no puede depender de que la página se acuerde.

**Contrato de atributos de los dos nodos propios.** Lo tiene que respetar
`extensions.ts` cuando se escriba el editor:

```
{ type: 'imagen',   attrs: { src, alt, epigrafe?, credito? } }
{ type: 'planilla', attrs: { partidoId } }
```

### Decisiones del renderer que no hay que volver a discutir

- **La validación es de forma, no de vocabulario.** Zod exige que cada nodo sea
  `{ type: string, … }` y nada más. Si enumerara los tipos conocidos, un nodo
  nuevo —o uno que quedó de WordPress— invalidaría el documento entero y la nota
  saldría en blanco. Los tipos los resuelve el `switch` del renderer, que
  descarta lo que no sabe dibujar.
- **Los atributos sí se validan estrictamente, pero nodo por nodo.** Una imagen
  sin `alt` se cae sola y no se lleva el resto de la nota.
- **Una imagen sin `alt` se descarta entera.** Pierde contenido, y es a
  propósito: la alternativa es publicar una imagen que un lector de pantalla no
  puede anunciar. La base tiene el mismo criterio (constraint `alt_requerido`),
  así que llegar acá con `alt` vacío ya es una anomalía.
- **Un `href` que no pasa el filtro deja el texto sin link.** Se pierde el
  destino, nunca la frase.
- **El filtro de URLs usa el parser de `URL`, no una expresión regular.** Es el
  mismo que aplica el navegador: normaliza `JavaScript:` y descarta los saltos
  de línea intercalados de `java\nscript:`, que son las dos formas clásicas de
  esconder un esquema prohibido. Lista blanca: `http`, `https`, `mailto`, más
  rutas internas (`/…`) y anclas (`#…`). `//host` queda afuera: es una URL
  externa disfrazada de ruta relativa.
- **El `src` de las imágenes se limita a `http`/`https`.** Siempre sale del
  bucket. Cierra el `data:image/svg+xml` de paso.
- **Nada de contexto de React para pasar los partidos.** `createContext` no
  existe en un Server Component; usarlo obligaría a un `"use client"` y a mandar
  la planilla entera al navegador. El mapa baja por props en la recursión.
- **El orden de anidado de las marcas es fijo** (`code` → `em` → `strong` →
  `a`), no el del array `marks`, que llega en el orden en que se aplicaron en el
  editor. Así el link queda siempre por fuera y el área clickeable cubre todo el
  fragmento.
- **Los párrafos vacíos no se dibujan.** TipTap deja uno al final de todo
  documento; renderizarlo agrega un espacio que nadie escribió.
- **Corte de profundidad a 12 niveles** y `try/catch` alrededor del `safeParse`:
  `safeParse` atrapa los `ZodError` pero no un `RangeError` por desbordar la
  pila, que es lo que produciría un documento absurdamente anidado.
- **Nunca `generateHTML()` de `@tiptap/html`.** Está instalado y se usa en la
  otra dirección —HTML de WordPress → JSON, en `migrate-wp.ts`— pero para
  renderizar obliga a inyectar HTML crudo. Recorrer el JSON es lo único que
  permite que el nodo `planilla` sea un componente React de verdad, con props
  tipadas.

### Lo que quedó afuera, a propósito

- **`components/content/CuerpoNota.tsx`** (está en la estructura del blueprint).
  Hoy sería un reenvío a `<CuerpoTipTap />` sin nada propio. Se escribe en el
  step de `/nota/[slug]`, cuando tenga algo que hacer: leer los `partidoId` del
  cuerpo y pedir los partidos.
- **`lib/tiptap/extensions.ts`** — las definiciones de los nodos para el editor.
  Va con el editor (Step 7). El contrato de atributos está fijado arriba.

### La planilla, en detalle

`<PlanillaPartido partido={…} variante="completa|embebida|compacta" nivelTitulo={2} />`

Componente puro: recibe un `PartidoCompleto` y no consulta nada.

```
src/lib/partido.ts            Lógica pura: lados, agrupación, frases accesibles
src/lib/partido.test.ts       18 tests con Vitest
src/components/partido/
  PlanillaPartido.tsx         Orquestador + chip de resultado
  PlanillaCompacta.tsx        La tarjeta de la portada (todo un link)
  CabeceraPartido.tsx         Marcador con escudos
  LineaDeTiempo.tsx           La línea vertical de minutos
  EventoPlanilla.tsx          Un evento en su columna
  FormacionesPartido.tsx      Titulares y suplentes
  DatosPartido.tsx            Cancha, árbitra, torneo
  EscudoEquipo.tsx            Escudo con iniciales de respaldo
  IconoEvento.tsx             Los 9 iconos, de lucide (menos la pelota)
src/app/demo/planilla/        Banco de pruebas con datos falsos — BORRAR después
```

Mirarlo: `pnpm dev` y entrar a `/demo/planilla`.

### Decisiones generales y de la planilla, que tampoco se rediscuten

- **Next 15, no 16.** `next@latest` instala 16, que cambia APIs respecto de lo que
  el blueprint asume. Está fijado en `^15.5.0` en `package.json`. No subirlo.
- **Supabase para todo**, no Sanity: `notas.partido_id` es una FK real y el admin
  custom hay que construirlo igual para la planilla de carga.
- **Auto-posting a FB/IG/X: va.** Se dispara desde un Server Action, no desde un
  webhook de base de datos.
- **Sin paywall ni suscriptores.** No existe la tabla `subscribers`.
- pnpm 11 usa `allowBuilds` en `pnpm-workspace.yaml`, no `onlyBuiltDependencies`
  en `package.json`.
- **Aldosivi siempre a la izquierda de la planilla**, juegue de local o de
  visitante (`ladosDelPartido()`). Es un medio de un solo club: que la columna
  propia cambie de lado obliga a releer el marcador en cada partido. La
  condición de local/visitante se muestra abajo del nombre, no se pierde.
- **El gol en contra se anota del lado del equipo que suma**, con el "(e/c)" al
  lado del apellido de quien lo hizo. Así la columna izquierda de goles coincide
  siempre con el marcador de Aldosivi. El resto de los eventos siguen a la
  jugadora.
- **La línea de tiempo se lee con una frase por minuto.** La grilla visual va
  con `aria-hidden` y cada `<li>` lleva un `sr-only` del tipo *"Minuto 23. Gol de
  Aldosivi: Lucía Cortadi."*. Una tabla de tres columnas leída celda por celda
  —"Cortadi", "23 apóstrofo", vacío— no comunica nada. Por eso **no hay links a
  jugadoras dentro de la línea de tiempo**: un elemento enfocable adentro de un
  contenedor oculto es una trampa de teclado. Los links van en las formaciones.
- **La línea de tiempo es horizontal**: los minutos avanzan de izquierda a
  derecha sobre un eje central, Aldosivi arriba y el rival abajo. Era vertical y
  se dio vuelta porque dentro de una nota crecía hacia abajo tanto como eventos
  tuviera el partido y empujaba el artículo fuera de la pantalla; en horizontal
  un partido de dos goles y uno de nueve miden lo mismo de alto. Lo que la
  mantiene derecha es `grid-rows-subgrid`: sin él cada columna resuelve sus tres
  filas por su cuenta y el eje queda en escalera cuando una columna tiene dos
  eventos y la vecina ninguno. El scroll horizontal vive **sólo** en esa tira,
  nunca en el body. Lleva una leyenda `↑ Aldosivi · ↓ Rival` con `aria-hidden`,
  porque arriba y abajo del eje hay dos equipos y nada que lo diga —en vertical
  lo resolvía la cabecera con los escudos a izquierda y derecha—; va oculta a
  lectores de pantalla porque cada frase del `sr-only` ya nombra al equipo.
  `agruparPorMinuto()` no se tocó: es lógica pura y no sabe de layout.
- **Los iconos salen de lucide** (`lucide-react`, ya estaba en `package.json` y
  no se usaba en ningún lado). Tarjetas con `RectangleVertical`, cambios con
  `ArrowUp`/`ArrowDown`/`ArrowDownUp`, penal errado con `X` encima de la pelota,
  lesión con `Cross`.
- **La pelota es la única excepción, y no es un descuido: lucide no tiene una
  pelota de fútbol.** `Goal` es una bandera sobre un blanco y `Volleyball` es
  una pelota de vóley con sus curvas. Ninguna de las dos puede ser lo que marca
  un gol en un medio de fútbol, así que el `<Pelota />` en negativo —círculo
  lleno, pentágono calado— se dibuja a mano en `IconoEvento.tsx`. Si alguna vez
  se prefiere la de vóley antes que un SVG propio, es una línea.
- **Los colores de los iconos van por utilidad de Tailwind** (`stroke-roja`,
  `fill-amarillo`) y no por atributo SVG: la clase CSS le gana al atributo de
  presentación y además el token se redefine solo en tema oscuro. El borde de
  las tarjetas pasó de un `rgba()` fijo a `stroke-tinta/35` por lo mismo — en
  tema oscuro el rgba fijo era negro sobre negro. **Falta mirarlo.**
- **Las clases `.meta`, `.dato` y `.tactil` viven en `@layer components`.** Sin
  la capa le ganan a cualquier utilidad de Tailwind por orden de cascada y hay
  que pelearlas con `!important`.
- **Usar las utilidades canónicas de Tailwind** (`text-verde-600`, `font-display`)
  y no `text-[var(--color-verde-600)]`: el `@theme` de `globals.css` ya las
  genera, y el linter del editor marca la forma larga.

### El rediseño "portal deportivo"

Partió de `referencia/estilo-prueba.html`, un mockup de portada que trajo el
usuario (estaba en `src/`, se movió afuera para que Tailwind no lo escanee y
genere utilidades de clases que no existen en el proyecto). El mockup venía en
Tailwind v3 por CDN con `tailwind.config` en JS; los tokens se tradujeron a
`@theme` de v4, no se copiaron.

**Las tres decisiones las tomó el usuario**, porque contradecían cosas escritas:

1. **Oscuro por defecto, claro disponible.** Se invirtió `globals.css`: `@theme`
   ahora tiene la paleta oscura y el claro vive en
   `@media (prefers-color-scheme: light)`.
2. **Los titulares siguen en Archivo.** El mockup usaba Barlow Condensed, que es
   exactamente lo que el blueprint descartó ("sin caer en el condensado que usa
   medio internet"). El aire deportivo lo da `.titular` —caja alta, tracking
   −0.02em, peso 800— y no un cambio de familia.
3. **El cuerpo de la nota no se tocó.** Sigue en Source Serif a 68ch. El
   rediseño entra en chrome, portada, listados y tarjetas. Esto no costó nada
   porque **el mockup es sólo una portada: no tiene una sola nota adentro**, así
   que nunca contradijo la regla no negociable 3.

Lo que hizo barato revestir todo: los componentes ya usaban utilidades
semánticas (`bg-papel`, `text-tinta`, `border-linea`), así que cambiar los
valores de los tokens cambió el sitio entero. **Sólo había un color en forma
larga** (`text-[var(--color-gris)]` en `ImagenResponsive`) y se normalizó.

Contraste verificado antes de entrar, con el mismo criterio con que el blueprint
ya había aclarado el rojo:

- `gris-tenue` del mockup (`#6B7280`) daba 3.8:1 sobre el fondo → `#808A96`, 5.3:1.
- El amarillo del mockup como **texto** sobre una tarjeta clara da 2.6:1: el
  "Leer nota →" de las tarjetas va en verde, que pasa en los dos temas.
- Como **fondo** de badge con texto oscuro el amarillo sí pasa, y así quedó.
- En tema claro el amarillo bajó a `#E08C00`: el `#F5A623` no llega a AA sobre
  papel blanco.

**Se arregló de paso** el bug que estaba anotado en "Cosas menores": el logo del
header usaba `verde-900`, que no se redefinía en oscuro y quedaba en ~1.3:1.
Ahora va en `verde-600`.

**Lo que del mockup NO se implementó, a propósito:** la tira de resultados en
vivo del header (marcador en curso, próximo partido, countdown). Necesita datos
reales de `partidos` y es el `<BarraEstado />` del Step 19. Poner resultados
inventados en el header del sitio real sería peor que no tenerla. Tampoco se
adoptaron los Material Symbols: los iconos siguen saliendo de lucide (regla 5
del CLAUDE.md), que tiene equivalentes para todos los del mockup y evita sumar
otra webfont.

### Auditoría de la rama contra el blueprint

Se revisó la rama entera —no lo que decía este archivo, sino el código— y **se
sostiene**: `tsc --noEmit` limpio, 256 tests, `pnpm build` verde con 8 rutas,
sin `any` ni `@ts-ignore`, `lang="es-AR"`, la 68ch intacta y los únicos
`"use client"` son `BotonesCompartir` y `supabase/client.ts`. La paleta oscura
se verificó a mano con la fórmula de WCAG y da AA en todos los pares que se
usan. Salieron tres cosas:

1. **Faltaba `color-scheme`.** Con el oscuro por omisión, el navegador seguía
   dibujando su mitad de la página en claro: barras de scroll, controles de
   formulario y el fondo previo a que cargue el CSS. **Arreglado:** `html` lleva
   `color-scheme: dark` y el media query lo pasa a `light`. El `:root` del media
   query le gana al `html` por especificidad, así que anda en los dos sentidos.
2. **El blueprint contradecía al código** en el tema por omisión. **Arreglado:**
   se actualizó la sección 8 del blueprint —tokens, `color-scheme` y los ratios
   de contraste medidos— con una nota explicando que la inversión fue deliberada
   y qué *no* se tocó. El blueprint vuelve a ser fuente de verdad.
3. **`vercel.json` no existía.** El script estaba escrito y testeado pero nunca
   había corrido: este archivo asumía que `.migracion-wp/` no estaba en la
   máquina, y sí está. **Corrido:** 82 reglas, 82 orígenes únicos, 0 loops,
   todas 301. La regla no negociable 8 pasó de "datos sueltos" a cumplida.

Queda anotado y sin arreglar, porque hoy no se viola: la roja sobre
`--color-tarjeta` da 4.24:1 y no llegaría a AA como texto normal. El chip de
resultado vive sobre `bg-papel` (4.91:1). Mirarlo si algún texto rojo se muda a
una tarjeta.

### Cambios al design system que hubo que hacer

1. `--color-roja` se aclara a `#F06A6F` en modo oscuro. El `#C42127` del
   blueprint da 3.3:1 sobre el papel oscuro y no llega a AA como texto.
2. `.meta` / `.dato` / `.tactil` pasaron a `@layer components` (ver arriba).
3. `globals.css` neutraliza los estilos de `.prose-nota` adentro de `.planilla`:
   el marcador de la planilla embebida es un `<h2>` y sin eso se lleva el filete
   verde, la serif y los 2em de margen de los subtítulos de la nota.
4. `.prose-nota` recuperó las viñetas, la sangría y el margen entre items que
   Preflight de Tailwind le saca a `ul`/`ol`, más estilos de `<code>` y `<hr>`.
   No existían porque hasta el renderer nada emitía esos nodos.
5. `.prose-nota .planilla ul/ol/li` los vuelve a neutralizar: las formaciones y
   la línea de tiempo son listas de estructura, no de lectura, y no llevan
   viñeta ni sangría.

### Pendiente manual (no lo puede hacer el agente)

1. **`eslint.config.mjs` está roto** — quedó de Next 16 e importa
   `eslint-config-next/core-web-vitals` sin extensión. Un hook de protección de
   configuración bloquea su edición. No rompe el build, sí el lint. Arreglarlo a
   mano con `FlatCompat` (requiere `pnpm add -D @eslint/eslintrc`) o deshabilitar
   el hook temporalmente.
2. **Crear el proyecto de Supabase** y completar `.env.local` desde `.env.example`.
   Sin esto no hay auth, admin, ni datos.
3. **Escribir 43 bajadas** en `.migracion-wp/bajadas.json`. Es lo único que
   bloquea que la migración escriba, y no lo puede hacer un agente: son el
   resumen de la nota en la portada y en las redes.
4. **Escribir 109 textos alternativos** en `.migracion-wp/alt.json`. WordPress no
   tiene ninguno cargado. Mientras falten, las notas quedan en borrador.
   Priorizar las portadas: son las que se ven.
5. **Meta App Review** — arrancarlo ya. Es el mayor lead time del proyecto y no
   depende del código.
6. **X Developer Portal**, tier Basic.

### Cosas menores anotadas, sin arreglar

- A 320px de ancho —abajo del objetivo de 375 del blueprint— el icono del penal
  errado se recorta un par de píxeles contra el borde de la tarjeta. No hay
  scroll horizontal. A 375 está limpio.
- `src/lib/partido.ts` tiene 363 líneas. La regla de 300 del CLAUDE.md es para
  componentes; si igual molesta, se parte en `partido/lados.ts` y
  `partido/eventos.ts`.
- `scripts/migrate-wp.ts` tiene 523 líneas, pero es un script de I/O con seis
  fases secuenciales, no un componente. Partirlo escondería el orden, que es lo
  único que hay que entender para leerlo.
- La migración detecta cuatro temporadas: `primera-b-2026`, `primera-c-2024`,
  `primera-c-2023` y `primera-b-2023`. Esta última sale de una sola nota
  —*"Tiburonas 7-0 Laferrere: Semifinales – Aldosivi Femenino en la Primera B
  2023"*— y lo más probable es que sea un error de tipeo del sitio viejo, porque
  las otras de esa temporada dicen Primera C. La migración lo copia tal cual: no
  le corresponde corregir datos. Verificarlo al crear las temporadas.


---

## La paleta crema y los dos bocetos

El usuario trajo dos bocetos HTML —portada y crónica— que **comparten tokens** y
que son la dirección definitiva. Respetan lo que el blueprint ya pedía y que el
mockup oscuro rompía: Archivo con el eje variable (`font-variation-settings:
"wdth"`, que es el "eje expandido" del blueprint), Source Serif en el cuerpo,
`--medida:68ch` declarada y aplicada, `focus-visible` con outline de 3px,
`prefers-reduced-motion`, HTML semántico con `aria-current` y `aria-label`.

**Todo el contraste está medido** con la fórmula de WCAG, no estimado:

```
bajada #2f342f / crema      11.45      gris #6B6F69 / crema        4.61
cuerpo #1e221e / crema      14.53      gris / papel blanco         5.12
verde-tinta / crema          7.33      verde-tinta / papel blanco  8.14
amarillo / verde             6.22      blanco 60% / verde          5.56
amarillo / verde-oscuro      8.02      blanco 50% / verde-oscuro   5.01
```

Lo único que falla es el texto del placeholder gris (`.ph.claro`, 2.82:1) y no
existe en producción: ahí van fotos reales.

**Dos arreglos que salieron del swap:**

1. `--color-gris-tenue` daba **3.54:1** en el tema claro y no llegaba a AA.
   Ahora `--color-gris` va un escalón más oscuro (`#5F645E`) y `tenue` toma el
   `#6B6F69` del boceto, que es el gris más claro que todavía pasa.
2. `html { color-scheme }` quedó invertido al cambiar de tema. Está en `light`,
   y la variante oscura lo pisa desde su media query.

### Lo que falta portar, en orden

1. ~~**El blueprint miente.** La sección 8, el bloque resumen de Design System y
   la sección homónima de `CLAUDE.md` decían que el tema por omisión era el
   oscuro.~~ **Hecho.** Los tres reflejan hoy lo que hay en `globals.css`, con
   los contrastes medidos de la paleta crema y el valor nuevo de `verde-900` en
   oscuro.
2. ~~Guardar los dos bocetos en `referencia/`.~~ **Hecho.** Están en
   `referencia/boceto-portada.html` y `referencia/boceto-cronica.html`, en
   UTF-8 correcto y verificado. Son la fuente visual de todo lo que sigue:
   comparten tokens entre sí y con `globals.css`.
3. ~~**El chrome:** `Header` y `Footer`.~~ **Hecho.** Ver "El chrome, en
   detalle" acá abajo. Falta sólo la cuarta columna del pie ("Seguinos"), que
   está bloqueada por no haber handles reales.
4. **La página de nota ya existe y funciona** — esto no se construye de cero, se
   le agrega lo que el boceto trae de más: miga de pan, la byline compacta con
   iniciales sobre verde, `figcaption` con epígrafe y crédito, la tira de temas,
   el anterior/siguiente y la tabla de estadísticas del partido. La `.cita` con
   filete amarillo y el `.dato` en mono son del renderer de TipTap.
5. ~~**Step 9, la portada y los listados.**~~ **Hecho.** Ver "La portada, en
   detalle" y "Los listados, en detalle" acá abajo.

### Las rutas públicas, en detalle

```
src/app/buscar/page.tsx          El buscador, sin JavaScript
src/lib/busqueda.ts              El saneado de ?q=, con 6 tests
src/app/plantel/page.tsx         Puerta corta a /plantel/[temporadaSlug]
src/app/fixture/page.tsx         Puerta corta a /temporada/[slug]
src/components/layout/SinTemporada.tsx   Lo que ven las dos si no hay temporada
src/app/partido/[slug]/page.tsx  La ficha, con la planilla que ya existía
src/app/demo/partido/            La ficha con datos falsos
```

**Tres links del menú principal daban 404 hasta acá.** `/buscar` está en el
header de todas las páginas, y `/plantel` y `/fixture` en la nav y en el pie.
Un 404 en un link del menú le dice al lector que el sitio está roto.

**Decisiones que vale la pena no rediscutir:**

- **El buscador es un Server Component y su formulario no lleva JavaScript.** El
  blueprint permite que sea cliente, pero un `<form method="get">` hace lo
  mismo, anda con JS desactivado y deja el término en la URL, así que una
  búsqueda se puede compartir y queda en el historial. Se vuelve cliente el día
  que haga falta autocompletado.
- **`/buscar` no se indexa.** Una página de resultados en el índice de Google es
  contenido que escribe quien la visita.
- **`buscarNotas()` ahora devuelve un tipo.** `rpc()` no lo conoce, así que los
  resultados entraban al componente como `any`. El tipo nuevo es
  `ResultadoBusqueda`, **más chico que `NotaResumen`**: la búsqueda no trae foto
  ni autor, así que los resultados no se pueden dibujar con la tarjeta de la
  portada.
- **`/plantel` y `/fixture` resuelven la temporada activa y redirigen.** La nav
  no puede linkear a un slug que cambia cada año: si apuntara a
  `/temporada/primera-b-2026`, en 2027 habría que editarla y todos los links
  viejos quedarían en la temporada equivocada.
- **La ficha de partido no pliega la planilla.** En una crónica la planilla es un
  aparte y se pliega; en `/partido/[slug]` la planilla *es* la página.
- **El `<h1>` de la ficha lo pone la planilla**, con el marcador adentro. Por eso
  la página pasa `nivelTitulo={2}` y no escribe su propio título: dos `<h1>`
  rompen la jerarquía.
- **`NotasRelacionadas` recibe el título por prop.** Al pie de una nota es "Seguí
  leyendo"; al pie de un partido es "Lo que se escribió sobre este partido", que
  es otra cosa.

### El bug de scroll horizontal, que venía de antes

**Síntoma:** en un viewport de 375 px, `/demo/planilla`, `/demo/articulo`,
`/demo/nota` y la ficha de partido tenían scroll lateral en **toda la página**.
El documento medía 1117 px de ancho. Pasaba también en el build de producción,
así que no era un artefacto del modo desarrollo.

**Causa:** los `sr-only` de cada evento de `<LineaDeTiempo />` y los iconos son
`position: absolute`. El div que envuelve la línea de tiempo tiene
`overflow-x: auto` pero era `position: static`, así que **no era el bloque
contenedor de sus descendientes absolutos**: se posicionaban contra la página,
se escapaban del scroll horizontal y la estiraban. `body.scrollWidth` daba 375
y `documentElement.scrollWidth` 1117 — esa diferencia es la firma del problema.

**Arreglo:** una clase, `relative` en ese contenedor. Las 12 combinaciones de
página y tema a 375 px ahora dan `scrollWidth === clientWidth`.

**Por qué no se había visto:** este archivo lo tenía anotado hacía tres
sesiones como "sigue sin mirarse `/demo/planilla` a 375 px". No se ve leyendo el
código ni en una captura —la página se dibuja bien, lo que sobra es espacio
vacío a la derecha—; sólo aparece comparando `scrollWidth` con `clientWidth`.
Conviene medirlo en cada página nueva.

### El SEO técnico, en detalle

```
src/app/robots.ts          Tapa /admin, /demo y /api
src/app/sitemap.ts         Rutas fijas + notas, partidos y jugadoras
src/app/rss.xml/route.ts   El feed, revalidado cada hora
src/lib/rss.ts             El armado del XML, puro y con 9 tests
src/app/api/og/route.tsx   La imagen 1200×630 de las tarjetas de redes
src/app/quienes-somos/     La institucional que sí se pudo escribir
```

**Decisiones que vale la pena no rediscutir:**

- **`/demo` se bloquea en `robots.txt` igual que `/admin`.** Son las páginas con
  datos inventados —marcadores, goles, posiciones—: que se indexaran sería
  publicar datos deportivos falsos con el dominio del medio. Cada demo además
  lleva su `robots: { index: false }`, así que están tapadas por dos lados.
- **El sitemap funciona con la base vacía.** Sin Supabase salen las rutas fijas
  y nada más. Un sitemap que revienta el build es peor que uno corto.
- **`/contacto` y `/privacidad` no están en el sitemap**, porque las rutas no
  existen todavía. Un sitemap que apunta a un 404 le enseña al crawler a
  desconfiar del archivo entero. Entran cuando entren las páginas.
- **El RSS se arma a mano, no con una librería.** Son treinta líneas y una
  dependencia menos. Lo que sí tiene tests es el escapado: los títulos de este
  sitio tienen `&`, comillas y dos puntos, y un `&` sin escapar rompe el
  documento entero y no sólo ese item.
- **Sin base el feed sale válido y vacío, no 500.** Un lector de feeds que
  recibe un error en la primera lectura puede dejar de reintentar.
- **`/api/og` existe porque muchas de las 70 notas migradas no tienen foto de
  portada.** Sin esto se comparten como un rectángulo gris con el dominio.
  Ahora `twitter.card` es siempre `summary_large_image`, porque siempre hay
  imagen.
- **Los colores de la imagen OG van en hexadecimal y no en tokens.** Es una
  imagen, no una página: no hay `prefers-color-scheme` en una tarjeta de
  Twitter.
- **Cada página declara su canónico**, la portada incluida: sin eso, los
  `?fbclid=` que agregan las redes al compartir se indexan como páginas
  distintas con el mismo contenido.

**Lo que quedó flojo y conviene arreglar:** la imagen de `/api/og` **no sale en
Archivo**. `ImageResponse` usa su fuente por omisión y el `fontWeight: 800` no
se aplica, así que el titular sale en peso normal. Se ve bien y los acentos
salen correctos, pero no es la marca. Para arreglarlo hay que cargarle el
archivo de la fuente a la ruta y pasárselo en `fonts`.

### Los listados, en detalle

```
src/app/cronicas/page.tsx              Lee la página y no dibuja
src/app/analisis/page.tsx              Lo mismo con la otra categoría
src/components/listado/ListadoNotas.tsx  El cuerpo de los dos
src/components/listado/Paginacion.tsx    El paginador, más `hrefDePagina()`
src/lib/paginacion.ts                    La aritmética, pura y con 7 tests
src/app/demo/listado/                    Página 2 de 4, y un listado vacío
```

**Decisiones que vale la pena no rediscutir:**

- **Las dos rutas son dinámicas (`ƒ` en el build), y está bien.** Leer
  `searchParams` saca a una ruta del prerender; es el precio de paginar por
  querystring. El `revalidate = 60` sigue valiendo para el cacheo de los datos.
  Si algún día molesta, la alternativa es `/cronicas/pagina/[n]`, pero el
  blueprint (7.1) define la ruta como `/cronicas` a secas y las 301 de WordPress
  ya están escritas contra esa forma.
- **La paginación son links, no botones.** Sin JavaScript funcionan igual, y es
  la única forma en que un crawler llega a las notas viejas: con 70 notas y 12
  por página, la última crónica de 2023 está a seis saltos de la portada.
- **Se dibujan todos los números**, no sólo anterior/siguiente. Con seis páginas
  no hace falta el recorte con puntos suspensivos; si algún día son treinta, la
  fila envuelve.
- **La página actual lleva `aria-current="page"`**, no sólo el fondo verde: el
  color no se lo puede leer nadie con un lector de pantalla.
- **Cada página es su propio canónico.** Apuntar la 2 a la 1 le dice a un
  buscador que las notas de la 2 son duplicados, y las saca del índice. Es justo
  lo contrario de lo que hace falta con 70 notas migradas.
- **Una página más allá del final es un 404**, no un listado vacío. Sin eso
  `/cronicas?pagina=999` devuelve 200 y entra al índice. Comprobado en el
  navegador.
- **`paginaPedida()` valida con una expresión y no con `Number()`.**
  `Number('1e3')` es 1000 y `Number(' 2 ')` es 2, y ninguna de las dos es una
  página que alguien haya escrito. Hay un test por cada caso.
- **El listado no tiene nota destacada.** En la portada la primera ocupa dos
  columnas porque es la más nueva de todas; en la página 3 de un archivo esa
  jerarquía no significa nada.


### La portada, en detalle

```
src/components/portada/NotaTapa.tsx        Bloque verde a dos columnas, foto 7fr / texto 5fr
src/components/portada/GrillaNotas.tsx     3 columnas, la primera ocupa 2
src/components/portada/TarjetaNota.tsx     La tarjeta sin caja del boceto
src/components/portada/ListaAnalisis.tsx   Miniatura cuadrada + texto, con línea
src/components/portada/TarjetaPlantel.tsx  El aside verde, con caras y stats opcionales
src/components/portada/CabeceraBloque.tsx  Título + link al listado + filete grueso
src/components/portada/BloqueArchivo.tsx   El cierre: adónde ir después
src/components/portada/FotoNota.tsx        La foto, o su reemplazo cuando no hay
src/app/page.tsx                           La portada real. Lee y no dibuja
src/app/demo/portada/                      La misma portada con datos falsos
```

Todos son Server Components y ninguno consulta nada: reciben la nota por props.
Es lo que permite que `/demo/portada` muestre el boceto entero mientras `/`
está vacía.

**Decisiones que vale la pena no rediscutir:**

- **La tarjeta de la portada no es la de `<NotasRelacionadas />`.** Aquélla es
  una ficha con fondo y borde, para cerrar una nota; ésta es la del boceto, sin
  caja, apoyada sobre el crema como una columna de diario. Son dos componentes a
  propósito. Si algún día convergen, converge el boceto primero.
- **`FotoNota` dibuja un bloque rayado cuando no hay imagen.** No es un
  placeholder de desarrollo: de las 70 notas de la migración varias no tienen
  portada, y una tarjeta que colapsa sin foto desarma la grilla. Los `.ph` del
  boceto ya lo preveían.
- **La bajada de la tapa respeta los 68ch** aunque no sea cuerpo de nota. Es el
  párrafo más largo de la portada y la regla no negociable 3 no tiene
  excepciones útiles.
- **El botón del bloque de plantel lleva `text-negro-cancha`, no `text-tinta`.**
  Sobre el amarillo, `tinta` en tema oscuro es casi blanco: 1.95:1.
  `negro-cancha` pasa en los dos temas (8.02:1 y 9.61:1).
- **`etiquetaCategoria()` se mudó a `src/lib/formato.ts`.** Estaba duplicada
  dentro de `NotasRelacionadas.tsx` y la usan tres lugares.
- **Las estadísticas del bloque de plantel van en un `<dl>` con
  `flex-col-reverse`**: el `<dt>` tiene que preceder a su `<dd>` en el DOM, pero
  el número se lee arriba y la etiqueta abajo.

### El chrome, en detalle

```
src/components/layout/Header.tsx        Servidor. Bloque verde: marca, buscador, fecha
src/components/layout/NavPrincipal.tsx  Cliente. La nav, por el aria-current
src/components/layout/FechaDeHoy.tsx    Cliente. La fecha del día
src/components/layout/Footer.tsx        Servidor. negro-cancha, filete de 6px, legal en mono
```

**Aparecieron dos componentes cliente nuevos, y los dos están justificados.** El
proyecto venía con `"use client"` sólo en `BotonesCompartir`, `PlanillaPartido`
y `supabase/client.ts` (ojo: la auditoría anterior decía "sólo BotonesCompartir
y supabase/client.ts" y ya estaba desactualizada, `PlanillaPartido` es cliente
desde que se hizo plegable). Los dos nuevos son del tamaño mínimo posible — el
`<ul>` de la nav y un `<time>` — y el resto del chrome sigue en el servidor:

- **`NavPrincipal`**: `aria-current` necesita la ruta actual, y el App Router no
  se la da a un layout de servidor. La alternativa es leerla de un header puesto
  por el middleware, lo que obliga a `headers()` y saca a la portada del
  prerender: se caen las 8 rutas estáticas del build. No vale la pena.
- **`FechaDeHoy`**: la portada se prerenderiza, así que un `new Date()` en el
  servidor se congela en el momento del build y el sitio queda mostrando la
  fecha del último deploy. El primer render devuelve un espacio duro, que
  reserva el alto de la línea, y la fecha entra al hidratar: no hay salto ni
  warning de hidratación. Comprobado en el DOM.

**Lo que se arregló de paso:** el hover de los links del pie iba en `verde-600`,
que sobre `negro-cancha` da **1.98:1** y es invisible. Ahora va en amarillo
(8.02:1).

**Lo que del boceto NO entró, a propósito:**

- **La barra de resultados de arriba del header** (marcador en curso, próximo
  partido, posición en la tabla). Está en los dos bocetos y es el
  `<BarraEstado />` del Step 19: necesita `partidos` cargado. Rellenarla con
  marcadores de ejemplo viola la regla no negociable 1.
- **La cuarta columna del pie, "Seguinos"** (Instagram, X, YouTube). No hay un
  solo handle del medio en el proyecto ni en los datos de WordPress — los
  únicos links a redes que aparecen en las notas son embeds de cuentas ajenas —
  y escribir `instagram.com/periodicodelfos` a ojo es inventar un dato. El pie
  quedó a tres columnas (`2fr 1fr 1fr`) hasta que estén.
- **JetBrains Mono.** La fecha y la línea legal usan `.dato`, que es IBM Plex,
  porque la decisión sigue sin tomarse (ver abajo).
- **El ancho de 1280px del boceto.** El sitio corre a 1200, que es
  `--container-sitio` y lo que usa todo el resto del código. Cambiarlo es tocar
  también la página de nota; si se cambia, que sea en un solo lugar.

### Las páginas deportivas, en detalle

Las tres que cierran el Step 14. Ninguna inventa un dato: todo sale de la base
y de las dos vistas que ya existían.

```
src/lib/temporada.ts        Pestañas, fixture partido en dos y cuentas de la tabla
src/lib/plantel.ts          Agrupado por puesto, orden por dorsal, nombres
src/lib/jugadora.ts         Edad, totales de carrera, rival de cada gol
                            + 46 tests entre los tres
src/components/temporada/   PestanasTemporada, FixtureTemporada,
                            TablaPosiciones, ListaGoleadoras
src/components/plantel/     GrillaPlantel, TarjetaJugadora
src/components/jugadora/    CabeceraJugadora, TablaEstadisticas, ListaGoles,
                            FotoJugadora
```

**`/temporada/[slug]` — las tres pestañas son links con `?ver=`, no JavaScript.**
Un `role="tablist"` de verdad necesita manejo de foco con flechas y estado en el
cliente, y la página es un Server Component; unas pestañas falsas son peores que
unos links, que ya se navegan con Tab. La ventaja concreta: **cada vista carga
sólo su propia query**. Entrar al fixture no pide la tabla ni las goleadoras,
que es justo lo que obligarían unas pestañas de cliente. La canonical apunta a
la ruta pelada, sin `?ver=`, así que las tres no se indexan como tres URLs.

**El fixture va partido en dos: "Lo que viene" y "Jugados".** En una sola lista
corrida el próximo partido queda perdido en el medio, y es el dato que más se
busca. Un partido **suspendido con el marcador cargado cuenta como jugado**
—se jugó, aunque no entero— y eso lo decide `yaSeJugo()`, que está testeado.

**El bloque verde de arriba del fixture se llama "Lo cargado hasta acá", no
"Campaña".** Se cuenta desde los partidos que cubrió el medio; la tabla de
posiciones se carga a mano y cubre la zona entera. Los dos números **pueden no
coincidir** y el título lo dice.

**La tabla es una `<table>` de verdad**, con `<th scope="row">` en el equipo:
sin eso un lector de pantalla lee "14" sin decir de quién. El `<caption>` avisa
a qué fecha corresponde y que se carga a mano. En 375px scrollea **el
contenedor**, no el documento.

**`/plantel/[temporadaSlug]`** agrupa por puesto del arco hacia adelante —no
alfabético— y mete DT y ayudante en un solo grupo "Cuerpo técnico". Toda la
tarjeta es un link a la ficha: es lo que convierte el plantel en la puerta a
~32 URLs indexables que hoy no existen.

**`/jugadora/[slug]`** es la respuesta a "¿cuántos goles lleva y a quién se los
hizo?", que hoy no se puede contestar sin leer las once crónicas. Los totales
son la **suma de todas las temporadas** y abajo se abren año por año; los goles
van del más nuevo al más viejo —no por el minuto del partido— y cada uno linkea
a su partido. El dorsal y la cinta de capitana salen del plantel de la
temporada en curso, no de la ficha: son de la temporada y cambian de un año al
otro.

### Lo que hubo que tocar de lo que ya estaba

- **`getGolesDeJugadora()` mentía en su tipo.** La query ya pedía el partido
  embebido —slug, fecha y los dos equipos— pero se casteaba a
  `EventoConJugadora`, que no tiene ese campo: la ficha no podía ver los datos
  que la query estaba trayendo. Ahora devuelve `GolDeJugadora`, que declara la
  forma real del `select`.
- **`resumenGoles()` y `<PlanillaCompacta />` aceptan un partido sin eventos.**
  El fixture sale de `getPartidosTemporada()`, que devuelve `PartidoConEquipos`
  —traer la planilla entera de cada fecha para dibujar una grilla de tarjetas es
  pedir media base—. Sin eventos la tarjeta dibuja el marcador y no la línea de
  goleadoras. Es el tipo `PartidoResumible`, con su test.
- **`ORDEN_POSICIONES` y `NOMBRE_POSICION` salieron de `queries/jugadoras.ts`** a
  `src/lib/plantel.ts`: son presentación pura y desde el archivo de queries
  arrastraban el cliente de Supabase —y con él `next/headers`— adentro de
  cualquier test que los tocara.
- **`getSlugsTemporadas()`** es nueva, con `createStaticClient()`, para el
  sitemap y `generateStaticParams`. El sitemap ahora emite las dos páginas de
  cada temporada.
- **La nav marcaba la sección equivocada.** `/fixture` redirige a
  `/temporada/<slug>`, y ahí la nav se apagaba entera justo en la página a la
  que acababa de mandar. Ahora `/fixture` declara `/temporada` como prefijo
  propio.
- **`/plantel`, `/fixture` y `/buscar` no tenían ningún `<h1>`**: el título lo
  ponía `<CabeceraBloque />`, que es un `<h2>` porque en la portada es una
  sección. Ahora el componente acepta `nivel` y esas tres páginas pasan `1`.
- **`/nota/[slug]` y `/partido/[slug]` tiraban 500 sin base.** Cualquier visita a
  un slug construía el cliente de Supabase con las variables en `undefined`.
  Ahora preguntan `haySupabase()` y devuelven 404, como las tres páginas nuevas.

### La trampa del ancho que casi se repite

`<FotoJugadora />` es `w-full` adentro, y en las goleadoras se le pasaba
`w-12` por `className` para achicarla. **No la achicaba**: entre dos utilidades
de ancho gana la que Tailwind ordene última, no la que se escribió después. El
avatar salía a ancho completo y empujaba la fila **111px afuera del viewport en
375**, exactamente el bug de scroll horizontal que ya había costado tres
sesiones. Ahora el ancho lo pone un contenedor `w-12` con `overflow-hidden` y
la foto llena lo que le den. Está escrito en el contrato del componente.

Se encontró **midiendo**, no mirando: la captura se veía bien.
`document.documentElement.scrollWidth` contra `clientWidth`, y después un
recorrido del DOM buscando elementos que se pasan del borde **y cuyos padres no
los recortan** (sin ese segundo filtro salen falsos positivos: todo lo que está
adentro de un `overflow-x-auto` se pasa a propósito).

### Los widgets deportivos, en detalle

```
src/components/layout/BarraEstado.tsx      La tira de arriba de la cabecera
src/components/partido/ChipResultado.tsx   Una ficha de la franja
src/components/partido/FechaAFecha.tsx     La franja de la temporada
src/components/portada/Goleadoras.tsx      El top 5 para la portada
src/app/demo/widgets/page.tsx              Banco de pruebas, con estados vacíos
```

Son los tres widgets que el Build Order deja para el **Step 19**. Están hechos
como componentes puros —reciben todo por props, no consultan nada— y **los tres
están enchufados**: la barra en el layout raíz, la franja y las goleadoras en
`/`. Lo que los mantiene honestos no es dejarlos afuera sino de dónde sacan los
datos: leen la base y nunca `src/app/demo/`, así que sin temporada activa
reciben vacío y se borran solos. Hoy, sin Supabase, no se dibuja ninguno en la
ruta pública —ni un marcador inventado, que es la regla no negociable 1— y el
día que haya datos aparecen sin tocar una línea. Los datos de `/demo/widgets`
salen de `src/app/demo/temporada/datos-demo.ts`, el mismo archivo falso que ya
usaban las páginas deportivas.

**`<BarraEstado />` ya está cableada y va en todas las páginas.** Vive en el
layout raíz (`src/app/layout.tsx`) y se alimenta de `getEstadoDelSitio()`, en
`src/lib/supabase/queries/estado.ts`. Hoy no se dibuja en ninguna ruta porque
no hay base: la query devuelve todo en `null` y el componente no renderiza nada.
El día que haya datos aparece sola, sin tocar una línea.

> **Esa query lee con `createStaticClient()` a propósito.** `createClient()`
> pide las cookies, y **una sola lectura con cookies desde el layout raíz
> vuelve dinámicas todas las rutas del sitio**, ISR incluido. Comprobado
> después del cambio: el build sigue dando `/` estática con revalidate de 1m y
> las diez rutas estáticas intactas. Si alguien la cambia por `createClient()`,
> el sitio entero deja de prerenderizarse y no lo va a avisar ningún test.

**`<FechaAFecha />` y `<Goleadoras />` también están cableadas**, y salen de la
misma `getEstadoDelSitio()` que la barra, no de `getPartidosTemporada()` ni de
`getGoleadoras()`. Esas dos existen desde el Step 3b pero leen con
`createClient()`, o sea con cookies: usarlas desde `/` volvería dinámica la
portada, que es exactamente la trampa que la barra ya esquivaba. La query quedó
**memoizada con `cache()` de React**, así que el layout y la portada —que se
renderizan en el mismo request— comparten una sola lectura del fixture en lugar
de pedirlo dos veces por visita.

La franja va entre las crónicas y el análisis, y las goleadoras abajo del bloque
de plantel, en la columna angosta: es el orden del boceto. Comprobado después
del cableado: `/` **sigue saliendo estática** con revalidate de 1m y el build da
las mismas 27 rutas.

**`/demo/portada` no los dibuja**, aunque por un rato los tuvo. La decisión es
del usuario, mirando la página: la demo de la portada es la de las notas —la
tapa, las crónicas, el análisis, el archivo— y los dos widgets la cargaban de
cosas que ya se miran en `/demo/widgets`.

Lo que le falta al Step 19 ya no es cableado: es el nodo de TipTap para embeber
la planilla a mano, que depende del editor (Step 7), y confirmar el OG de
`/partido/[slug]` con el resultado.

**Decisiones que tomó este step:**

- **La barra va estática arriba de todo, no `fixed`.** El blueprint la pide
  "fija arriba, siempre visible" y los dos bocetos la dibujan como la primera
  franja del documento. Pegada al viewport se come 40px de alto en 375px, que
  es donde el titular de tapa ya entra justo.
- **Adentro de la barra los colores no dependen del tema.** `negro-cancha` es
  oscuro en los dos, así que manda el fondo: el marcador amarillo lleva texto
  `negro-cancha` y no `tinta`, que en oscuro es casi blanco y sobre amarillo no
  llega a AA. Medido: 8.02:1 en claro, 9.62:1 en oscuro.
- **"Próximo" es el primer partido sin jugar, no el primero posterior a hoy**
  (`estadoTemporada()`). Es la misma división que usa el fixture
  (`dividirFixture`), así que la barra y `/temporada/[slug]` no se pueden
  contradecir; y un partido con la fecha pasada y sin resultado cargado queda a
  la vista, que es justo la señal de que falta cargarlo.
- **La franja no muestra la temporada entera** (`ventanaFechaAFecha()`): los
  últimos 5 jugados y los 2 que vienen. Con catorce fechas, una tira que arranca
  en la 1 deja el próximo partido fuera de la pantalla, y sin JavaScript no hay
  forma de abrirla ya scrolleada. El fixture completo está a un link.
- **El corte en 5 de las goleadoras lo hace el bloque, no quien lo llama**, y
  las filas son las mismas de `/temporada/[slug]`: `<ListaGoleadoras />` con
  menos filas, no un segundo diseño.

**El bug de scroll horizontal, tercera variante.** Los `sr-only` son
`position:absolute`, y sin un ancestro posicionado se ubican contra el
documento: adentro de un contenedor que scrollea horizontal **se escapan del
recorte y estiran la página entera** —375px de viewport contra 939px de
documento, medido—. La franja y la barra son los dos primeros scrollers del
sitio que llevan `sr-only` adentro, por eso no había pasado antes. Se arregla
con `relative` en el link que contiene cada uno. **Es invisible en una captura**:
el ancho de más queda vacío. Se encontró con el mismo método de la sección de
arriba (`documentElement.scrollWidth` contra `clientWidth`).

**Un hallazgo que no se tocó:** el `:focus-visible` global pinta el contorno de
`verde-600`, que sobre las superficies oscuras da **1.98:1** contra
`negro-cancha` —prácticamente invisible, y WCAG 2.2 pide 3:1 para el indicador
de foco—. No es de este step: le pasa igual a los links de la cabecera, el pie y
la tapa desde que existen. El arreglo son tres líneas en `globals.css`
(`.bg-verde-900 :focus-visible`, `.bg-negro-cancha :focus-visible` y
`.franja :focus-visible` con `outline-color: var(--color-amarillo)`, que da
8:1), pero cambia el foco en todo el sitio y **no se hizo sin preguntar**.

### La línea de fecha de la cabecera

`Mar del Plata · 12°` arriba y la fecha del día abajo. No está en el Build
Order: lo pidió el usuario. La temperatura sale de **Open-Meteo**
(`src/lib/clima.ts`), que no pide API key ni atribución, cacheada 30 minutos
con `next: { revalidate: 1800 }`.

- **La ciudad es fija.** Es la línea de fecha del diario —de dónde se escribe—,
  como en un diario impreso, no dónde está el lector. Geolocalizar al visitante
  pide permiso al entrar o mirar la IP en cada request, y las dos vuelven
  dinámica una portada que hoy es estática con ISR. Comprobado después: `/`
  sigue saliendo `○ (Static)` con revalidate de 1m.
- **La cabecera no consulta: recibe.** `<Header temperatura={...} />` es un prop
  opcional y **sólo la portada se lo pasa**. Si el fetch viviera adentro del
  componente, las diez rutas estáticas del sitio pasarían a revalidarse por una
  temperatura. En `/demo/portada` va un 14 fijo para poder ver el diseño sin red.
- **Si la API falla, no hay dato y no pasa nada más.** `getTemperatura()` nunca
  tira: la cabecera está en todas las páginas y una API de clima caída no puede
  tumbar ninguna. La forma de la respuesta se valida con Zod.
- Los grados van en amarillo sobre `verde-900` (7.56:1, ya medido) y el punto
  separador en `white/25`, el mismo de `<BarraEstado />`.

### La migración corrida de verdad, y lo que mostró

Se corrió `pnpm tsx scripts/migrate-wp.ts --sin-imagenes` **en seco** contra
`periodicodelfos.com`. No escribe nada: deja todo en `.migracion-wp/`, que está
en el `.gitignore`. Resultado:

```
70 notas · 8 categorías · 233 medios · 1 autor
27 listas para escribir · 43 sin bajada · 70 con alt pendiente
109 imágenes · 0 categorías sin mapear · 82 reglas de redirección
```

**El sitio tiene 70 notas, no once.** Todo este archivo venía asumiendo "~11
notas publicadas" —sale del blueprint— y es falso: hay tres temporadas
completas, 2023, 2024 y 2026, con crónica de cada fecha.

Lo que la migración **hace bien**, comprobado con contenido real: limpia el
sufijo del título (`Defensa y Justicia 2-1 Tiburonas`, sin
`: Fecha N°12 – Aldosivi Femenino en la Primera B 2026`), saca la bajada del
extracto cuando sirve, y detecta temporada y número de fecha. En
`/demo/portada` se ve lo que eso arregla: los títulos entran enteros, sin el
"…" que los cortaba en la home vieja.

**Lo que el sitio viejo no tiene, y bloquea la carga de verdad:**

- **Ninguna imagen tiene texto alternativo.** Las 70 notas quedan sin portada:
  la regla no negociable 4 lo exige y `alt.json` las junta para completarlas a
  mano. Son 109 imágenes.
- **43 de 70 notas no tienen bajada usable** y esperan en `bajadas.json`.
- **La mitad de los goles no tienen minuto.** Las incidencias de las fechas 3,
  4, 6, 7, 10 y 12 dicen quién convirtió pero no cuándo, y `eventos.minuto` es
  obligatorio. Se ve en `/demo/jugadora`: Larea hizo 8 goles y la ficha lista 4.
- **No hay dorsales fijos.** El número cambia partido a partido; el propio
  artículo del plantel lo dice. Van en `formaciones`, no en `plantel`.
- **Los nombres no están unificados**: Veñardez/Velardez, Surban/Surbán,
  Mozquera/Mosquera, Audicana/Audicana. Lo tiene que resolver una persona.

**Y confirma para qué existe el proyecto:** el transformador marcó la crónica de
la fecha 12 con `datos-deportivos-en-el-cuerpo`, y tiene razón — el cuerpo es
`FICHA DEL PARTIDO`, `¿Cómo formó Aldosivi?` (los once con dorsal), `Suplentes`
e `Incidencias`. Es la regla no negociable 2 escrita a mano, nota por nota, 70
veces. El plantel es peor: era una tabla en WordPress y llega aplanada en un
párrafo ilegible.

### Los datos de las demos ya no son inventados

`src/app/demo/temporada/datos-demo.ts` y `src/app/demo/portada/datos-demo.ts`
se rehicieron con **la Primera B 2026 de verdad**, leída de las doce crónicas:
el plantel de 32 jugadoras, el fixture con sus canchas y horarios, los
resultados, las goleadoras (23 goles, Larea 8) y la campaña de Larea. Con eso,
`/demo/portada`, `/demo/temporada`, `/demo/plantel`, `/demo/jugadora` y
`/demo/widgets` muestran el torneo real.

**Lo único inventado que queda es `tablaDemo`**, y está marcado en el archivo y
en las dos páginas que la usan: la tabla de posiciones se carga a mano desde AFA
y el sitio viejo nunca la publicó. La fila de Aldosivi lleva su campaña real
—12 jugados, 4-1-7, 23:35, 13 puntos, contados del fixture—; la posición y las
otras nueve filas no. Tiene diez equipos y no doce: son los que las crónicas
confirman en la zona, y agregar dos más sería inventar clubes.

`src/app/demo/planilla/datos-demo.ts` **no se tocó**: ese sigue siendo el banco
de pruebas del renderer y existe para ejercitar los nueve tipos de evento
—cambio, lesión, penal errado, doble amarilla—, que el sitio viejo no registra.

### Decisiones que el usuario todavía no tomó

- **Lo que bloquea `/contacto` y `/privacidad`** (lo único que le falta al Step
  10). Hacen falta cuatro cosas y ninguna se puede deducir del repo: el **mail
  de contacto** del medio, los **handles de las redes**, el **responsable de
  datos** para la política de privacidad, y si el sitio **va a usar analítica**
  —de eso depende si la política tiene que hablar de cookies o no. Una política
  de privacidad inventada es un documento legal falso, así que no se escribe a
  ojo.
  **Esto ya no es sólo una página que falta: el pie linkea a las dos desde
  *todas* las páginas del sitio, y los dos links dan 404.** Comprobado en el
  navegador. Son dos caminos: pasás los datos y se escriben, o se sacan los dos
  links del pie hasta que existan. Lo segundo lo puede hacer el agente en un
  minuto; lo primero no lo puede hacer nadie más que vos.
- **La biografía del autor y desde cuándo existe el medio.**
  `/quienes-somos` está escrita sólo con lo que ya estaba documentado en el
  repo: el medio, la ciudad, el equipo y que lo escribe una sola persona. Falta
  lo que sólo puede escribir Charlie: desde cuándo, por qué lo empezó y su
  biografía.

- **JetBrains Mono vs IBM Plex Mono.** Los bocetos usan JetBrains; el blueprint
  especifica IBM Plex Mono y ya está cargada con `next/font`. No cambiar sin
  preguntar.
- **El newsletter no está en el Build Order** y aparece en los dos bocetos (en
  la portada como sección, en la crónica como widget del aside). Es un backend
  —lista, doble opt-in, proveedor de envío—, no un `<form>`. Decidir si entra
  como step nuevo o si va como maqueta inerte.
- **El ticker de resultados, el widget de próximo partido y la tabla de
  posiciones son Step 19**, no Step 9. Los tres componentes ya están escritos y
  **ya están enchufados** (`BarraEstado` en el layout raíz, `FechaAFecha` y
  `Goleadoras` en `/`), y se dibujan solos el día que la base tenga la temporada
  2026 cargada. Hasta entonces reciben vacío y no se muestran. Lo que sigue en
  pie es la regla: **no inventar datos deportivos para llenarlos** (regla no
  negociable 1); los números viven en `/demo/` y en ningún otro lado.
- **El contorno de foco sobre las superficies oscuras da 1.98:1** y no se ve.
  El arreglo son tres líneas en `globals.css` y cambia el foco en todo el sitio;
  está detallado en "Los widgets deportivos, en detalle".
- La `.planilla` de los bocetos **no es** `<PlanillaPartido />`: es más parecida
  a `<PlanillaCompacta />`, que ya existe, más una ficha técnica. Y `.planilla`
  ya es una clase con reglas propias en `globals.css`. Cuidado con el choque de
  nombres.
- **Los handles de las redes del medio.** Bloquean la cuarta columna del pie, y
  el auto-posteo los va a necesitar igual. No hay ninguno escrito en el
  proyecto ni en los datos de WordPress. Decilos y entra la columna.
- **Las URLs cortas de la nav.** `/plantel` y `/fixture` son puertas: redirigen
  a `/plantel/<temporada>` y `/temporada/<temporada>` cuando haya una temporada
  activa, y mientras tanto explican qué falta. Las páginas largas **ya
  existen**. Si preferís que la nav apunte directo a las URLs largas, hay que
  cambiarlo **antes de que el sitio esté indexado**.
- **Cuántas goleadoras se listan.** La página de temporada muestra 25 y la
  portada 5. Veinticinco es un número puesto por el agente, no por vos: si el
  torneo tiene planteles de 30 y querés la lista entera, se sube.

---

## Arrancar el backend

**Es el próximo paso del proyecto y lo único que desbloquea todo lo demás.**
Hoy el sitio es una cáscara terminada esperando datos: `/` está vacía, la barra
de estado no se dibuja en ninguna página, y los Steps 5, 6 y 7 —auth, migración
y editor— están todos frenados por esto. La migración ya se probó en seco
contra el sitio real y salió limpia: 70 notas, 0 categorías sin mapear, 82
reglas de redirección.

### Parte 1 — en la consola de Supabase (esto no lo puede hacer el agente)

1. Crear el proyecto en `supabase.com`. **Región São Paulo (`sa-east-1`)**: es
   la más cercana a Mar del Plata y el sitio se lee desde acá.
2. **Settings → API**, copiar tres valores: *Project URL*, *anon public key* y
   *service_role key*.
3. `cp .env.example .env.local` y completar **sólo** estas tres:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y
   `SUPABASE_SERVICE_ROLE_KEY`. Las de Inngest, Meta y X pueden quedar vacías:
   recién hacen falta para el auto-posteo. **`.env.local` no se commitea nunca**
   (regla no negociable 10), y la `service_role` bypassea RLS: jamás en un
   componente cliente ni en una variable `NEXT_PUBLIC_*`.
4. **Authentication → Users → Add user**, con el mail de Charlie. **Anotar el
   UUID que queda**: hace falta en el paso 6 y no se puede inventar.

### Parte 2 — el schema y la carga

5. Aplicar las nueve migraciones: `pnpm dlx supabase db push`.
6. **Sembrar los catálogos a mano.** Ninguna migración trae datos, y sin esto la
   carga falla:
   - La fila de `autores`. **Su `id` es FK a `auth.users(id)`**, así que va con
     el UUID del paso 4, no con uno nuevo. `slug` tiene que ser
     `charlie-redondo` o hay que pasarle `--autor <slug>` al script.
   - La temporada activa, `primera-b-2026`. **Hay un índice único que permite
     una sola activa**: marcar las viejas con `activa = false`.
   - Los equipos, con Aldosivi en `es_aldosivi = true`. **También hay un índice
     único ahí**: un solo Aldosivi, o las vistas de goleadoras rompen los
     conteos. Los diez de la Zona B están en
     `src/app/demo/temporada/datos-demo.ts` con sus nombres y ciudades reales.
7. Correr la migración **en seco** y leer el informe:
   `pnpm tsx scripts/migrate-wp.ts` → `.migracion-wp/informe.md`.
8. **Completar a mano `alt.json` y `bajadas.json`**, que el paso anterior deja
   listos. Son 109 textos alternativos y 43 bajadas. No es opcional: sin `alt`
   ninguna nota migra con portada (regla no negociable 4) y las 43 sin bajada
   se quedan esperando. Se puede hacer de a poco: el script es idempotente por
   slug y correrlo de nuevo no duplica nada.
9. Escribir de verdad: `pnpm tsx scripts/migrate-wp.ts --escribir`. Sube las
   imágenes al bucket `media` —lo crea público si no existe, que Instagram lo
   exige— y hace upsert de las notas.
10. Regenerar los tipos y dejar de mantenerlos a mano:
    `pnpm dlx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts`
11. Las redirecciones: `pnpm tsx scripts/generate-redirects.ts` y confirmar que
    `vercel.json` queda con las 82 reglas. **Ninguna URL vieja puede dar 404**
    (regla no negociable 8).

### Qué aparece solo cuando esto esté

Nada de lo que sigue necesita código nuevo:

- `/` deja de estar vacía y se llena con las notas reales.
- **`<BarraEstado />` aparece en todas las páginas del sitio**: ya está cableada
  en el layout raíz y hoy devuelve `null` sólo porque no hay base.
- `/nota/[slug]`, `/partido/[slug]`, `/temporada/[slug]`, `/plantel` y
  `/jugadora/[slug]` empiezan a prerenderizarse desde `generateStaticParams`.
- El sitemap y el RSS dejan de salir vacíos.

Lo que **sí** necesita código después: el Step 5 (auth + shell del admin), el 6
(la planilla de carga) y el 7 (el editor de notas), que es donde Charlie carga
los goles y deja de escribirlos a mano adentro del texto.

---

## La rama de rescate `wip/portada-15-sep`

**Hay una segunda implementación de los tres widgets y no se tiró.** El 15/09
quedó en el working tree de `main`, sin commitear, otra versión de
`BarraEstado`, `ChipResultado`, `FechaAFecha` —en `components/portada/`, no en
`components/partido/`— y `Goleadoras`, más un `lib/portada.ts` con 15 tests. No
es el borrador del que salió esta rama: son dos implementaciones escritas por
separado, el primer commit de acá escribió `BarraEstado` de cero. Está parqueada
en la rama **local** `wip/portada-15-sep` (65cc375).

**No se mergea.** Lo que valía ya se portó: la tipografía de los títulos del
cuerpo en `globals.css` —el `h3` medía menos que el cuerpo en desktop— y la
regla del `.sr-only` adentro de un contenedor con `overflow-x-auto`, que ahora
es la regla 5 de `CLAUDE.md`. Las dos sesiones encontraron ese bug por separado:
esta rama lo arregló en el código y la otra lo escribió en las reglas.

**`lib/portada.ts` se descartó a propósito.** Esta rama cubre lo mismo en
`temporada.ts` —`estadoTemporada()`, `ventanaFechaAFecha()` y `filaDeAldosivi()`,
con tests— y resuelve mejor los dos detalles de accesibilidad que justificaban
ese archivo: el `sr-only` de la posición dice "Aldosivi va 3 con 24 puntos" en
lugar de dejar que se lea "24 pe te ese", y el resultado del chip no depende
sólo del color porque el marcador ya va con Aldosivi primero, así que la letra
G/E/P que tenía `LETRA_RESULTADO` no hace falta.

La única diferencia que la rama vieja resolvía y ésta no: su ventana de la
cinta se rellenaba para los dos lados, así que una temporada terminada mostraba
ocho resultados en vez de cinco. Acá son cinco jugados y dos por venir fijos. Si
alguna vez la cinta queda corta a fin de temporada, ahí está escrito cómo.

**La rama es local**: si el repo se clona en otra máquina, no aparece. Para que
sobreviva hay que pushearla.

---

## La ventana de la planilla, en detalle

**Apretar un chip de la franja abre la planilla de ese partido como ventana,
sin salir de la página.** Lo pidió el usuario mirando `/demo/widgets`: "si
aprieto la de la fecha 11, se abre la planilla tipo ventana".

Está hecho con **rutas interceptadas**, no con un modal de cliente, y la
diferencia es toda la que importa:

```
src/app/@modal/(.)partido/[slug]/page.tsx   la ventana
src/app/@modal/default.tsx                   null, que es casi siempre
src/app/layout.tsx                           recibe {children, modal}
src/components/layout/Ventana.tsx            el <dialog>, unico "use client" nuevo
```

El chip **sigue siendo un `<Link>` a `/partido/[slug]`**. Lo único que hace la
carpeta `@modal` es que, cuando ese link se aprieta desde adentro del sitio, en
vez de navegar se abra una ventana. De ahí salen cuatro propiedades que un
modal de cliente no tiene:

- **Sin JavaScript el chip navega** a la página entera, como cualquier link.
- **Recargar con la ventana abierta** muestra la página del partido: la URL ya
  es la de él, así que no hay dos URLs para la misma cosa.
- **Compartir el link** desde la ventana manda a la página, que es la que tiene
  la metadata y el JSON-LD `SportsEvent`.
- **El botón de atrás** cierra la ventana. Por eso `<Ventana />` cierra con
  `router.back()` y no escondiéndose: si se escondiera sola, la URL quedaría
  mintiendo.

> **`@modal/default.tsx` no es opcional.** Un slot paralelo sin `default.tsx`
> no tiene qué renderizar en una navegación dura y Next devuelve 404 en rutas
> que existen. Que devuelva `null` es el punto.

**`<Ventana />` es `<dialog>` nativo con `showModal()`**, y esa es toda la
razón por la que es corto: la trampa de foco, la tecla Escape, el foco que
vuelve al chip que la abrió y el `inert` de lo que queda atrás los hace el
navegador. Escritos a mano son doscientas líneas y tres bugs. Se abre en un
efecto y **no** con el atributo `open`, que lo dibuja pero no como modal —sin
trampa de foco y sin `::backdrop`—: es el error clásico con este elemento.

**El banco de pruebas es `/demo/fixture`**, y existe por una razón concreta:
sin base, los chips de `/` no se dibujan y `/partido/<slug>` da 404, así que la
ventana de verdad no se puede abrir **ni una vez**. Esa carpeta repite el mismo
mecanismo con slugs del fixture demo —su propio `layout.tsx` con slot, su
`[slug]` y su `(.)[slug]`— y usa los mismos componentes. **Se borra el día que
haya temporada cargada**: para entonces esto mismo se prueba en `/`.

> En esa demo, **la línea de tiempo de adentro de la ventana es prestada**: es
> siempre la misma planilla demo. El marcador, la fecha y los equipos son
> reales; las incidencias por fecha no existen todavía y no se inventan (regla
> no negociable 1). Está dicho en la página.

**Verificado en navegador**, a 375 y 1280: el chip es un link, la ventana abre,
la URL cambia, es modal y tiene nombre accesible, adentro está la planilla
entera con su línea de tiempo, no hay scroll horizontal con la ventana abierta,
Escape la cierra, el foco vuelve al chip, entrar directo a la URL da la página
y no la ventana, y con el JavaScript apagado el chip navega. Y `next build`
verde con `/` **todavía estática**: el slot paralelo no tocó el prerenderizado.

**Lo que falta cuando haya base:** mirar la ventana de verdad en `/`, que es la
que lee Supabase. Lo probado hoy es el mecanismo, no la query.

---

## Prompt para la próxima sesión

> Este bloque se reescribe cada vez que cambia la próxima tarea. **Está al día
> al 18/09/2026**, después de cerrar el cableado del Step 19 y repartir tres
> ramas entre los tres que trabajamos en el proyecto. Si estás leyendo esto
> como compañero de equipo, tu encargo **no** es éste: está en
> `docs/encargos/README.md`.

````
Estoy construyendo Periódico Delfos, un medio digital de Mar del Plata dedicado al
fútbol femenino de Aldosivi (las "Tiburonas"). Lo escribe una sola persona, Charlie
Redondo. Es una migración desde WordPress.

El proyecto está en `periodico-delfos/`. Next 15 App Router + TypeScript strict +
Tailwind v4 + Supabase + TipTap + Inngest.

El plan está en `periodico-delfos-blueprint-v2.md` —el Build Order es la sección 10— y
el estado real en `HANDOFF.md`. **Leé `HANDOFF.md` antes que nada**, empezando por la
sección de arriba de todo: más abajo en ese mismo archivo hay partes viejas. `CLAUDE.md`
tiene las reglas no negociables y el sistema de diseño, y está al día.

ENTORNO:
- Sigue sin haber proyecto de Supabase ni `.env.local`. Ninguna tarea puede depender de
  leer o escribir en la base.
- `pnpm lint` falla de fábrica: `eslint.config.mjs` quedó de un scaffolding de Next 16.
  No afecta al build. No lo arregles sin leer "Pendiente manual" en el HANDOFF.
- Parar el server antes de buildear, y matar el proceso, no la terminal:
  `Get-NetTCPConnection -LocalPort 3100` → `Stop-Process -Force`. No arranques el server
  con `| head`: cuando head cierra el pipe queda colgado. Redirigilo a un archivo.
- Hoy pasan `npx tsc --noEmit` y 347 tests, y `next build` sale verde con `/` estática.
  Mantenelos verdes.

EQUIPO: somos tres trabajando en paralelo. Hay tres ramas abiertas que NO hay que tocar:
`fase/13-planilla-de-carga` (todo `src/app/admin/` y `src/components/admin/`),
`fase/20-e2e` (todo `e2e/` y `playwright.config.ts`) y `fix/accesibilidad-y-pie`
(`/quienes-somos`, `Footer.tsx` y el contorno de foco en `globals.css`). El reparto está
en `docs/encargos/README.md`. Y hay archivos reservados para la tarea 2:
`src/lib/supabase/types.ts`, `vercel.json`, `supabase/migrations/` y los scripts de
migración.

TAREA 1 — cerrar el Step 19. Rama nueva `fase/19-planilla-embebida`.

Del Step 19 ya están hechos los tres widgets deportivos, el buscador y la ventana que
abre la planilla desde la franja de fecha a fecha. Quedan dos cosas:

1a. EL NODO DE TIPTAP QUE EMBEBE UNA PLANILLA EN EL CUERPO DE UNA NOTA.
    El esquema ya lo contempla: `idsDePlanillas()`, en `src/lib/tiptap/esquema.ts`,
    junta los `partidoId` de los nodos `{ type: 'planilla', attrs: { partidoId } }`, con
    5 tests que cubren los anidados y los que no traen id usable.
    **Lo que falta es el renderer**: `src/lib/tiptap/render.tsx` no dibuja ese nodo. Hay
    que hacer que lo renderice con `<PlanillaPartido variante="embebida" />`, que ya
    existe y está testeada. Antes de decidir la forma de la API, mirá cómo `/nota/[slug]`
    usa hoy `idsDePlanillas()` y cómo le llegan los partidos al renderer.
    El botón para insertarlo desde el editor es Step 7 y está bloqueado, porque el editor
    no existe todavía. **Esta tarea es sólo renderer + tests + una demo**, siguiendo el
    patrón del proyecto: lógica pura en `src/lib/` con tests de vitest, componentes puros
    que reciben todo por props, y los datos falsos encerrados en `src/app/demo/`.

1b. CONFIRMAR EL OG DE `/partido/[slug]`.
    `urlOg({ titulo: titulo(partido) })` ya manda el marcador adentro del título, así que
    puede estar hecho desde el Step 15. **Mirá la imagen de verdad** en
    `/api/og?titulo=Aldosivi%202-1%20Moron&volanta=Fecha%2012` antes de darlo por cerrado
    o por pendiente, y decidí si el marcador adentro del título alcanza o si un partido
    merece su propia composición. `/api/og/route.tsx` sólo entiende `titulo` y `volanta`.

TAREA 2 — Supabase, cuando yo te avise que hice mi parte.

Los once pasos están en `HANDOFF.md`, sección "Arrancar el backend". Los primeros cuatro
son míos: crear el proyecto, poner las tres claves en `.env.local` y crear el usuario de
Charlie en Auth. De ahí seguís vos: migraciones, catálogos, migración en seco, regenerar
los tipos y las 82 redirecciones.

Hay una trampa anotada para ese día: `/nota/[slug]`, `/partido/[slug]`,
`/plantel/[temporadaSlug]` y `/jugadora/[slug]` declaran `generateStaticParams` pero sus
queries piden cookies. Con el proyecto arriba, el build puede cortar con "Dynamic server
usage". El arreglo ya existe —`createStaticClient()`, el mismo que usa la barra de
estado— pero hay que probarlo, no darlo por sentado.

CÓMO VERIFICAR, siempre:
    npx tsc --noEmit
    npx vitest run
    npx next build
Y medir el scroll horizontal en cada pantalla que toques, a 375px:
`document.documentElement.scrollWidth` contra `clientWidth` **y**
`document.body.scrollWidth`. Los dos, no uno.

Actualizá `HANDOFF.md` al terminar, escribiendo en una sección nueva al final: ese
archivo lo tocan las tres ramas y no hay que editar las secciones de otro.
````


---

## Prompt anterior, ya cumplido

````
Estoy construyendo Periódico Delfos, un medio digital de Mar del Plata dedicado
al fútbol femenino de Aldosivi (las "Tiburonas"). Lo escribe una sola persona.
Es una migración desde WordPress.

El plan está en `periodico-delfos-blueprint-v2.md` y el estado real en
`HANDOFF.md`. **Leé la sección "Estado al cierre de las rutas públicas" antes
que nada**: el tema se invirtió dos veces en un día y hay partes viejas más
abajo en ese mismo archivo. El blueprint y `CLAUDE.md` sí están al día.

Proyecto en `periodico-delfos/`. Next 15.5 App Router + TypeScript strict +
Tailwind v4 + Supabase + TipTap + Inngest. Hoy pasan `tsc --noEmit` y 286 tests,
y `pnpm build` da 20 rutas. Mantenelos verdes. **Parar el dev server antes de
buildear**: `next build` reescribe `.next/` y rompe el `next dev` que esté
corriendo. Y no lo arranques con `| head`: cuando head cierra el pipe el server
queda colgado escuchando el puerto pero sin responder; redirigilo a un archivo.

Sigue sin haber proyecto de Supabase ni `.env.local`, así que la tarea no puede
depender de leer o escribir en la base.

CONTEXTO: ya están la portada, los listados, el SEO técnico, el buscador y
`/partido/[slug]`. El patrón de trabajo está establecido y conviene copiarlo:
Server Components puros que reciben todo por props, la página lee y no dibuja,
los datos inventados encerrados en `src/app/demo/`, y toda la lógica que se
pueda sacar a `src/lib/` con tests.

TAREA: lo que falta del Step 14, las páginas deportivas públicas. En orden:

1. **`/temporada/[slug]`** — fixture + tabla de posiciones + goleadoras. El
   blueprint (7.5) lo describe como tres pestañas. Las queries ya existen:
   `getPartidosTemporada`, `getTablaPosiciones`, `getPosicionAldosivi` y
   `getGoleadoras` en `src/lib/supabase/queries/temporadas.ts` y
   `partidos.ts`. Hacen falta componentes nuevos para la tabla y las
   goleadoras; `<PlanillaCompacta />` ya sirve para el fixture.
2. **`/plantel/[temporadaSlug]`** — el plantel agrupado por puesto.
   `getPlantel(temporadaId)` ya existe.
3. **`/jugadora/[slug]`** — ficha con estadísticas. `getJugadoraPorSlug`,
   `getEstadisticasJugadora`, `getGolesDeJugadora` y `getNotasDeJugadora` ya
   existen.

Las tres son las que completan `/plantel` y `/fixture`, que hoy redirigen ahí
cuando hay temporada activa y muestran un estado vacío cuando no.

**Sin inventar datos deportivos** en las páginas reales (regla no negociable 1).
Los números van en `/demo/`, nunca en la ruta pública.

**Medí el scroll horizontal en cada página nueva.** En esta sesión apareció un
bug que estuvo tres sesiones sin verse: el documento medía 1117 px en un
viewport de 375 y no se notaba en las capturas. Se detecta comparando
`document.documentElement.scrollWidth` con `document.documentElement.clientWidth`
—y mirando también `document.body.scrollWidth`, porque si el body mide bien y el
documento no, hay un `position: absolute` escapándose de un contenedor con
scroll. Está contado en "El bug de scroll horizontal" de HANDOFF.md.

Verificá en navegador antes de cerrar: hay chromium instalado y
`@playwright/test` en el proyecto. Capturas a 1280 y 375 px en tema claro y
oscuro. Si esperás hidratación, esperá a que el `<time>` del header tenga texto.

Al terminar, actualizá `HANDOFF.md` y dejá un prompt para el siguiente step.

Ojo con las decisiones que el usuario NO tomó: la fuente mono, el newsletter,
los handles de las redes, y los datos que bloquean `/contacto` y `/privacidad`
—que es lo único que le falta al Step 10—. Están en "Decisiones que el usuario
todavía no tomó".
````

---

---

## Orden sugerido de los próximos steps

Sin credenciales de Supabase se puede avanzar en:

1. ~~`<PlanillaPartido />`~~ ✅
2. ~~`src/lib/tiptap/render.tsx`~~ ✅
3. ~~`scripts/migrate-wp.ts`~~ ✅ (falta correrlo con `--escribir`)
4. ~~`src/lib/social/compose.ts`~~ ✅
5. ~~`scripts/generate-redirects.ts`~~ ✅ (**confirmado: salen las 82 reglas**,
   corriendo la migración en seco contra el sitio real)

6. ~~`/nota/[slug]` + `<ArticuloNota />`~~ ✅ (mirala en `/demo/articulo`)

7. ~~La portada `/` (Step 9)~~ ✅ (mirala con datos en `/demo/portada`)

8. ~~Los listados `/cronicas` y `/analisis` (cierran el Step 9)~~ ✅ (mirá el
   paginador en `/demo/listado`)
9. ~~El Step 10 técnico: robots, sitemap, RSS, imagen OG, canonicals~~ ✅
10. ~~`/buscar`, y `/plantel` y `/fixture`~~ ✅ (tapaban tres 404 del menú)
11. ~~`/partido/[slug]`~~ ✅ (mirala en `/demo/partido`)
12. ~~`/temporada/[slug]`, `/plantel/[temporadaSlug]` y `/jugadora/[slug]`~~ ✅
    (cierran el Step 14; miralas en `/demo/temporada`, `/demo/plantel` y
    `/demo/jugadora`)

**Con eso están cerrados los Steps 9 y 14, y casi todo el 10.** Todas las rutas
públicas del blueprint existen menos `/contacto` y `/privacidad`.

13. ~~**Los tres widgets deportivos de la portada** —`<BarraEstado />`,
    `<FechaAFecha />` y `<Goleadoras />`—, como componentes puros con demo, sin
    que `/` les pase datos~~ ✅ (miralos en `/demo/widgets`)

Sin credenciales queda:

14. **Mirar `/demo/nota` y `/demo/planilla` a 375px en los dos temas**, que es
    lo único del sitio que nunca se miró en un navegador. Es la próxima tarea.
15. **Las dos decisiones que están frenando cosas concretas**: los links a
    `/contacto` y `/privacidad` que dan 404 desde el pie, y el contorno de foco
    de 1.98:1 sobre las superficies oscuras.

Ojo que lo único que le falta al Step 10 son `/contacto` y `/privacidad`, y
están bloqueadas por datos que sólo tiene el autor: el mail del medio, los
handles de las redes, el responsable de datos y si el sitio va a usar analítica.
**Hoy el pie linkea a las dos desde todas las páginas y los dos links dan 404**:
o se escriben, o se sacan los links del pie hasta que existan.

Con credenciales se desbloquean, en orden: Step 5 (auth + shell del admin),
Step 6 (correr la migración con `--escribir`), Step 7 (editor de notas) y el
resto del Build Order.

---

## Arrancar el backend: lo que quedó hecho y lo que falta

> Rama `fase/backend-supabase`, salida de `main`. Sección escrita el 20/09/2026.
> **No edita nada de arriba.** Es el avance sobre "Arrancar el backend": los
> pasos 1 a 6 y el 10 están hechos; faltan el 7, el 8 y el 11.

**El proyecto de Supabase existe y el schema está aplicado.** El sitio dejó de
ser una cáscara sin base: hoy hay once tablas vacías esperando datos.

```
Proyecto   Periodico-Delfos
ref        kftenasaixqugovknopm
región     sa-east-1 (São Paulo) — la que pedía el plan
Postgres   17
estado     ACTIVE_HEALTHY, linkeado
```

### Hecho

| Paso | Qué | Cómo se verificó |
|---|---|---|
| 1-2 | Proyecto creado, claves copiadas | `supabase projects list` |
| 3 | `.env.local` con las tres claves | las tres cargadas |
| 4 | Usuario de Auth de Charlie | UUID `780bfef5-2987-4e4f-af2d-c6f6d5bf6a21` |
| — | `supabase login` + `link` | `linked: true` |
| 5 | **Las nueve migraciones aplicadas** | 11 tablas + 3 vistas + `es_autor()` |
| 6 | `supabase/seed.sql` escrito | **correrlo/verificarlo — ver abajo** |
| 10 | **`src/lib/supabase/types.ts` regenerado** | 846 líneas, `tsc --noEmit` limpio |

`gen types` confirmó el schema entero: `autores`, `equipos`, `eventos`,
`formaciones`, `jugadoras`, `notas`, `partidos`, `plantel`, `social_posts`,
`tabla_posiciones`, `temporadas`, más las vistas `buscar_notas`,
`estadisticas_jugadora` y `goleadoras`.

### El seed, que es lo primero a confirmar

`supabase/seed.sql` tiene los catálogos que ninguna migración trae: la fila de
`autores` —con el UUID ya puesto—, las dos temporadas y los diez equipos de la
Zona B con nombres y ciudades reales. Es idempotente (`on conflict do update`) y
va dentro de una transacción.

**`supabase db push` no lo aplica**: sólo mira `migrations/`. Va a mano, pegado
en el SQL Editor del dashboard. Al final del archivo está la query de
verificación; tiene que dar:

```
autores              1
temporada activa     primera-b-2026
equipos / aldosivi   10 / 1
```

**No quedó confirmado si se corrió.** El chequeo por REST falló por un bug del
script de verificación —`.env.local` tiene saltos de línea CRLF y al sourcearlo
en bash la clave se lleva un `\r` pegado, así que el header salía vacío y la API
respondía `No API key found`—. **No es un problema de la clave.** Si hay que
volver a chequear desde bash, limpiar el `\r`: `tr -d '\r'`.

Los dos índices únicos parciales que el seed respeta, y que rompen los conteos
si se cargan a mano:

- `temporadas_una_activa_idx` — una sola temporada con `activa = true`.
- `equipos_un_aldosivi_idx` — un solo equipo con `es_aldosivi = true`.

### Lo que falta

| Paso | Qué | Bloqueado por |
|---|---|---|
| 7 | Migración **en seco**: `pnpm tsx scripts/migrate-wp.ts` → `.migracion-wp/informe.md` | nada |
| 8 | Completar a mano `alt.json` (109 textos) y `bajadas.json` (43) | sólo el autor |
| 9 | `migrate-wp.ts --escribir`: sube imágenes al bucket y hace upsert de las 70 notas | el paso 8 |
| 11 | `pnpm tsx scripts/generate-redirects.ts` → las 82 reglas en `vercel.json` | el paso 7 |

El paso 8 es incremental: el script es idempotente por slug, así que se puede
completar de a tandas y volver a correr sin duplicar nada.

### La trampa que ahora sí se puede probar

Estaba anotada desde el Step 14 y **todavía no se probó**: `/nota/[slug]`,
`/partido/[slug]`, `/plantel/[temporadaSlug]` y `/jugadora/[slug]` declaran
`generateStaticParams` pero sus queries usan `createClient()`, que pide
`cookies()`. Hasta ahora no se notaba porque sin base `generateStaticParams`
devolvía `[]`. **Con el proyecto arriba, `next build` puede cortar con "Dynamic
server usage".** El arreglo existe —`createStaticClient()`, el cliente sin
cookies que ya usan el sitemap y las tres queries de slugs— pero hay que
probarlo, no darlo por sentado.

**Lo que todavía no se corrió con la base arriba**: `npx vitest run` y
`npx next build`. `tsc --noEmit` sí, y pasa.

### Seguridad, para cerrar

Durante el setup se pegaron credenciales en un chat. **Confirmar que la
`service_role` y la contraseña de la base que están en uso son las rotadas**, no
las originales. `.env.local` está tapado por `.gitignore` (`.env*`) y se verificó
con `git check-ignore`.

### Prompt para la próxima sesión

````
Seguimos con Periódico Delfos, en `periodico-delfos/`. Next 15 App Router +
TypeScript strict + Tailwind v4 + Supabase. Leé `HANDOFF.md` empezando por la
sección "Arrancar el backend: lo que quedó hecho y lo que falta", que es la
última del archivo: más arriba hay partes viejas. `CLAUDE.md` tiene las reglas
no negociables.

Rama: `fase/backend-supabase`. Somos tres en paralelo; no toques `src/app/admin/`
ni `src/components/admin/` (rama 13), ni `e2e/` ni `playwright.config.ts`
(rama 20), ni `/quienes-somos`, `Footer.tsx` o el contorno de foco de
`globals.css` (rama de accesibilidad). Escribí en `HANDOFF.md` sólo en una
sección nueva al final.

**Ahora SÍ hay Supabase**: proyecto `kftenasaixqugovknopm` en sa-east-1, las
nueve migraciones aplicadas, `.env.local` con las tres claves y
`src/lib/supabase/types.ts` regenerado. Las tablas existen y están vacías.

TAREA, en orden:

1. **Confirmar el seed.** Correr la query de verificación del final de
   `supabase/seed.sql` en el SQL Editor. Tiene que dar 1 autor,
   `primera-b-2026` activa y 10/1 equipos. Si no, pegar el archivo entero y
   correrlo: es idempotente.

2. **Probar la trampa de `generateStaticParams`.** Correr `npx next build` con
   la base arriba. Si corta con "Dynamic server usage", cambiar a
   `createStaticClient()` las queries de `/nota/[slug]`, `/partido/[slug]`,
   `/plantel/[temporadaSlug]` y `/jugadora/[slug]`.

3. **Paso 7**: `pnpm tsx scripts/migrate-wp.ts` (en seco) y leer
   `.migracion-wp/informe.md`. La corrida contra el sitio real ya dio limpia
   antes: 70 notas, 0 categorías sin mapear, 82 reglas de redirección.

4. **Paso 11**: `pnpm tsx scripts/generate-redirects.ts` y confirmar que
   `vercel.json` queda con las 82 reglas. Ninguna URL vieja puede dar 404.

El paso 9 (`--escribir`) está bloqueado hasta que el autor complete a mano
`alt.json` y `bajadas.json` — 109 alts y 43 bajadas.

CÓMO VERIFICAR:
    npx tsc --noEmit
    npx vitest run
    npx next build
Parar el server antes de buildear y matar el proceso, no la terminal:
`Get-NetTCPConnection -LocalPort 3100` → `Stop-Process -Force`.

OJO: `.env.local` tiene saltos de línea CRLF. Si lo sourceás desde bash, las
variables se llevan un `\r` pegado y las llamadas a la API fallan con
"No API key found". Limpiarlo con `tr -d '\r'`.

Y no pidas ni aceptes claves por chat: van sólo a `.env.local`.
````

## La verificación con la base arriba, y lo que quedó trabado

> Rama `fase/backend-supabase`. Sección escrita el 20/09/2026, después de la
> anterior. **No edita nada de arriba.** Corrió la tarea del prompt: seed,
> build, paso 7 y paso 11.

### El seed no estaba corrido

La sección anterior lo dejaba en duda —"no quedó confirmado si se corrió"— y la
duda tenía respuesta: **no se corrió**. Las once tablas siguen vacías.

```
autores              0
temporada activa     NINGUNA
equipos / aldosivi   0 / 0
```

**La verificación ya no necesita el SQL Editor.** El CLI de Supabase está en
`node_modules/.bin` y tiene `db query --linked`, que va por la Management API
con el token de `supabase login` — no pide la contraseña de la base ni la
`service_role`:

```
npx --no-install supabase db query --linked -f supabase/seed.sql   # aplicarlo
npx --no-install supabase db query --linked "select ..."           # verificarlo
```

Esa es la forma corta de correr el seed y la que hay que usar.

**Lo que falta es permiso, no forma.** Aplicarlo lo frenó el clasificador de
auto-mode de Claude Code: escribir en una base compartida entra en "Modify
Shared Resources" y leer `auth.users` en "Production Reads". Un agente lo va a
volver a chocar mientras el usuario no apruebe la corrida o agregue una regla de
permiso en `settings.json`. Hasta que el seed esté, **los pasos 8, 9 y todo lo
que dependa de datos están bloqueados por esto**, no por el código.

### El chequeo por REST: la CRLF era una pista falsa

La sección anterior culpaba a los saltos de línea CRLF de `.env.local` por el
`No API key found`. **No era eso.** `SUPABASE_SERVICE_ROLE_KEY` está **vacía**
en `.env.local`: la línea existe, el valor no. Lo mismo las de Inngest, Meta y
X. Cargadas de verdad hay tres: `NEXT_PUBLIC_SITE_URL`,
`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` —más
`WP_MIGRATION_SOURCE`, que la migración usa.

Lo de CRLF **igual es cierto** y conviene seguir limpiándolo con `tr -d` al
sourcear desde bash, pero no era la causa. Para leer sin `service_role` alcanza
la anon: RLS da `select using (true)` a `equipos`, `temporadas` y `autores`
(`0008_rls.sql`), así que un 0 leído con la anon es un 0 de verdad y no una fila
tapada por RLS. Así se confirmó que el seed faltaba, antes de ir al CLI.

Sigue pendiente lo de seguridad de la sección anterior: confirmar que la
`service_role` y la contraseña de la base en uso son las **rotadas**. Y cuando
se reponga la `service_role`, va sólo a `.env.local`.

### El build pasa, pero no probó la trampa

`npx next build` termina en verde, 37 páginas, exit 0. **No alcanza para dar la
trampa de `generateStaticParams` por resuelta.** Con las tablas vacías
`getSlugsNotas()` y las otras tres devuelven `[]`, así que no hay una sola
página que prerenderizar y el camino que falla nunca se recorre. Las cuatro
rutas aparecen como `●` (SSG) con cero paths.

El diagnóstico de fondo no cambió y conviene tenerlo escrito, porque el prompt
anterior lo contaba a medias: **`generateStaticParams` ya está bien** —las
cuatro usan `createStaticClient()` vía `getSlugs*`—. Lo que pide cookies es el
resto de la página: `generateMetadata()` y el cuerpo llaman a
`getNotaPorSlug()`, `getPartidoPorSlug()`, `getTemporadaPorSlug()` y
`getJugadoraPorSlug()`, y esas ocho de `queries/` sí usan `createClient()`.

**Con datos, el build de esas cuatro rutas es lo primero a mirar.** Si corta o
si las degrada a `ƒ`, el arreglo es que las queries que el prerender usa tomen
el cliente por parámetro o tengan variante estática; no hay que inventar nada
nuevo, `createStaticClient()` ya existe en `src/lib/supabase/server.ts`.

### ESLint no está corriendo, y hace rato

El build lo dice al pasar y es fácil leerlo como ruido:

```
⨯ ESLint: Cannot find module '...\node_modules\eslint-config-next\core-web-vitals'
  imported from eslint.config.mjs
```

**El lint del build no valida nada desde el primer commit.** `eslint.config.mjs`
está escrito en formato flat e importa `eslint-config-next/core-web-vitals` y
`/typescript` como si exportaran arrays. En la versión instalada (15.5.23) esos
dos archivos son CommonJS en formato eslintrc —`module.exports = { extends: [...] }`—
y el paquete no tiene `exports`, así que ESM ni siquiera los resuelve sin `.js`.
Agregar la extensión no alcanza: con `.js` resuelve y falla un paso después con
`nextVitals is not iterable`. **Probado; revertido.**

El arreglo de verdad es el puente `FlatCompat`, que es lo que genera
create-next-app para Next 15 + ESLint 9:

```js
import { FlatCompat } from '@eslint/eslintrc'
const compat = new FlatCompat({ baseDirectory: import.meta.dirname })
export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  { ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'] },
]
```

**No se hizo acá, a propósito**: `@eslint/eslintrc` no está declarado y con pnpm
no se resuelve por hoisting, así que hay que agregarlo a `devDependencies` y
tocar el lockfile — y somos tres ramas en paralelo. Es un step corto y propio,
mejor con el árbol quieto. Ojo con lo que aparezca cuando el lint arranque por
primera vez: setenta y pico de archivos nunca lo pasaron.

### Paso 7 y paso 11: hechos, y dan lo esperado

`pnpm tsx scripts/migrate-wp.ts` en seco, contra el volcado local de
`.migracion-wp/crudo` (no vuelve a pegarle a la API; para eso está
`--redescargar`):

| Qué | Cuánto |
|---|---|
| Notas leídas | 70 |
| Listas para escribir (con bajada) | 27 |
| Quedarían publicadas / borrador | 0 / 70 |
| Imágenes | 109, todas ya en disco |
| Categorías sin mapear | 0 |
| Redirecciones | 82 |

Igual que la corrida anterior: la migración no se movió.

`pnpm tsx scripts/generate-redirects.ts` escribió las 82 reglas y `vercel.json`
quedó **idéntico** al commiteado —`git diff` da vacío, salvo finales de línea—.
El paso 11 ya estaba hecho; ahora está confirmado y es idempotente.

De los dos archivos a mano, **no hay nada empezado**: `alt.json` tiene 109
claves y 0 completas, `bajadas.json` 43 y 0. Por eso quedarían 70 en borrador y
sólo 27 se escribirían. Las dos listas, con slug y motivo, están en
`.migracion-wp/informe.md`.

### Cómo quedó verificado

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | limpio |
| `npx vitest run` | 347 tests, 21 archivos, todos verdes |
| `npx next build` | exit 0, 37 páginas |
| `npx eslint .` | **roto** — ver arriba |

El árbol quedó limpio: esta sesión no cambió una línea de código. Lo único que
se escribió es esta sección y los artefactos de `.migracion-wp/`, que no se
commitean.

### Prompt para la próxima sesión

````
Seguimos con Periódico Delfos, en `periodico-delfos/`. Next 15 App Router +
TypeScript strict + Tailwind v4 + Supabase. Leé `HANDOFF.md` empezando por la
sección "La verificación con la base arriba, y lo que quedó trabado", que es la
última: más arriba hay partes viejas, y la anterior ("Arrancar el backend: lo
que quedó hecho y lo que falta") tiene dos cosas ya corregidas —el seed NO
estaba corrido y lo de CRLF era una pista falsa—. `CLAUDE.md` tiene las reglas
no negociables.

Rama: `fase/backend-supabase`. Somos tres en paralelo; no toques `src/app/admin/`
ni `src/components/admin/` (rama 13), ni `e2e/` ni `playwright.config.ts`
(rama 20), ni `/quienes-somos`, `Footer.tsx` o el contorno de foco de
`globals.css` (rama de accesibilidad). Escribí en `HANDOFF.md` sólo en una
sección nueva al final.

TAREA, en orden:

1. **Correr el seed.** Con el CLI, sin SQL Editor:
   `npx --no-install supabase db query --linked -f supabase/seed.sql`
   y verificar con la query del final de ese archivo: tiene que dar 1 autor,
   `primera-b-2026` activa y 10/1 equipos. Es idempotente.
   OJO: esto escribe en una base compartida y el clasificador de auto-mode lo
   frena. Si te lo frena, pedíselo al usuario en vez de buscarle la vuelta.
   Si el primer insert falla por FK contra `auth.users`, el usuario de Auth de
   Charlie no existe o cambió de UUID: eso lo arregla el usuario en la consola,
   y después se actualiza el UUID arriba de `seed.sql`.

2. **Ahora sí, la trampa.** `npx next build` con datos. Mirar si las cuatro
   rutas con `generateStaticParams` prerenderizan de verdad o si cortan con
   "Dynamic server usage". El problema no está en `generateStaticParams` —ya usa
   `createStaticClient()`— sino en `generateMetadata()` y el cuerpo, que llaman
   a `getNotaPorSlug`, `getPartidoPorSlug`, `getTemporadaPorSlug` y
   `getJugadoraPorSlug`, y esas usan `createClient()` con cookies.

3. **Arreglar ESLint**, que no valida nada desde el primer commit. Agregar
   `@eslint/eslintrc` a devDependencies y reescribir `eslint.config.mjs` con
   `FlatCompat` (la receta está en la sección). Después `npx eslint .` y
   arreglar lo que aparezca, que va a ser bastante: es la primera vez que corre.

El paso 9 (`migrate-wp.ts --escribir`) sigue bloqueado hasta que el autor
complete `alt.json` (109) y `bajadas.json` (43) — hoy están los dos en cero. Es
incremental: el script es idempotente por slug y se puede correr por tandas.

CÓMO VERIFICAR:
    npx tsc --noEmit
    npx vitest run
    npx next build
Parar el server antes de buildear y matar el proceso, no la terminal:
`Get-NetTCPConnection -LocalPort 3100` → `Stop-Process -Force`.

`SUPABASE_SERVICE_ROLE_KEY` está VACÍA en `.env.local`, igual que las de
Inngest, Meta y X. Para leer alcanza la anon; para escribir por REST, no. Si
hace falta, que la reponga el usuario —a `.env.local`, nunca por chat—. Para
leer y escribir el schema, `supabase db query --linked` no necesita ninguna
clave: va con el token de `supabase login`.
````

### Cierre del 20/09: el seed se corrió, y la trampa no saltó

> Esto pisa los puntos 1 y 2 del prompt de acá arriba, que ya están hechos.
> Lo de arriba queda como registro de cómo se llegó, pero **el estado de verdad
> es éste**.

**El seed está aplicado.** Lo corrió el usuario a mano —al agente el clasificador
de auto-mode le frena escribir en la base y también le frena editarse los
permisos, así que no hay forma de que lo haga solo; hay que pedírselo—. La
query de verificación da lo esperado:

```
autores            1
temporada activa   primera-b-2026
equipos/aldosivi   10 / 1
```

**La trampa de `generateStaticParams` no existe en Next 15.5.** Con las dos
temporadas cargadas, `npx next build` terminó en exit 0 y
`/plantel/[temporadaSlug]` prerenderizó **dos páginas reales**:

```
● /plantel/[temporadaSlug]
  ├ /plantel/primera-b-2026
  └ /plantel/primera-c-2024
```

Esa ruta es justamente la que recorre el camino sospechado: su
`generateMetadata()` y su cuerpo llaman a `getTemporadaPorSlug()`, que usa
`createClient()` y por lo tanto `cookies()`. **No cortó con "Dynamic server
usage" ni degradó la ruta a `ƒ`.** Next 15 tolera `cookies()` durante el
prerender; el error duro era de Next 14. La nota del Step 14 se puede archivar.

**Queda medio probado, igual.** `/nota/[slug]`, `/partido/[slug]` y
`/jugadora/[slug]` siguen con cero paths porque sus tablas están vacías: el
seed trae catálogos, no contenido. Si el paso 9 llega a fallar por esto, el
sospechoso ya está identificado y `createStaticClient()` ya existe — pero a
esta altura lo más probable es que no pase nada.

39 páginas contra las 37 del build sin datos: las dos de plantel.

### Lo que sigue, en orden

1. **ESLint**, que no valida nada desde el primer commit (la receta con
   `FlatCompat` está más arriba). Es lo único accionable sin esperar a nadie.
2. **`alt.json` (109) y `bajadas.json` (43)**, que son del autor y hoy están en
   cero. Sin eso el paso 9 escribe 27 notas de 70 y las deja todas en borrador.
3. **Paso 9**, `migrate-wp.ts --escribir`, cuando 2 esté aunque sea por tandas.
   Ojo: escribe en la base y sube 109 imágenes al bucket, así que al agente se
   lo va a frenar el mismo clasificador. Hay que preverlo, no descubrirlo a
   mitad de camino.
4. Con notas cargadas, **volver a buildear** y recién ahí cerrar del todo lo de
   `generateStaticParams`.

El árbol sigue limpio: esta sesión no cambió una línea de código. Lo único
tocado es `HANDOFF.md`.

### ESLint: medido, resuelto y trabado por un hook

El arreglo está probado y el backlog es **chico**, que era la duda grande de la
sección anterior ("va a ser bastante"). No lo es.

`@eslint/eslintrc 3.3.7` ya está en `devDependencies` —`pnpm add -D`, corrido el
20/09, commiteado—. Falta una sola cosa: reescribir `eslint.config.mjs` con
`FlatCompat`. La dependencia queda puesta a propósito aunque todavía no la use
nadie: es media hora de `pnpm install` en esta máquina y el día que se escriba
la config no hay que esperarla.

**Está trabado por un hook, no por el código.** El hook `config-protection` del
plugin `ecc` bloquea toda escritura sobre `eslint.config.mjs`:

```
BLOCKED: Modifying eslint.config.mjs is not allowed. Fix the source code to
satisfy linter/formatter rules instead of weakening the config.
```

La regla es sensata —existe para que un agente no afloje el lint en vez de
arreglar el código— pero acá el cambio va justo al revés: hoy el lint **no
corre**, y esto lo hace correr. Hay que desactivar el hook un momento, o pegar
el archivo a mano. Un agente no puede destrabarlo solo: editarse los permisos o
apagar el hook lo frena el clasificador como "Self-Modification", y está bien
que lo frene.

El contenido exacto de la config, ya probado, está en el prompt de abajo.

**El backlog, medido de verdad.** Se corrió con esa misma config desde un
archivo aparte (`npx eslint --config eslint.probe.mjs .`, después borrado):

| Dónde | Qué | De quién es |
|---|---|---|
| `e2e/borradores/medir.js`, `ventana.js` | 2 errores: `require()` en vez de `import` (`@typescript-eslint/no-require-imports`) | rama 20 — no se tocó |
| `CajaAutor.tsx`, `ImagenResponsive.tsx`, `EscudoEquipo.tsx` | 3 warnings `@next/next/no-img-element` | deliberados — ver abajo |

Nada más. 143 archivos en `src/` y ni un error.

**Los tres `<img>` se dejan como están.** No son un descuido: las tres sirven
URLs del bucket de Supabase y `ImagenResponsive` arma su propio `srcSet` con
`urlTransformada()`, que es la transformación de imágenes de Supabase. Meter
`next/image` encima sería una segunda capa de optimización sobre la misma
imagen. Son warnings, no rompen nada, y taparlas con un `eslint-disable` sería
ruido.

**Los 2 errores de `e2e/borradores/` no rompen `next build`.** El lint del build
mira `app/`, `pages/`, `src/`, `lib/` y `components/` —`next.config.ts` no
cambia `eslint.dirs`—, así que `e2e/` queda afuera. `npx eslint .` sí los ve y
por eso termina en exit 1. Los arregla la rama 20, son dos líneas.

### Prompt para la próxima sesión

````
Seguimos con Periódico Delfos, en `periodico-delfos/`. Leé `HANDOFF.md` desde la
sección "La verificación con la base arriba, y lo que quedó trabado" hasta el
final: son tres secciones del 20/09 y la última es ésta. `CLAUDE.md` tiene las
reglas no negociables. Rama `fase/backend-supabase`; no toques `src/app/admin/`
ni `src/components/admin/` (rama 13), ni `e2e/` ni `playwright.config.ts`
(rama 20), ni `/quienes-somos`, `Footer.tsx` o el contorno de foco de
`globals.css` (rama de accesibilidad).

Estado: el seed está corrido (1 autor, `primera-b-2026` activa, 10/1 equipos),
`next build` pasa en verde con datos y la trampa de `generateStaticParams` ya se
descartó. `@eslint/eslintrc` está instalado y commiteado, esperando la config:
la decisión del 20/09 fue dejar la dependencia puesta y el hook como está, así
que el lint sigue sin correr hasta que alguien escriba `eslint.config.mjs`.

TAREA:

1. **Escribir `eslint.config.mjs`** con esto, que ya está probado:

   import { dirname } from 'node:path'
   import { fileURLToPath } from 'node:url'
   import { FlatCompat } from '@eslint/eslintrc'

   const compat = new FlatCompat({
     baseDirectory: dirname(fileURLToPath(import.meta.url)),
   })

   const eslintConfig = [
     ...compat.extends('next/core-web-vitals', 'next/typescript'),
     {
       ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts',
                 '.migracion-wp/**'],
     },
   ]

   export default eslintConfig

   Con el comentario de cabecera explicando por qué hace falta FlatCompat, en el
   estilo del resto del repo.

   OJO: el hook `config-protection` del plugin `ecc` bloquea escribir ese
   archivo. Si te frena, pedíselo al usuario —que lo desactive un rato o lo
   pegue él— y no busques la vuelta: apagar el hook o editarte los permisos lo
   frena el clasificador, y con razón.

2. **Correr `npx eslint .`** y confirmar que da exactamente 2 errores
   (`e2e/borradores/*.js`, de la rama 20) y 3 warnings de `<img>`
   (deliberados). Si aparece algo más, es nuevo y hay que mirarlo.

3. **Commitear las tres cosas juntas**: `package.json`, `pnpm-lock.yaml` y
   `eslint.config.mjs`, después de `npx tsc --noEmit`, `npx vitest run` y
   `npx next build`.

Lo demás sigue esperando al autor: `alt.json` (109) y `bajadas.json` (43) están
en cero, y sin eso el paso 9 sube 27 de 70 notas y todas en borrador. El paso 9
además escribe en la base y sube 109 imágenes al bucket, así que el clasificador
lo va a frenar igual que al seed: preverlo, no descubrirlo a mitad de camino.
````

### La `service_role` expuesta: confirmada, y reemplazada

El pendiente de seguridad que venía arrastrándose —"confirmar que la
`service_role` y la contraseña de la base en uso son las rotadas"— tuvo
respuesta el 20/09, y era la mala: **la que estaba en uso era la original**.

Cómo se comprobó, sin exponer la clave. Las claves legacy de Supabase son JWT
y su payload se lee sin secreto: trae `role`, `ref`, `iat` y `exp`. El `iat`
daba `2026-09-20T02:56:47` y `supabase projects list` da
`created_at: 2026-09-20T02:56:47.880705Z`. **El mismo segundo.** Supabase emite
las claves legacy al crear el proyecto, así que un `iat` igual al `created_at`
prueba que esa clave nunca se rotó.

Es la maniobra de verificación para la próxima vez, y sirve para cualquier JWT
de Supabase:

```
node -e 'const p=JSON.parse(Buffer.from(process.env.CLAVE.split(".")[1],
  "base64url").toString()); console.log(p.role, new Date(p.iat*1000))'
```

**Reemplazada el mismo día.** Hoy `SUPABASE_SERVICE_ROLE_KEY` es una secret key
del formato nuevo (`sb_secret_…`, 41 chars), no un JWT. Probada contra la API:
`206` sobre `equipos` —las 10 filas— y `200` sobre `social_posts`, que no tiene
política de lectura pública. **El bypass de RLS no se pudo demostrar** porque
con las tablas vacías una tabla sin filas devuelve `200 []` también con la
anon; lo que sí quedó probado es que PostgREST la acepta como clave del
proyecto. Cuando haya notas en borrador, eso se verifica de verdad.

El cambio no toca código: `src/lib/supabase/admin.ts` lee la misma variable y
le da igual el formato. La `anon` ya era del sistema nuevo
(`sb_publishable_…`), así que el proyecto tiene las API keys nuevas activadas.

### Las legacy JWT keys, deshabilitadas

**Hecho el 20/09**, en Settings → API Keys. Con eso la clave original expuesta
deja de servir: era el paso que cerraba el agujero de verdad, porque
reemplazarla en `.env.local` sólo hacía que nosotros dejáramos de usarla.

El proyecto quedó **entero en el sistema de claves nuevo**, y se verificó que no
se rompió nada:

| Clave | Formato | Contra `equipos` |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_…`, 46 chars | `206`, 10 filas |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_…`, 41 chars | `206`, 10 filas |

Tampoco hay ninguna clave hardcodeada en lo versionado: `git grep` de JWT y de
los dos prefijos nuevos no da nada —las únicas apariciones son estos prefijos
escritos en este mismo archivo—, y `.env.local` está tapado por `.gitignore`
(`.env*`, línea 34), comprobado con `git check-ignore`.

Vercel no aplica: el proyecto todavía no existe, así que no hay variable de
entorno vieja dando vueltas.

### Lo que sigue abierto, y es del usuario

- **La contraseña de la base.** Sigue sin rotarse y el 20/09 se volvió a pegar
  en un chat, así que ahora está expuesta dos veces y es corta. Se resetea en
  Settings → Database → Reset database password; conviene una generada larga,
  guardada en un gestor. El CLI no la usa —`db query --linked` va con el token
  de `supabase login`—, así que resetearla no rompe nada de lo que hoy anda.
  **Es el único pendiente de seguridad que queda.**

Y la regla que lo evita la próxima: las credenciales van a `.env.local` o a un
gestor, nunca a un chat. Un agente no debe pedirlas ni aceptarlas por ahí, y si
llegan igual, lo que corresponde es decir que hay que rotarlas.

## El admin de notas, la vista previa y el lazo con el partido

> Rama `fase/13-admin-notas`, salida de `fase/backend-supabase`. Sección escrita
> el 20/09/2026. **No edita nada de arriba.** Ocho commits: el admin entero, la
> vista previa, el rediseño de compartir y el vínculo nota ↔ partido.

**El admin no existía y ahora existe.** Vale aclarar por qué se construyó acá:
las tres ramas paralelas —`fase/13-planilla-de-carga`, `fase/20-e2e` y
`fix/accesibilidad-y-pie`— están en **cero commits sobre `main`**. Los merges
que figuran en el historial trajeron sólo los encargos, o sea el documento de
"qué hay que hacer". Nadie escribió ese código. Conviene chequearlo antes de
volver a repartir trabajo entre ramas.

### Entrar

| Ruta | Qué |
|---|---|
| `/admin/login` | Contraseña **y** magic link, un solo formulario |
| `/auth/confirm` | Canjea el `token_hash` del mail, del lado del servidor |
| `/auth/callback` | El flujo PKCE, con `?code=` |
| `src/middleware.ts` | Protege `/admin/*`, matcher acotado |

Tres decisiones que no hay que rediscutir:

- **El magic link no alcanza solo.** El blueprint § 9 pide magic link y está,
  pero depende del SMTP del proyecto; sin el respaldo de la contraseña, un
  problema de entrega deja el panel inaccesible y no hay forma de publicar.
- **El template del mail hay que cambiarlo en la consola.** El que viene de
  fábrica pasa por el endpoint de verificación de Supabase y vuelve con los
  tokens **en el fragmento de la URL**, que no viaja al servidor. El síntoma es
  aterrizar en la home con `#error=access_denied&error_code=otp_expired`, que
  parece expiración y no lo es. Va:
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`, más
  `http://localhost:3000/**` en Redirect URLs.
- **El grupo `(panel)` deja `/admin/login` afuera del layout protegido**, que si
  no se redirigiría a sí mismo para siempre. Y el layout **re-verifica fila en
  `autores`**: tener sesión de Auth no es ser el autor, y es el mismo criterio
  que `es_autor()` en RLS.

El usuario de Auth es **el mail del propio dueño del proyecto**, no uno de
Charlie: `autores.id` es FK a `auth.users(id)` y el seed entró sin error, así
que ese UUID existe. Cuando Charlie tenga casilla, se le **edita el mail a ese
mismo usuario**: el UUID no cambia y la fila de `autores` sigue válida. Borrarlo
y crear otro sí rompe, y hay que actualizar el UUID en `seed.sql`.

### Escribir

`/admin` lista todo —borradores arriba—, `/admin/notas/nueva` y
`/admin/notas/[id]` editan. El cuerpo es TipTap y **guarda JSON, no HTML**.

- El slug se calcula del título **sólo mientras la nota no existe**. Renombrar
  una publicada no le toca la URL (regla 8).
- Los Server Actions reciben un objeto, no un `FormData`: el cuerpo es un árbol.
- `publicarNota` revalida `/`, `/cronicas`, `/analisis` y `/nota/[slug]`. Sin
  eso la nota no aparece hasta que venza el ISR de 60s.
- **El disparo a Inngest está marcado con un comentario, no cableado.** No se
  postea inline en el request: tres APIs colgando de la publicación.
- Los dos nodos propios —`imagen` y `planilla`— **todavía no se insertan desde
  el editor**. El renderer ya los dibuja; falta la extensión de TipTap. Un
  cuerpo que ya los trae se edita sin perderlos: StarterKit ignora lo que no
  conoce en vez de borrarlo.

### La vista previa

Sale de un pedido concreto: hasta ahora, para ver una nota terminada había que
publicarla, mirarla y despublicarla, y eso dispara el auto-posteo, que no tiene
vuelta atrás.

**Se dibuja con `<ArticuloNota />`, el componente del sitio público.** Cero
markup paralelo, y no puede haberlo: una preview con estilos propios muestra
cómo se ve la preview, no cómo va a quedar la nota. No hubo que partir ningún
componente —**ninguno de `src/components/` consulta Supabase adentro**, la
convención ya se respetaba— salvo sacar `urlTransformada()` de
`ImagenResponsive` a `src/lib/imagen.ts`: armaba el `srcSet` reescribiendo la
URL del bucket y con un `blob:` producía URLs inválidas, o sea que la portada
elegida y sin subir se veía en blanco justo en la preview.

- **Publicar pasa obligatoriamente por la preview.** Es garantía de interfaz, no
  del servidor: `publicarNota` no puede saber si alguien miró. Con un solo autor
  no vale un token firmado; lo que el servidor sí re-chequea es que la nota esté
  completa. **Decidido explícitamente, no lo rediscutas.**
- La imagen elegida vive **aparte** de `entrada.imagen_portada`, donde sólo
  puede ir una URL del bucket. El `blob:` se libera al cambiar de foto y al
  desmontar, y **la subida ocurre al guardar o publicar**: probar tres fotos y
  cerrar no deja nada en Storage.
- El nodo `planilla` se dibuja con el mapa de partidos **vacío**. Se decidió
  esperar a tener un partido cargado antes de escribir esa parte, en vez de
  plomería que no se puede verificar. Cuando llegue: query en
  `queries/partidos.ts` con el cliente de navegador, TanStack Query y
  `mapaDePartidos()`.

### La barra de compartir, rediseñada

Se descubrió mirando la preview en ancho móvil, que es exactamente para lo que
esa pantalla existe: con los rótulos al lado del icono, cuatro botones no entran
en 390px y se parten en dos o tres filas.

Quedaron **círculos con anillo verde, tres siempre**: WhatsApp, X y —según el
caso— Facebook arriba. El tercero es `Más` o `Copiar link`, **nunca los dos**:
donde hay `navigator.share` la hoja del sistema ya trae "Copiar" adentro, y
donde no la hay copiar es lo único que reemplaza a WhatsApp.

- **En móvil miden 40px y no 44: es la única excepción a `.tactil` del sitio.**
  44 es el criterio 2.5.5 de WCAG, que es AAA; el que rige a nivel AA es el
  2.5.8, que pide 24. Está anotado en el componente con cómo revertirlo.
- **Instagram no está y no puede estar.** No existe un link web que abra la app
  con la nota cargada, ni feed ni Stories. Un círculo con su logo sería un botón
  que no hace nada. El camino a Instagram es la hoja del sistema, o sea `Más`.
  Si alguna vez se quiere un icono de IG, va al **pie del sitio** apuntando al
  perfil del medio, y necesita el handle, que sigue sin darse.

### La nota atada al partido

Tres cosas chicas que juntas dan la nota de partido de un diario deportivo, con
mejores datos que la referencia que trajo el usuario —una nota de Olé, donde la
ficha y las formaciones van tipeadas adentro del texto, que es justo lo que este
proyecto vino a eliminar:

1. **Selector de partido en el editor.** Es el campo que enciende todo lo
   deportivo. **No se escribe ningún dato del partido ahí**: sólo se elige cuál.
2. **El marcador apenas debajo de la imagen**, antes del texto
   (`<PlanillaCompacta />`, que ya existía). Quien entra a la crónica viene a
   saber cómo salió. La planilla completa sigue al pie.
3. **`getNotasRelacionadas` trae primero las del mismo partido** y completa con
   las de la temporada. Un partido genera previa, crónica y análisis, y ésas son
   las que se leen una detrás de otra.

Y `etiquetaDePartido()` en `lib/partido.ts`, con tests: `"Fecha 4 · Aldosivi 6-1
Claypole"`.

### Los datos reales, y lo que no se pudo cargar

`supabase/datos/2026-plantel-y-fecha-4.sql` — **escrito, sin aplicar**. Sale de
dos notas publicadas que están en `.migracion-wp/`: el plantel 2026 con las 32
jugadoras y su posición, y la crónica de la fecha 4 con la formación, los
suplentes y el resultado. Carga 33 jugadoras, el plantel, el partido Aldosivi
6-1 Claypole y las 20 formaciones.

**No carga un solo gol, y ahí está el punto importante.** La crónica los lista
sin minuto —"Goles: Larea, dos veces, Gutiérrez, Camacho, Nielsen, Contín"— y
`eventos.minuto` es `not null`. Inventar siete minutos sería escribir un dato
deportivo falso que después se dibuja en la línea de tiempo del partido. El
`insert` quedó escrito en un comentario del archivo, listo para cuando estén.

Dos cosas más que la fuente no resuelve: la ficha dice **"18:80"** como hora, que
no existe, y la arquera aparece como "Katkjia Velardez" en la crónica y "Katja
Veñardez" en el plantel. Se usó la segunda. El usuario dijo que los nombres no
importan por ahora —"estamos probando"— y que **los minutos los cargue Charlie
desde la planilla**, que es la decisión correcta y la que confirma el diseño.

**El plantel va sin dorsales a propósito**: la propia nota dice que en la
categoría no hay dorsales fijos. Los números conocidos son los de ese partido y
van en `formaciones.dorsal`, que es por partido.

### La arquitectura que el usuario confirmó

Preguntó si la cronología del partido conviene editarla adentro de la nota o
aparte. **Aparte**, y las razones quedan acá porque es la decisión de diseño que
sostiene el proyecto entero:

1. Un partido tiene varias notas. Si los goles vivieran en una, habría que
   tipearlos tres veces o elegir cuál es "dueña" del dato.
2. Los goles alimentan cosas que no son notas: goleadoras, estadísticas por
   jugadora y tabla de posiciones salen todas de `eventos`.
3. El momento de carga es otro: el partido se carga desde la tribuna, en el
   celular; la nota se escribe después.

O sea que el nodo `planilla` guarda **sólo el id del partido** y trae todo lo
demás de la base al dibujarse. Cero datos duplicados.

### Lo que falta aplicar en la consola

| Archivo | Qué pasa si no se aplica |
|---|---|
| `supabase/migrations/0010_storage_media.sql` | La subida de imagen falla: el bucket no tiene ni una política. Lo creaba el script de migración con service role |
| `supabase/datos/2026-plantel-y-fecha-4.sql` | No hay partidos: el selector del editor sale vacío y nada deportivo se enciende |

Los dos con
`npx --no-install supabase db query --linked -f <archivo>`. **Al agente lo frena
el clasificador de auto-mode**: hay que pedírselo al usuario.

### Cómo quedó verificado

`npx tsc --noEmit` limpio · `npx vitest run` 397 tests en 24 archivos ·
`npx next build` exit 0 con 42 páginas. El admin se probó a mano en
`localhost:3000`: login, listado, editor, preview y publicación.

`pnpm lint` sigue sin correr —`eslint.config.mjs` roto desde el primer commit y
bloqueado por el hook `config-protection`—. La receta está más arriba.

## La planilla de carga y los links del editor

> Rama `fase/13-admin-notas`, misma sesión del 20/09, después de la sección
> anterior. **El mapa del panel vive ahora en `docs/admin.md`** y se actualiza
> en el mismo commit que agrega una pantalla: esta sección no lo repite.

**La planilla de carga existe** (`/admin/partidos/[id]/planilla`). Es el Step 13,
el marcado con estrella. Dos o tres toques por evento y **se guarda al tocar la
jugadora, sin botón de confirmar**: un "Guardar" por evento son treinta toques
por partido, y es lo que separa los tres minutos del objetivo de los seis.

- **Cuatro botones y no nueve.** `tipo_evento_t` tiene nueve valores; gol,
  amarilla, roja y cambio son el 95% de lo que pasa. Los otros cinco se cargan
  después, con el partido terminado.
- **La grilla se filtra por quiénes están en cancha.** `enCancha()` aplica los
  cambios en orden de minuto y saca a las expulsadas. Es la diferencia entre una
  planilla usable y una lista de treinta caras.
- **"Finalizar partido" toma el marcador de los goles cargados**, no de lo que
  se escriba a mano. Si no coincide con lo declarado al crear el partido, la
  pantalla lo dice y **no corrige**: cuál de los dos está bien no lo sabe el
  sistema.
- **Falta la cola offline en IndexedDB**, que el blueprint pide y es la que hace
  que esto sirva en una cancha de ascenso. Hoy un evento cargado sin señal se
  pierde.
- **Falta probarla en un celular real y cronometrarla.** El encargo dice que ése
  es el entregable de verdad: si pasa de tres minutos, iterar antes de seguir.
  Se construyó y se verificó en escritorio nada más.

**Se construyó el Step 13 antes que el 12**, y eso deja un hueco raro: la
planilla edita un partido que ya existe, y **crear un partido todavía no se
puede desde ninguna pantalla**. Hoy entran por SQL. Las seis pantallas que
faltan están listadas en `docs/admin.md`.

**El editor ya enlaza.** El blueprint lo pedía —"extensiones: encabezados,
negrita/itálica, links, blockquote"— y faltaba. Se elige de una lista de notas
publicadas, no se pega una URL: pegar a mano se escribe mal y no deja saber
después qué notas citan a cuál. Queda igual un campo de URL libre para las
fuentes de afuera.

**Verificado**: `tsc --noEmit` limpio, 415 tests en 25 archivos, `next build`
exit 0 con 42 páginas.
