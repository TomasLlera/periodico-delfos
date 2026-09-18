# Handoff — Periódico Delfos

Copiá el bloque de "Prompt para la próxima sesión" en un chat nuevo. Está escrito
para que un agente arranque en frío, sin haber visto nada de este proyecto.

Actualizar este archivo al terminar cada step.

---

## Estado al cierre de los widgets deportivos de la portada

> **LEER PRIMERO.** El tema se invirtió **dos veces** en un mismo día: primero a
> oscuro (rediseño "portal deportivo"), después de vuelta a **claro/crema**, que
> es el estado actual y el definitivo. Si algo de este archivo más abajo dice
> "el tema por omisión es el oscuro", **está viejo**: vale esta sección. El
> blueprint y `CLAUDE.md` ya **no** mienten — se corrigieron. Lo que sigue
> vigente del rediseño oscuro es todo lo que no es color: la planilla plegable,
> la línea de tiempo horizontal, `.titular`/`.meta`/`.tarjeta`/`.franja` y la
> decisión de no usar Barlow Condensed.

**Lo último que se hizo: los tres widgets deportivos que le faltaban a la
portada** —`<BarraEstado />`, `<FechaAFecha />` y `<Goleadoras />`—, y la
primera mirada en navegador a `/demo/nota` y `/demo/planilla`, que era lo único
del sitio que nunca se había visto dibujado. Ver "Los widgets deportivos de la
portada, en detalle" más abajo. Se miran con datos falsos en `/demo/portada`.

**Con eso la portada ya es la del boceto entero**, salvo el newsletter, que
sigue sin decidirse.

Antes de eso, en sesiones anteriores: las tres páginas deportivas que cerraron
el Step 14 —`/temporada/[slug]`, `/plantel/[temporadaSlug]` y
`/jugadora/[slug]`—, la portada del Step 9 según `referencia/boceto-portada.html`,
la puesta al día de la documentación con la paleta crema y el chrome portado
(`Header` y `Footer`); todo detallado más abajo.

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

**Los tres widgets deportivos ya están escritos y enchufados a `/`, y hoy no
se ven.** `<BarraEstado />` (la tira de arriba del header), `<FechaAFecha />`
(la cinta de resultados) y `<Goleadoras />` (el top 5) se dibujan **sólo si la
base tiene con qué**: sin proyecto de Supabase las consultas no corren, los tres
reciben vacío y se borran solos —`return null`—, así que en la ruta pública no
aparece ni un marcador inventado (regla no negociable 1). El día que haya datos
aparecen sin tocar una línea. Para verlos dibujados está `/demo/portada`.

El bloque de plantel sigue igual: acepta caras y estadísticas como props
opcionales y **`/` no se las pasa**, porque esos números —"24 jugadoras · 19
goles · 3° en la tabla"— salen de `plantel` y `estadisticas_jugadora`, que
todavía no se consultan desde la portada. El newsletter tampoco entró: no está
en el Build Order y la decisión sigue sin tomarse.

**Un token cambió de valor** al portar el chrome: `--color-verde-900` en oscuro
era `#007A41`. El token está documentado como **superficie** —la cabecera, la
tapa, el aside— y un verde de acento con texto blanco encima parece un
resaltador. Pasó a `#102A1E` (blanco 15.32:1, amarillo 7.56:1). Es el único
valor de la paleta oscura que se tocó.

**Verificado en esta sesión:** `tsc --noEmit` limpio, **348 tests** (los 333 de
antes más 15 nuevos de `portada.ts`), y `next build` verde con **26 rutas** —las
mismas: los widgets no agregan rutas—. **`/` sigue saliendo estática** (`○`),
que es lo que había que cuidar al enchufarle cinco consultas más: sin base no se
llama a `cookies()` y el prerender se mantiene.

Y se miró en un navegador de verdad: `/`, `/demo/portada`, `/demo/nota`,
`/demo/planilla`, `/demo/articulo` y `/demo/temporada`, a **1280 y 375 px**, en
**tema claro y oscuro** —24 combinaciones—. Todas: **sin scroll horizontal**
(`documentElement.scrollWidth === clientWidth` **y** `body.scrollWidth` igual),
**un solo `<h1>` por página**, sin warnings de hidratación y sin errores de
consola propios.

