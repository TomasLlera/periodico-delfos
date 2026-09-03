# Handoff — Periódico Delfos

Copiá el bloque de "Prompt para la próxima sesión" en un chat nuevo. Está escrito
para que un agente arranque en frío, sin haber visto nada de este proyecto.

Actualizar este archivo al terminar cada step.

---

## Estado al cierre del copy de redes

**Verificado:** `pnpm build` pasa (typecheck limpio, prerenderiza 7 rutas) y
`pnpm test` pasa (**241 tests**, 61 nuevos). La migración se corrió entera en
seco contra la REST API real de periodicodelfos.com: 70 notas leídas, 109
imágenes bajadas, 82 redirecciones. Se auditó el JSON de las 70 notas
convertidas y **no hay un solo nodo ni una sola marca que el renderer no sepa
dibujar**.

**No verificado:** nada de la escritura a Supabase (`--escribir`) se ejecutó, no
hay proyecto todavía. Y sigue sin mirarse en un navegador el CSS de listas,
`<code>` y `<hr>` de `/demo/nota` a 375 px en tema claro y oscuro — a lo que
ahora se suman **los iconos de la planilla, que pasaron a lucide** y cambiaron
de dibujo (ver más abajo). `/demo/planilla` a 375 px, en los dos temas.

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

- **`scripts/generate-redirects.ts`** — consume `redirects.json` y escribe
  `vercel.json`. Las claves de salida son `origen`/`destino`/`permanente` y hay
  que traducirlas a `source`/`destination`/`permanent`.
- **Vincular cada nota con su partido** (`notas.partido_id`). Necesita los
  partidos cargados a mano; el informe ya trae la tabla slug → temporada → fecha.
- **Escribir de verdad.** `--escribir` está implementado y typechequeado, pero
  nunca se ejecutó porque no hay proyecto de Supabase.

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

- `Header.tsx` usa `text-[var(--color-verde-900)]` para el logo. `--color-verde-900`
  no se redefine en modo oscuro, así que en tema oscuro queda casi invisible
  (~1.3:1). Arreglar cuando se toque el header.
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

## Prompt para la próxima sesión

````
Estoy construyendo Periódico Delfos, un medio digital de Mar del Plata dedicado
al fútbol femenino de Aldosivi (las "Tiburonas"). Lo escribe una sola persona.
Es una migración desde WordPress.

El plan completo está en `periodico-delfos-blueprint-v2.md` (raíz del repo).
Leelo antes de escribir código: el Build Order es la sección 10 y las reglas no
negociables la 16. El estado actual está en `HANDOFF.md`.

Proyecto en `periodico-delfos/`. Stack: Next 15.5 App Router + TypeScript strict
+ Tailwind v4 + Supabase (Postgres/Auth/Storage/RLS) + TipTap + Inngest.
`pnpm build` y `pnpm test` pasan hoy (180 tests) — mantenelos verdes.

Ya están hechos los steps 1 a 8: scaffolding, las 9 migraciones SQL, los tipos
de dominio, los clientes y queries de Supabase, el design system,
`<PlanillaPartido />` con sus tres variantes (mirala en `/demo/planilla`), el
renderer de TipTap JSON a React (`/demo/nota`), la migración desde WordPress
(`src/lib/migracion/` + `scripts/migrate-wp.ts`), que ya corrió en seco contra
la API real: 70 notas, 109 imágenes, 82 redirecciones, todo en `.migracion-wp/`,
y el copy de las tres redes (`src/lib/social/`).

Sigue sin haber proyecto de Supabase ni `.env.local`, así que la tarea no puede
depender de leer o escribir en la base.

TAREA: escribir `scripts/generate-redirects.ts`, que convierte las
redirecciones que ya emitió la migración en el `vercel.json` del proyecto.

Regla no negociable 8: toda URL vieja de WordPress redirige 301, no se rompe un
solo link. Las 82 redirecciones ya están calculadas y auditadas; falta que
Vercel las lea.

La entrada es `.migracion-wp/redirects.json`, que **no es un array**: es
`{ generado, origen, redirecciones: Redireccion[] }` — ojo que el `origen` de
arriba de todo es la URL del sitio viejo y no tiene nada que ver con el `origen`
de cada redirección, que es un path. El tipo `Redireccion` está en
`src/lib/migracion/tipos.ts`:

    { origen: '/slug-viejo/', destino: '/nota/slug', permanente: true }

y en `vercel.json` va como:

    { "source": "/slug-viejo/", "destination": "/nota/slug", "permanent": true }

Requisitos:
- **La lógica pura va en `src/lib/migracion/vercel.ts` con sus tests**, y el
  script es sólo el envoltorio que lee y escribe archivos. Es la misma razón que
  el resto de la migración: `vitest.config.mts` únicamente levanta
  `src/**/*.test.ts`.
- **No pisar el `vercel.json` que ya exista.** Hay que leerlo, reemplazar la
  clave `redirects` y dejar el resto intacto. Hoy no existe, pero el día que
  tenga `headers` o `rewrites` este script no puede borrarlos.
- **Ojo con la barra final.** Los `origen` vienen de WordPress con `/` al final
  (`/mi-nota/`) y los `destino` sin ella. Vercel matchea `source` literal:
  decidir si hace falta emitir las dos formas o si alcanza con `trailingSlash`,
  y dejar escrito por qué.
- Chequear que no haya dos reglas con el mismo `source` y que ninguna redirija a
  sí misma: un loop de 301 saca la página de Google.
- Un `--ayuda` y una corrida que no escriba nada, como `migrate-wp.ts`.

Correr `pnpm tsx scripts/generate-redirects.ts` contra el `redirects.json` real
que ya está en `.migracion-wp/` y contar cuántas reglas salieron: tienen que ser
82 (70 notas + 8 categorías + 1 autor + 3 fijas).

Al terminar, actualizá `HANDOFF.md` con el nuevo estado y un prompt para el
siguiente step.
````

---

## Orden sugerido de los próximos steps

Sin credenciales de Supabase se puede avanzar en:

1. ~~`<PlanillaPartido />`~~ ✅
2. ~~`src/lib/tiptap/render.tsx`~~ ✅
3. ~~`scripts/migrate-wp.ts`~~ ✅ (falta correrlo con `--escribir`)
4. ~~`src/lib/social/compose.ts`~~ ✅
5. `scripts/generate-redirects.ts` — el prompt de arriba.

Después de eso, sin credenciales sólo queda trabajo de UI: las páginas públicas
(`/`, `/nota/[slug]`, `/temporada/[slug]`) contra datos falsos, o el `<Header>`
en tema oscuro, que hoy es casi invisible (ver "Cosas menores").

Con credenciales se desbloquean, en orden: Step 5 (auth + shell del admin),
Step 6 (correr la migración con `--escribir`), Step 7 (editor de notas) y el
resto del Build Order.
