# Handoff — Periódico Delfos

Copiá el bloque de "Prompt para la próxima sesión" en un chat nuevo. Está escrito
para que un agente arranque en frío, sin haber visto nada de este proyecto.

Actualizar este archivo al terminar cada step.

---

## Estado al cierre del cambio de paleta a crema

> **LEER PRIMERO.** La sesión anterior invirtió el tema **dos veces** en el
> mismo día: primero a oscuro (rediseño "portal deportivo"), después de vuelta
> a **claro/crema**, que es el estado actual y el definitivo. Si algo de este
> archivo más abajo dice "el tema por omisión es el oscuro", **está viejo**:
> vale esta sección. Lo que sigue vigente del rediseño oscuro es todo lo que no
> es color — la planilla plegable, la línea de tiempo horizontal, el Header
> arreglado, `.titular`/`.meta`/`.tarjeta`/`.franja` y la decisión de no usar
> Barlow Condensed.

**Lo último que se hizo:** el swap de `globals.css` a la paleta crema de los dos
bocetos que trajo el usuario (portada y crónica). `@theme` tiene ahora el tema
claro y el oscuro pasó a `@media (prefers-color-scheme: dark)` — la estructura
original del blueprint. **La paleta oscura no se perdió**: estaba medida a AA
entera y se conservó tal cual como variante.

**No se tocó un solo componente y no hizo falta**, porque están escritos con
utilidades semánticas (`bg-papel`, `text-tinta`, `border-linea`). El sitio
cambió de piel editando un bloque de CSS. Esa es la razón por la que la regla
está en `CLAUDE.md`, y quedó demostrada.

**Verificado después del swap:** `tsc --noEmit` limpio, 256 tests, y `/`,
`/demo/articulo` y `/demo/planilla` respondiendo 200.

**Verificado antes:** `pnpm build` pasa (typecheck limpio, 8 rutas, `/nota/[slug]`
registrada como SSG) y `pnpm test` pasa (**256 tests**). `/demo/articulo`
renderiza el artículo entero en el navegador: 442 KB de HTML con el título, la
bajada, la firma, el tiempo de lectura, la barra de compartir, el cuerpo, la
planilla embebida, la del partido, la caja de autor y las relacionadas. La
migración se corrió entera en seco contra
la REST API real de periodicodelfos.com: 70 notas leídas, 109 imágenes
bajadas, 82 redirecciones. Se auditó el JSON de las 70 notas convertidas y **no
hay un solo nodo ni una sola marca que el renderer no sepa dibujar**.

**No verificado:** nada de la escritura a Supabase (`--escribir`) se ejecutó, no
hay proyecto todavía. Y sigue sin mirarse en un navegador el CSS de listas,
`<code>` y `<hr>` de `/demo/nota` a 375 px en tema claro y oscuro — a lo que
ahora se suman **los iconos de la planilla, que pasaron a lucide** y cambiaron
de dibujo (ver más abajo). `/demo/planilla` a 375 px, en los dos temas.

**Nota de entorno:** esta sesión corrió en una máquina Windows sin `pnpm` ni
`node_modules` instalados y con Node 18.17.1 en el PATH del sistema — por
debajo del `>=22.13` que exige `pnpm@11.1.2` (fijado en `packageManager`).
Se instaló Node 22 portátil en `~/tools/node22` (sin tocar el Node del
sistema) y desde ahí se preparó pnpm 11 vía `corepack prepare pnpm@11.1.2
--activate`. Si una sesión nueva en esta misma máquina ve `pnpm` fallando o
ausente, es por esto — no es un problema del proyecto.

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

1. **El blueprint miente.** La sección 8 se editó en esta misma sesión para
   decir "el tema por omisión es el oscuro", y después se invirtió a crema.
   **Hay que revertir esa sección** con los tokens de `globals.css`, que es la
   fuente de verdad. Lo mismo el bloque resumen de Design System más abajo y la
   sección homónima de `CLAUDE.md`. Esto va primero: si no, el próximo agente
   lee el blueprint y construye en oscuro.
2. ~~Guardar los dos bocetos en `referencia/`.~~ **Hecho.** Están en
   `referencia/boceto-portada.html` y `referencia/boceto-cronica.html`, en
   UTF-8 correcto y verificado. Son la fuente visual de todo lo que sigue:
   comparten tokens entre sí y con `globals.css`.