**Lo único que sigue apareciendo en la consola** son prefetch de Next (`?_rsc=`)
a rutas que hoy no existen: `/jugadora/<slug>` y `/partido/<slug>` desde las
demos —no hay base que resuelva esos slugs— y **`/contacto` y `/privacidad`
desde el pie, que están en el pie de *todas* las páginas y todavía no existen**.
Ese último es un 404 real y visible para el lector: hay que escribir las dos
páginas o sacar los dos links del pie hasta que estén. Está bloqueado por datos
del autor (ver "Decisiones que el usuario todavía no tomó").

**No verificado:** nada de la escritura a Supabase (`--escribir`), no hay
proyecto todavía. Y **ningún widget deportivo se vio nunca con datos reales**:
lo que está probado es que con la base vacía no se dibujan, y que con datos
falsos se dibujan bien. El día que haya temporada cargada hay que mirar los tres
otra vez.

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
no sólo el shell que lo lanzó, y ante la duda borrar `.next` y buildear limpio. `pnpm` no se usó, así que no
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
| **17** | **Los tres widgets deportivos de la portada: `<BarraEstado />`, `<FechaAFecha />` (con `<ChipResultado />`) y `<Goleadoras />`. Miralos en `/demo/portada`** | `src/components/layout/BarraEstado.tsx`, `src/components/portada/FechaAFecha.tsx`, `Goleadoras.tsx`, `src/components/partido/ChipResultado.tsx`, `src/lib/portada.ts` |
| **16** | **Lo que faltaba del Step 14: `/temporada/[slug]` (fixture, tabla y goleadoras), `/plantel/[temporadaSlug]` y `/jugadora/[slug]`. Miralas en `/demo/temporada`, `/demo/plantel` y `/demo/jugadora`** | `src/app/temporada/`, `plantel/[temporadaSlug]/`, `jugadora/[slug]/`, `src/components/` (temporada, plantel, jugadora), `src/lib/temporada.ts`, `plantel.ts`, `jugadora.ts` |

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

## Los widgets deportivos de la portada, en detalle

Son los puntos 1, 4 y 5 de la portada del blueprint (7.2), lo último que le
faltaba a `/` para ser el boceto entero.

| Widget | Dónde | Qué muestra |
|---|---|---|
| `<BarraEstado />` | `src/components/layout/` | La tira de arriba del header: último resultado, próximo partido y posición en la tabla |
| `<FechaAFecha />` | `src/components/portada/` | La cinta de resultados de la temporada, con el próximo destacado |
| `<ChipResultado />` | `src/components/partido/` | Cada ficha de esa cinta. Va aparte porque no sabe nada de la portada |
| `<Goleadoras />` | `src/components/portada/` | El top 5, reusando `<ListaGoleadoras />` |

La lógica que decide **qué** se muestra está en `src/lib/portada.ts`, con 15
tests: `cintaTemporada()` (qué partidos entran en la cinta y cuál es el
próximo), `textoPosicion()` y `ordinalPosicion()`. Los componentes sólo dibujan.

### El contrato de los tres: sin datos no se dibujan

Los tres empiezan con un `return null` cuando lo que reciben está vacío, y **la
portada real ya les pasa lo que haya en la base**: `leerDeportivo()` en
`src/app/page.tsx` pregunta `haySupabase()` primero, así que hoy los tres
reciben `null`/`[]` y `/` sale exactamente igual que antes. El día que exista el
proyecto, los widgets aparecen sin tocar una línea.

Es distinto de lo que pedía el prompt de la sesión pasada —"la portada real no
les pasa datos"— y es lo mismo en efecto: lo que la regla no negociable 1
prohíbe es **inventar** marcadores, no leer los que estén cargados. Dejarlos
desconectados hubiera sido dejar el step a medias, con tres componentes que no
usa nadie.

Dos cosas que hubo que cuidar al enchufarlos:

- **`/` sigue prerenderizada.** Las consultas usan `createClient()`, que pide
  `cookies()` y saca a la página del prerender; hoy no se llaman nunca porque
  `haySupabase()` es falso. **Con base, `/` se va a volver dinámica** —igual que
  `/nota/[slug]` y las otras, ver "Una trampa para el día que haya
  credenciales"—. El arreglo es el mismo de siempre: `createStaticClient()`.
