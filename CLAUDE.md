# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Periódico Delfos

Medio digital de Mar del Plata dedicado al fútbol femenino de Aldosivi. Un solo autor
(Charlie Redondo). Migración desde WordPress. El corazón del proyecto es estructurar los
datos del partido — goles, formaciones, tarjetas, goleadoras — para que dejen de escribirse
a mano dentro del texto de las notas. Al publicar, cada nota se auto-postea a Facebook,
Instagram y X.

El plan completo está en `periodico-delfos-blueprint-v2.md`. El Build Order es la
sección 10. El estado real del build (qué está hecho, qué decisiones no hay que
volver a discutir, cuál es la próxima tarea) está en `HANDOFF.md` — leerlo antes
de asumir que algo de la Architecture de abajo ya existe: es la estructura
objetivo del blueprint, no necesariamente lo que hay hoy en `src/`.

## Commands

- `pnpm dev` — Desarrollo
- `pnpm build` / `pnpm lint` / `pnpm test`
- `pnpm test:watch` — Vitest en modo watch
- `npx vitest run ruta/al/archivo.test.ts` — Un solo archivo de test
- `npx inngest-cli dev` — Auto-posting local (terminal aparte)
- `pnpm test:e2e` — Suite de navegador. Los tests del panel necesitan el
  usuario de prueba: `pnpm tsx scripts/usuario-e2e.ts --crear` una vez.
- `pnpm dlx supabase db push` — Aplicar migraciones
- `pnpm dlx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts`

> `eslint.config.mjs` está roto (quedó de un scaffolding de Next 16, importa
> `eslint-config-next/core-web-vitals` sin extensión) — `pnpm lint` falla. No
> afecta a `pnpm build`. Ver `HANDOFF.md` § "Pendiente manual" antes de tocarlo.

## Tech Stack

Next.js 15 (App Router) + TypeScript strict + Tailwind v4 + shadcn/ui + Supabase
(Postgres/Auth/Storage/RLS) + TipTap + Inngest + Meta Graph API & X API v2 + Vercel.

> Next está fijado en 15 a propósito. Next 16 cambia APIs y convenciones respecto de lo
> que este proyecto asume; no subir de versión sin revisar el blueprint.

## Architecture

- `src/app/` — Rutas públicas + `/admin`
- `src/components/` — layout, content, portada, listado, partido, temporada, plantel,
  jugadora, y más adelante admin y ui
- `src/lib/` — supabase/, tiptap/, social/, inngest/, seo.ts, formato.ts,
  clima.ts, y la lógica pura de cada página con sus tests: partido.ts,
  temporada.ts, plantel.ts, jugadora.ts, busqueda.ts, paginacion.ts
- `src/actions/` — Server Actions (publicar, eventos)
- `supabase/migrations/` — Schema completo, 0001–0009
- `scripts/` — migrate-wp.ts, generate-redirects.ts, usuario-e2e.ts

### Data Flow

Lectura: Server Components → Supabase (ISR 60s). Publicación: un Server Action actualiza
`notas`, revalida las rutas y emite `nota/publicada` a Inngest; la función durable hace
fan-out a FB/IG/X con reintentos e idempotencia vía `social_posts`. Nada de posteo inline
en el request.

### Key Patterns

- Server Components por defecto. `"use client"` sólo en `BotonesCompartir`,
  `PlanillaPartido` (es plegable), `NavPrincipal` (necesita la ruta actual para
  `aria-current`) y `FechaDeHoy` (la portada se prerenderiza y la fecha se
  congelaría en el build) y `Ventana` (`<dialog>` nativo: `showModal()` es lo
  que da trampa de foco, Escape y foco restaurado sin escribirlos), más todo
  `/admin` cuando exista. **El buscador no es
  cliente**: es un `<form method="get">` que anda sin JS.
- Todas las queries en `lib/supabase/queries/*`. Nunca inline en un componente.
- Todo posteo pasa por `lib/social/*` y se registra en `social_posts` (un row por red por nota).
- Idempotencia: chequear `social_posts (nota_id, platform)` antes de postear.
- `SUPABASE_SERVICE_ROLE_KEY` y tokens de redes: SOLO server (`lib/supabase/admin.ts`).

## Code Organization Rules

1. Un componente por archivo. Máx 300 líneas; si crece, extraer subcomponentes.
2. Path alias `@/` para `src/`.
3. Sin barrel exports; importar del archivo fuente.
4. Componentes específicos de una página, junto a su page.
5. **Todo contenedor con `overflow-x-auto` que adentro tenga un `.sr-only` va
   con `relative`.** `.sr-only` es `position: absolute` y sin ancestro
   posicionado se mide contra el documento: el scroll no lo contiene y la
   página entera se estira sin que se note en una captura. Es la tercera cara
   del mismo bug de scroll horizontal; medirlo con
   `documentElement.scrollWidth` **y** `body.scrollWidth`.