3. **El chrome:** `Header` (marca con el eje variable + buscador + fecha + nav
   con `aria-current` y el filete amarillo abajo del activo) y `Footer` (fondo
   `negro-cancha`, cuatro columnas, filete amarillo de 6px arriba). Ojo que
   Step 10 pide además arreglar los links rotos del pie.
4. **La página de nota ya existe y funciona** — esto no se construye de cero, se
   le agrega lo que el boceto trae de más: miga de pan, la byline compacta con
   iniciales sobre verde, `figcaption` con epígrafe y crédito, la tira de temas,
   el anterior/siguiente y la tabla de estadísticas del partido. La `.cita` con
   filete amarillo y el `.dato` en mono son del renderer de TipTap.
5. **Step 9, la portada.** La grilla de 3 columnas con la primera ocupando 2 es
   exactamente el "nota principal + últimas 4" que pide el Build Order.

### Decisiones que el usuario todavía no tomó

- **JetBrains Mono vs IBM Plex Mono.** Los bocetos usan JetBrains; el blueprint
  especifica IBM Plex Mono y ya está cargada con `next/font`. No cambiar sin
  preguntar.
- **El newsletter no está en el Build Order** y aparece en los dos bocetos (en
  la portada como sección, en la crónica como widget del aside). Es un backend
  —lista, doble opt-in, proveedor de envío—, no un `<form>`. Decidir si entra
  como step nuevo o si va como maqueta inerte.
- **El ticker de resultados, el widget de próximo partido y la tabla de
  posiciones son Step 19**, no Step 9. Necesitan Supabase con la temporada 2026
  cargada. El Build Order excluye explícitamente `BarraEstado`, `FechaAFecha` y
  `Goleadoras` de la portada "todavía no hay datos deportivos". **No inventar
  datos deportivos para llenarlos**: regla no negociable 1.
- La `.planilla` de los bocetos **no es** `<PlanillaPartido />`: es más parecida
  a `<PlanillaCompacta />`, que ya existe, más una ficha técnica. Y `.planilla`
  ya es una clase con reglas propias en `globals.css`. Cuidado con el choque de
  nombres.

---

## Prompt para la próxima sesión

````
Estoy construyendo Periódico Delfos, un medio digital de Mar del Plata dedicado
al fútbol femenino de Aldosivi (las "Tiburonas"). Lo escribe una sola persona.
Es una migración desde WordPress.

El plan está en `periodico-delfos-blueprint-v2.md` y el estado real en
`HANDOFF.md`. **Leé la sección "Estado al cierre del cambio de paleta a crema"
antes que nada**: el tema se invirtió dos veces en un día y hay partes viejas
más abajo en ese mismo archivo.

Proyecto en `periodico-delfos/`. Next 15.5 App Router + TypeScript strict +
Tailwind v4 + Supabase + TipTap + Inngest. Hoy pasan `tsc --noEmit` y 256 tests,
y `pnpm build` prerenderiza 8 rutas. Mantenelos verdes. **Parar el dev server
antes de buildear**: `next build` reescribe `.next/` y rompe el `next dev` que
esté corriendo.

Sigue sin haber proyecto de Supabase ni `.env.local`, así que la tarea no puede
depender de leer o escribir en la base.

CONTEXTO: se acaba de cambiar la paleta al crema de dos bocetos HTML que trajo
el usuario (portada y crónica). El swap de tokens en `globals.css` ya está hecho
y verificado, y no hizo falta tocar ningún componente porque todos usan
utilidades semánticas. Falta portar el resto.

TAREA, en este orden:

1. Revertir la sección 8 del blueprint —y el bloque resumen de Design System más
   abajo, y el de `CLAUDE.md`— para que reflejen la paleta crema que hoy está en
   `globals.css`. Ahora dicen que el tema por omisión es el oscuro, y es falso.
   Esto va primero porque si no el blueprint desinforma.

2. Guardar los dos bocetos en `referencia/`. Vienen mojibakeados (UTF-8 leído
   como Latin-1) y hay que corregir la codificación.

3. Portar el chrome a los bocetos: `Header` y `Footer`. Sin inventar datos
   deportivos — el ticker de resultados es Step 19 y necesita la base.

Al terminar, actualizá `HANDOFF.md` y dejá un prompt para el siguiente step, que
es la portada (Step 9).

Ojo con tres decisiones que el usuario NO tomó y que no hay que tomar por él:
la fuente mono (JetBrains del boceto vs IBM Plex del blueprint), el newsletter
(no está en el Build Order) y qué hacer con los widgets que necesitan datos.
Están detalladas en HANDOFF.md.
````

---