- **Las cinco consultas van en paralelo** (`Promise.all`), después de la
  temporada activa, que es la única de la que dependen las otras tres. En serie
  eran cinco viajes encadenados en el render de la portada.

### La cinta no muestra la temporada entera

`cintaTemporada()` devuelve una **ventana de ocho**: los últimos cuatro jugados
y los próximos cuatro. No es una decisión estética. Un contenedor con scroll
horizontal arranca siempre en `scrollLeft: 0`, o sea en la fecha 1, que es el
dato menos interesante de la temporada, y **sin JavaScript no hay forma de
posicionarlo en el medio**. Con la ventana, lo primero que se ve es lo último
que pasó. El fixture completo está a un link.

La ventana se rellena para los dos lados: temporada terminada → ocho
resultados; temporada sin empezar → ocho fechas por venir. Nunca queda a la
mitad. Ojo con `slice(-0)`, que devuelve el array **entero** y no ninguno: hay
un test que lo cubre.

### Por qué el resultado no va en color

El filete de color del chip (verde / gris / rojo / amarillo para el próximo) es
**un refuerzo, no el dato**: lo que manda es la palabra —"Ganó", "Empató",
"Perdió"— y el marcador. No es sólo por WCAG 1.4.1; es que **no hay ningún par
texto/fondo que aguante AA en los dos temas** con estos tokens. Medido:

- Blanco sobre `verde-600`: 8.14:1 en claro, **3.11:1 en oscuro** (el token se
  aclara a #00A859). Falla.
- `negro-cancha` sobre `verde-600`: 6.26:1 en oscuro, **1.98:1 en claro**. Falla
  al revés.
- `text-roja` sobre `tarjeta`: 5.27:1 en claro, **4.24:1 en oscuro**. Queda a un
  pelo de AA. **Esto ya pasa en el chip de resultado de `<PlanillaPartido />`**,
  que es anterior a este step y usa `border-roja text-roja`: sobre `papel` da
  4.91 y pasa, sobre `tarjeta` no. Anotado, sin tocar.

Un borde no es texto, así que el filete puede llevar el color sin pedirle
contraste a nadie.

### El bug de scroll horizontal, otra vez y con otra cara

Los dos widgets con scroll horizontal dejaron el documento en **1180px con un
viewport de 375**, sin que se viera nada raro en las capturas. Es la tercera
versión del mismo bug.

La causa: **`.sr-only` es `position: absolute`**, y un absoluto se mide contra
su ancestro posicionado más cercano. Los chips y los links de la barra llevan su
`sr-only` adentro de un `overflow-x-auto` que **no estaba posicionado**, así que
el ancestro terminaba siendo el documento y el `overflow` no los contenía: cada
uno estiraba la página entera.

> **Regla:** todo contenedor con `overflow-x-auto` que adentro tenga un
> `.sr-only` (o cualquier absoluto) va con `relative`. Sin eso, el scroll no
> contiene nada.

Se encontró midiendo, no mirando, y con un detalle nuevo del método: el
recorrido del DOM buscando "quién se pasa" **no lo encuentra**, porque los
culpables están adentro de un contenedor con scroll y ahí se pasan a propósito.
Lo que sí lo encuentra es probar hipótesis sobre la página viva: poner los
`.sr-only` en `static` y volver a medir (375), o poner `relative` en los
contenedores y volver a medir (375).

Un segundo detalle de la cinta: con `snap-x` y `px-1` el navegador arranca con
`scrollLeft: 4` —el snap alinea el primer chip con el borde del *scrollport*,
que el padding corrió 4px— y el filete de color del primer chip nacía tapado. Se
arregla con `scroll-px-1`, que hace que el snap cuente ese padding.

### `<ListaGoleadoras />` sirvió tal cual

El prompt preguntaba si convenía una variante corta para la portada. No: la
lista ya es una `<ol>` —el orden *es* el dato—, ya resuelve la foto que falta y
ya dice cuántos goles fueron de penal. Lo único que cambia entre la portada y la
pestaña de la temporada es **cuántas filas entran**, y eso lo decide quien
consulta (5 contra 25). Una variante corta habría sido el mismo componente con
otro nombre.

### Dos páginas que no tenían `<h1>`, y una que tenía dos

Salió de medir "un solo `<h1>` por página" en las páginas de este step:

- **`/demo/portada` tenía dos**: el suyo ("La portada") y el de la nota de tapa,
  que lo dibuja `<NotaTapa />`. El título de la demo pasó a ser un `<p>` con el
  mismo aspecto, así que la demo tiene la misma estructura de encabezados que la
  portada real, que es justamente para lo que existe.
- **`/` vacía no tenía ninguno**: sin base no hay nota de tapa, y el `<h1>` de la
  portada *es* el titular de la tapa. Ahora el estado vacío pone el suyo
  ("Periódico Delfos"), así que la portada tiene exactamente uno en los dos
  casos.

### Lo que apareció al mirar `/demo/nota` por primera vez

Era la única página del sitio que nunca se había visto dibujada. Las listas, el
`<code>`, el `<hr>` y el `<blockquote>` del cuerpo están **bien** en los dos
temas a 375: viñetas y números en verde, filete amarillo en la cita, el `hr`
corto y centrado, el `code` con su caja. Lo que estaba mal era la escala de
títulos, y hacía falta verlo para darse cuenta:

- **El `h3` del cuerpo medía 18px**: lo mismo que el cuerpo en mobile y **menos
  que el cuerpo en desktop**, donde la medida sube a 19px. Un subtítulo más chico
  que el texto que encabeza no se lee como subtítulo. Pasó a 20px / 22px, abajo
  del `h2` (22/28) y arriba del cuerpo.
- **El `h4` no tenía ninguna regla**: salía con el peso y el tamaño de un
  párrafo, o sea invisible. El renderer lo emite —un título de nivel 3 adentro de
  una nota que ya empieza en `h3`, que es lo que hace `/demo/nota` con
  `nivelBase={3}`—. Ahora va como volanta: display, 700, caja alta, 0.95rem.

Los dos arreglos están en `globals.css` y se ven en `/demo/articulo`, que es la
página que dibuja el cuerpo con `nivelBase={2}`, o sea con `h2` de verdad.

**`/demo/planilla` está bien**: los iconos que pasaron a lucide se leen en los
dos temas a 375 —la tarjeta amarilla, la roja, las flechas del cambio— y la
pelota dibujada a mano (la excepción documentada) se distingue igual. Sin
desbordes y con un solo `<h1>`.

### Decisiones de los widgets que no hay que volver a discutir

- **La barra va en `/` y no en el layout.** "Fija arriba, siempre visible" del
  blueprint es sobre la portada: en el resto de las páginas nadie fue a buscar el
  resultado de la fecha, y ponerla en el layout obliga a consultar la base en
  cada ruta del sitio.
- **El chip nombra sólo al rival.** El otro equipo es siempre Aldosivi —es un
  medio de un solo club— y repetirlo ocho veces gasta el ancho que necesita el
  nombre que sí cambia. La condición de local o visitante va abajo del marcador,
  y el marcador se lee siempre desde Aldosivi (`ladosDelPartido()`).
- **`<Goleadoras />` en la columna del aside**, abajo del bloque de plantel. En
  el DOM queda después de la cinta y antes del archivo, que es el orden del
  blueprint; en pantalla queda en la columna angosta, que es donde un ranking de
  cinco filas se lee mejor.
- **La cancha del próximo partido se omite cuando no está cargada**, en lugar de
  escribir "a confirmar". La base guarda `null`, no una promesa.

---

## Decisiones que el usuario todavía no tomó

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
- **Los tres widgets deportivos ya están escritos** —`BarraEstado`,
  `FechaAFecha` y `Goleadoras`, que el Build Order ponía en el Step 19— y **se
  dibujan solos el día que la base tenga la temporada 2026 cargada**. Hasta
  entonces reciben vacío y no se muestran. Lo que sigue en pie es la regla: **no
  inventar datos deportivos para llenarlos** (regla no negociable 1); los
  números del boceto viven en `/demo/portada` y en ningún otro lado.
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

## Prompt para la próxima sesión

````
Estoy construyendo Periódico Delfos, un medio digital de Mar del Plata dedicado
al fútbol femenino de Aldosivi (las "Tiburonas"). Lo escribe una sola persona.
Es una migración desde WordPress.

El plan está en `periodico-delfos-blueprint-v2.md` y el estado real en
`HANDOFF.md`. **Leé la sección "Estado al cierre de los widgets deportivos de la
portada" antes que nada**: el tema se invirtió dos veces en un día y hay partes
viejas más abajo en ese mismo archivo. El blueprint y `CLAUDE.md` sí están al
día.

Proyecto en `periodico-delfos/`. Next 15.5 App Router + TypeScript strict +
Tailwind v4 + Supabase + TipTap + Inngest. Hoy pasan `tsc --noEmit` y 348 tests,
y `next build` da 26 rutas con `/` estática. Mantenelos verdes.

**Parar el server antes de buildear, y matar el proceso, no el shell.** Van dos
sesiones seguidas encontrando un `next start` vivo de la sesión anterior: el
build no puede reemplazar los archivos tomados y el server sigue sirviendo el
build viejo, así que una tanda entera de verificación dice cosas falsas. En
Windows: `Get-NetTCPConnection -LocalPort 3100` → `Stop-Process -Force`. Ante la
duda, borrar `.next` y buildear limpio. Y no arranques el server con `| head`:
cuando head cierra el pipe queda colgado escuchando pero sin responder;
redirigilo a un archivo.

Sigue sin haber proyecto de Supabase ni `.env.local`, así que la tarea no puede
depender de leer o escribir en la base.

CONTEXTO: **todas las rutas públicas del blueprint existen menos `/contacto` y
`/privacidad`**, y la portada ya es el boceto entero: la tapa, las crónicas, la
cinta de fecha a fecha, el análisis con el bloque de plantel, las goleadoras y
el archivo, más la barra de estado arriba del header. Los tres widgets
deportivos se dibujan solos el día que haya base y hoy no se ven. El patrón está
establecido y conviene copiarlo: Server Components puros que reciben todo por
props, la página lee y no dibuja, los datos inventados encerrados en
`src/app/demo/`, y toda la lógica que se pueda sacar a `src/lib/` con tests.

TAREA, en este orden:

1. **Convertir la verificación en navegador en una suite de Playwright
   commiteada.** Es la parte del Step 20 que no necesita base, y es lo que más
   rinde ahora: hace cinco sesiones que cada una escribe el mismo script a mano
   en un temporal, lo corre y lo tira. Va en `e2e/`, con `playwright.config.ts`
   (`webServer` que levante `next start` en un puerto propio, `projects` para
   1280 y 375 px, `colorScheme` claro y oscuro) y un script `test:e2e` en
   `package.json`. **No mezclarla con vitest**: `vitest.config.mts` tiene que
   seguir sin ver `e2e/`, porque `@playwright/test` y vitest se pisan.

   Los chequeos, que son exactamente los que se vienen haciendo a mano y están
   contados en el HANDOFF:
   - **Sin scroll horizontal**: `documentElement.scrollWidth === clientWidth`
     **y** `body.scrollWidth` igual. Los dos, no uno: si el body mide bien y el
     documento no, hay un absoluto escapándose de un contenedor con scroll.
   - **Un solo `<h1>` por página.**
   - **Sin errores de consola propios**. Los 404 de prefetch (`?_rsc=`) a rutas
     que sin base no existen son ruido conocido: filtralos por URL, no por el
     texto del mensaje, que no la trae.
   - Las rutas que tienen que dar 404 lo dan: `/temporada/no-existe`,
     `/jugadora/no-existe`, `/plantel/no-existe`.
   - Que `?ver=chirimbolo` en la temporada caiga en el fixture y no rompa.

   Las páginas: `/`, `/cronicas`, `/analisis`, `/buscar`, `/plantel`,
   `/fixture`, `/quienes-somos` y las nueve de `/demo/`. Si esperás hidratación,
   esperá a que el `<time>` del header tenga texto.

2. **Los dos links del pie que dan 404 en todas las páginas.** `/contacto` y
   `/privacidad` están bloqueadas por datos que sólo tiene el autor (ver
   "Decisiones que el usuario todavía no tomó"). **Preguntale los datos primero.
   Si no los tiene a mano, sacá los dos links del pie** —una constante en
   `Footer.tsx`, reversible en una línea— y dejá anotado en el HANDOFF que
   vuelven cuando existan las páginas. Un 404 en el pie de todas las páginas es
   peor que un pie con una sección menos.

3. **Si sobra tiempo**, confirmá que el OG de `/partido/[slug]` sale con el
   resultado: `urlOg({ titulo: titulo(partido), ... })` ya manda el marcador en
   el título, así que puede estar hecho desde el Step 15. Mirá la imagen de
   verdad en `/api/og?titulo=...&volanta=...` antes de darlo por cerrado o por
   pendiente.

**Medí el scroll horizontal en cada página que toques**, aunque ahora lo haga la
suite. Y una regla nueva que salió de esta sesión: **todo contenedor con
`overflow-x-auto` que adentro tenga un `.sr-only` va con `relative`**. `.sr-only`
es `position: absolute` y sin ancestro posicionado se mide contra el documento:
el scroll no lo contiene y la página termina midiendo 1180px en un viewport de
375 sin que se note en la captura.

Al terminar, actualizá `HANDOFF.md` y dejá un prompt para el siguiente step.

Ojo con las decisiones que el usuario NO tomó: la fuente mono, el newsletter,
los handles de las redes y los datos de `/contacto` y `/privacidad`. Están en
"Decisiones que el usuario todavía no tomó" y no se inventan.

Si en el medio aparecen las credenciales de Supabase, esto pasa a segundo plano:
con base, el orden es Step 5 (auth + shell del admin), Step 6 (correr la
migración con `--escribir`) y Step 7 (editor de notas). Y hay que mirar los tres
widgets deportivos con datos reales, que es lo único de ellos que no está
probado.
````

---

## Prompt anterior, ya cumplido

````
Estoy construyendo Periódico Delfos, un medio digital de Mar del Plata dedicado
al fútbol femenino de Aldosivi (las "Tiburonas"). Lo escribe una sola persona.
Es una migración desde WordPress.

El plan está en `periodico-delfos-blueprint-v2.md` y el estado real en
`HANDOFF.md`. **Leé la sección "Estado al cierre del Step 14" antes que nada**:
el tema se invirtió dos veces en un día y hay partes viejas más abajo en ese
mismo archivo. El blueprint y `CLAUDE.md` sí están al día.

Proyecto en `periodico-delfos/`. Next 15.5 App Router + TypeScript strict +
Tailwind v4 + Supabase + TipTap + Inngest. Hoy pasan `tsc --noEmit` y 333 tests,
y `next build` da 26 rutas. Mantenelos verdes.

**Parar el server antes de buildear, y matar el proceso, no el shell.** En la
sesión pasada un `next start` quedó vivo, el build no pudo reemplazar los
archivos tomados y el server siguió sirviendo el build viejo: una tanda entera
de verificación dijo cosas falsas. En Windows:
`Get-NetTCPConnection -LocalPort 3100` → `Stop-Process -Force`. Ante la duda,
borrar `.next` y buildear limpio. Y no arranques el dev server con `| head`:
cuando head cierra el pipe el server queda colgado escuchando pero sin
responder; redirigilo a un archivo.

Sigue sin haber proyecto de Supabase ni `.env.local`, así que la tarea no puede
depender de leer o escribir en la base.

CONTEXTO: ya están la portada, los listados, el SEO técnico, el buscador,
`/partido/[slug]` y —lo último— las tres páginas deportivas del Step 14:
`/temporada/[slug]`, `/plantel/[temporadaSlug]` y `/jugadora/[slug]`. El patrón
está establecido y conviene copiarlo: Server Components puros que reciben todo
por props, la página lee y no dibuja, los datos inventados encerrados en
`src/app/demo/`, y toda la lógica que se pueda sacar a `src/lib/` con tests.

TAREA, en este orden:

1. **Los tres widgets deportivos de la portada**, que son lo último que le falta
   a la portada para ser la del boceto: `<BarraEstado />` (último resultado +
   próximo partido + posición en la tabla, arriba del header),
   `<FechaAFecha />` (la franja horizontal de resultados de la temporada) y
   `<Goleadoras />` (top 5). Las queries ya existen —`getUltimoPartido`,
   `getProximoPartido`, `getPosicionAldosivi`, `getPartidosTemporada`,
   `getGoleadoras`— y `<ListaGoleadoras />` de `src/components/temporada/` ya
   resuelve el ranking: fijate si sirve tal cual o si conviene una variante
   corta.

   **Mismo trato que `<TarjetaPlantel />`: componentes puros, con la demo en
   `/demo/portada`, y la portada real NO les pasa datos hasta que la base los
   tenga.** No inventar marcadores en la ruta pública (regla no negociable 1).

2. **Mirar `/demo/nota` y `/demo/planilla` en el navegador a 375 px en los dos
   temas.** Es lo único del sitio que nunca se miró: ahí siguen sin revisarse el
   CSS de listas, `<code>` y `<hr>` del cuerpo, y los iconos de la planilla que
   pasaron a lucide.

**Medí el scroll horizontal en cada página que toques.** Comparando
`document.documentElement.scrollWidth` con `clientWidth` **y** mirando
`document.body.scrollWidth`. En la sesión pasada volvió a aparecer un desborde
de 111px que en la captura no se veía: una utilidad de ancho pasada por
`className` que Tailwind ordenó antes que el `w-full` del componente. Está
contado en "La trampa del ancho que casi se repite".

Verificá en navegador antes de cerrar: hay chromium instalado y
`@playwright/test` en el proyecto. Capturas a 1280 y 375 px en tema claro y
oscuro, y chequeá que cada página tenga **un solo `<h1>`**. Si esperás
hidratación, esperá a que el `<time>` del header tenga texto.

Al terminar, actualizá `HANDOFF.md` y dejá un prompt para el siguiente step.

Ojo con las decisiones que el usuario NO tomó: la fuente mono, el newsletter,
los handles de las redes, y los datos que bloquean `/contacto` y `/privacidad`
—que hoy son **dos links del pie que dan 404 en todas las páginas**—. Están en
"Decisiones que el usuario todavía no tomó".

Si en el medio aparecen las credenciales de Supabase, esto pasa a segundo plano:
con base, el orden es Step 5 (auth + shell del admin), Step 6 (correr la
migración con `--escribir`) y Step 7 (editor de notas).
````

---

---
## Orden sugerido de los próximos steps

Sin credenciales de Supabase se puede avanzar en:

1. ~~`<PlanillaPartido />`~~ ✅
2. ~~`src/lib/tiptap/render.tsx`~~ ✅
3. ~~`scripts/migrate-wp.ts`~~ ✅ (falta correrlo con `--escribir`)
4. ~~`src/lib/social/compose.ts`~~ ✅
5. ~~`scripts/generate-redirects.ts`~~ ✅ (falta correrlo contra el
   `redirects.json` real y confirmar que salen 82 reglas)

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

13. ~~Los tres widgets deportivos de la portada~~ ✅ (miralos en
    `/demo/portada`; en `/` se dibujan solos cuando haya base)
14. ~~Mirar `/demo/nota` y `/demo/planilla` a 375px en los dos temas~~ ✅
    (salieron dos arreglos de la escala de títulos del cuerpo)

**Con eso está cerrado todo lo que el Build Order pone antes del admin.**

Sin credenciales queda:

15. **La suite de Playwright** (`e2e/`), que es la parte del Step 20 que no
    necesita base: sin scroll horizontal, un solo `<h1>`, sin errores de
    consola y los 404 que tienen que dar 404. Hace cinco sesiones que ese
    script se escribe a mano en un temporal y se tira. Es la próxima tarea.
16. **Los dos links rotos del pie**, que es una decisión tuya: pasás los datos
    de `/contacto` y `/privacidad`, o se sacan los links hasta que existan.
17. Confirmar que el OG de `/partido/[slug]` ya sale con el resultado —el
    título que le manda a `/api/og` incluye el marcador— o hacerlo.

Ojo que lo único que le falta al Step 10 son `/contacto` y `/privacidad`, y
están bloqueadas por datos que sólo tiene el autor: el mail del medio, los
handles de las redes, el responsable de datos y si el sitio va a usar analítica.
**Hoy el pie linkea a las dos desde todas las páginas y los dos links dan 404**:
o se escriben, o se sacan los links del pie hasta que existan. Ya son tres
sesiones anotándolo sin resolverlo.

Con credenciales se desbloquean, en orden: Step 5 (auth + shell del admin),
Step 6 (correr la migración con `--escribir`), Step 7 (editor de notas) y el
resto del Build Order.