6. **Los iconos salen de `lucide-react`.** Nada de SVG dibujado a mano salvo que
   lucide no tenga el glifo — hoy la única excepción es la pelota de fútbol, que
   no existe en la biblioteca (ver `IconoEvento.tsx`). Colorearlos con las
   utilidades del tema (`stroke-roja`, `fill-amarillo`), no con atributos SVG:
   la clase le gana al atributo y el token se redefine solo en tema oscuro.

## Design System

**El tema por omisión es el claro**: el crema de los dos bocetos que trajo el
usuario, guardados en `referencia/boceto-portada.html` y
`referencia/boceto-cronica.html`. El oscuro existe como variante en
`@media (prefers-color-scheme: dark)` y está medido a AA entero. Los valores
viven en `@theme` de `globals.css`; los componentes usan siempre las utilidades
semánticas (`bg-papel`, `text-tinta`, `border-linea`) y nunca un color fijo, que
es lo que permite revestir el sitio entero cambiando sólo los tokens — quedó
demostrado al invertir el tema sin tocar un solo componente.

- Claro: Papel `#F6F3EA` · Papel alt `#EFEBDF` · Tarjeta `#FFFFFF`
  · Verde 900 `#0F3B2A` · Verde 600 `#1C5A3E` · Negro cancha `#092619`
  · Amarillo `#F2A900` · Tinta `#111511` · Gris `#5F645E` · Línea `#DDD8CB`
  · Roja `#C42127`
- Oscuro: Papel `#111418` · Tarjeta `#1E2228` · Verde 900 `#102A1E`
  · Verde 600 `#00A859` · Negro cancha `#0B0D0F` · Amarillo `#F5A623`
  · Tinta `#F9FAFB` · Gris `#9CA3AF` · Línea `#2A303A` · Roja `#EF4444`
- **`verde-900` es una superficie, no un acento**: es el bloque verde de la
  cabecera, la tapa y el aside. Lleva texto blanco en los dos temas.
- Titulares: Archivo · Cuerpo: Source Serif 4 · Datos: IBM Plex Mono.
  Los bocetos usan JetBrains Mono para los datos; **la decisión no está tomada**
  y hasta que lo esté vale IBM Plex, que es la del blueprint y la que está
  cargada con `next/font`.
- **`.marca`** es la marca del sitio: Archivo 900 con `font-variation-settings:
  'wdth' 110` —el eje expandido del blueprint— en caja mixta.
- **`.titular`** es el titular deportivo: caja alta, tracking −0.02em, peso 800.
  La fuente sigue siendo Archivo: el mockup oscuro usaba Barlow Condensed y se
  descartó por la misma razón que el blueprint descartó Oswald.
- `.meta` son las badges (13px, 700, uppercase, 0.08em). `.tarjeta` y `.franja`
  son los dos fondos heredados del rediseño.
- Cuerpo 18/19px, line-height 1.7, **máx 68ch** (clase `.prose-nota`). **El
  rediseño no toca el cuerpo de la nota**: entra en chrome, portada, listados y
  componentes.
- **Los títulos del cuerpo siempre miden más que el cuerpo**: `h2` 22/28px con
  filete verde, `h3` 20/22px, y `h4` como volanta (caja alta, 0.95rem). El `h3`
  medía 18px —menos que el cuerpo en desktop— hasta que se miró `/demo/nota`.
- Radius 2–4px (tarjetas 8px). Espaciado base 4px. Mobile-first a 375px. Áreas
  táctiles 44px (clase `.tactil`)
- **Todo color nuevo se verifica a AA antes de entrar**, con la fórmula de WCAG
  y no a ojo. La única excepción a "nunca un color fijo" es el texto sobre los
  bloques verdes, que va en blanco con alfa (`text-white/70`): esa superficie es
  oscura en los dos temas, así que el blanco no depende del tema sino del fondo.

## Reglas No Negociables

1. TypeScript strict, prohibido `any`.
2. Ningún dato deportivo se escribe a mano dentro del texto de una nota. Va a la base.
3. La medida de lectura de las notas es 68ch. No negociable — es el arreglo de mayor impacto.
4. `alt` de imagen es requerido, validado con Zod y con CHECK en la base.
5. Todo posteo a redes es idempotente vía `social_posts (nota_id, platform)`.
6. Instagram exige `image_url` HTTPS pública → siempre URL del bucket, nunca un blob local.
7. Secrets sólo server-side. RLS habilitado en todas las tablas.
8. Toda URL vieja de WordPress redirige 301. No romper links.
9. Todo string en español, `lang="es-AR"`.
10. No commitear `.env*`.