## Prompt anterior, ya cumplido

````
Estoy construyendo Periódico Delfos, un medio digital de Mar del Plata dedicado
al fútbol femenino de Aldosivi (las "Tiburonas"). Lo escribe una sola persona.
Es una migración desde WordPress.

El plan completo está en `periodico-delfos-blueprint-v2.md` (raíz del repo).
Leelo antes de escribir código: el Build Order es la sección 10 y las reglas no
negociables la 16. El estado actual está en `HANDOFF.md`.

Proyecto en `periodico-delfos/`. Stack: Next 15.5 App Router + TypeScript strict
+ Tailwind v4 + Supabase (Postgres/Auth/Storage/RLS) + TipTap + Inngest.
`pnpm build` y `pnpm test` pasan hoy (256 tests) — mantenelos verdes. **Parar el
dev server antes de buildear:** `next build` reescribe `.next/` y deja al `next
dev` que esté corriendo apuntando a chunks que ya no existen (`Cannot find
module './755.js'`). Si pasa: matar el proceso, borrar `.next` y levantarlo.

Ya están hechos los steps 1 a 10 de la tabla de este archivo: scaffolding, las 9
migraciones SQL, los tipos de dominio, los clientes y queries de Supabase, el
design system, `<PlanillaPartido />` con sus tres variantes (mirala en
`/demo/planilla`), el renderer de TipTap JSON a React (`/demo/nota`), la
migración desde WordPress (`src/lib/migracion/` + `scripts/migrate-wp.ts`), el
copy de las tres redes (`src/lib/social/`), `scripts/generate-redirects.ts`
(`redirects.json` → `vercel.json`) y **la página de nota completa —Step 8 del
Build Order— que se mira en `/demo/articulo`**.

**BLOQUEO ACTUAL — leer antes de elegir tarea:** sigue sin haber proyecto de
Supabase ni `.env.local`. Casi todo lo que queda del Build Order depende de
eso para poder verificarse de verdad, no sólo compilar:

- Step 5 (auth + shell del admin) necesita un proyecto real para que el login
  autentique algo.
- Step 7 (editor de notas, "crear nueva nota") necesita dónde guardar. Ya se le
  preguntó al usuario si construirlo igual con un mock sin Supabase y dijo que
  no — prefiere seguir el orden del blueprint. No reabrir esa pregunta sin que
  la pidan. Lo que sí quedó listo para cuando se escriba: el **contrato de
  atributos** de los dos nodos propios (ver "El renderer, en detalle") y todo
  el lado de lectura, que ya dibuja lo que el editor produzca.
- `scripts/migrate-wp.ts --escribir` está implementado pero nunca corrió.
- `scripts/generate-redirects.ts` está hecho y probado con fixtures chicos,
  pero no corrió contra el `redirects.json` real (no existe en esta máquina:
  `.migracion-wp/` está gitignoreado).

TAREA sugerida: si el usuario puede crear el proyecto de Supabase y pegar las
credenciales en `.env.local` (sección 11 del blueprint), ese es el desbloqueo
de mayor impacto — habilita Step 2 (verificar RLS), Step 5, Step 6 real y todo
lo que sigue. Con eso, `/nota/[slug]` pasa de 500 a servir notas de verdad sin
tocar una línea: ya está escrita y prerenderiza sola.

Si todavía no, lo que queda sin credenciales es UI contra datos falsos, con el
mismo patrón que se usó para la página de nota (componente puro + página de
demo): la portada `/` (Step 9, sin BarraEstado/FechaAFecha/Goleadoras, que
necesitan datos), los listados `/cronicas` y `/analisis`, o `/partido/[slug]`.
También está pendiente el arreglo del `<Header>` en tema oscuro (ver "Cosas
menores"). Preguntar cuál antes de asumir una.

Al terminar lo que sea que se haga, actualizá `HANDOFF.md` con el nuevo estado
y un prompt para el siguiente step.
````

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

Con eso se terminó la lista de lógica pura. Sin credenciales queda trabajo de
UI con el patrón "componente puro + página de demo" que estrenó la página de
nota: la portada `/` (Step 9), los listados `/cronicas` y `/analisis`,
`/partido/[slug]` y `/temporada/[slug]`. Y el `<Header>` en tema oscuro, que
hoy es casi invisible (ver "Cosas menores").

Con credenciales se desbloquean, en orden: Step 5 (auth + shell del admin),
Step 6 (correr la migración con `--escribir`), Step 7 (editor de notas) y el
resto del Build Order.
