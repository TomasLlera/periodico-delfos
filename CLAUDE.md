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
- `src/components/` — layout, content, partido, temporada, jugadora, admin, ui
- `src/lib/` — supabase/, tiptap/, social/, inngest/, seo.ts, formato.ts
- `src/actions/` — Server Actions (publicar, eventos)
- `supabase/migrations/` — Schema completo, 0001–0009
- `scripts/` — migrate-wp.ts, generate-redirects.ts

### Data Flow

Lectura: Server Components → Supabase (ISR 60s). Publicación: un Server Action actualiza
`notas`, revalida las rutas y emite `nota/publicada` a Inngest; la función durable hace
fan-out a FB/IG/X con reintentos e idempotencia vía `social_posts`. Nada de posteo inline
en el request.

### Key Patterns

- Server Components por defecto. `"use client"` sólo en BotonesCompartir, buscador y /admin.
- Todas las queries en `lib/supabase/queries/*`. Nunca inline en un componente.
- Todo posteo pasa por `lib/social/*` y se registra en `social_posts` (un row por red por nota).
- Idempotencia: chequear `social_posts (nota_id, platform)` antes de postear.
- `SUPABASE_SERVICE_ROLE_KEY` y tokens de redes: SOLO server (`lib/supabase/admin.ts`).

## Code Organization Rules

1. Un componente por archivo. Máx 300 líneas; si crece, extraer subcomponentes.
2. Path alias `@/` para `src/`.
3. Sin barrel exports; importar del archivo fuente.
4. Componentes específicos de una página, junto a su page.
5. **Los iconos salen de `lucide-react`.** Nada de SVG dibujado a mano salvo que
   lucide no tenga el glifo — hoy la única excepción es la pelota de fútbol, que
   no existe en la biblioteca (ver `IconoEvento.tsx`). Colorearlos con las
   utilidades del tema (`stroke-roja`, `fill-amarillo`), no con atributos SVG:
   la clase le gana al atributo y el token se redefine solo en tema oscuro.

## Design System

**El tema por omisión es el oscuro** (dirección "portal deportivo", ver
`referencia/estilo-prueba.html`). El claro existe como variante en
`@media (prefers-color-scheme: light)`. Los valores viven en `@theme` de
`globals.css`; los componentes usan siempre las utilidades semánticas
(`bg-papel`, `text-tinta`, `border-linea`) y nunca un color fijo, que es lo que
permite revestir el sitio entero cambiando sólo los tokens.

- Oscuro: Papel `#111418` · Tarjeta `#1E2228` · Negro cancha `#0B0D0F`
  · Verde 600 `#00A859` · Amarillo `#F5A623` · Tinta `#F9FAFB` · Gris `#9CA3AF`
  · Línea `#2A303A` · Roja `#EF4444`
- Claro: Papel `#FFFFFF` · Verde 600 `#0F7A3D` · Amarillo `#E08C00`
  · Tinta `#111614` · Gris `#5B6560` · Línea `#DDE2DE` · Roja `#C42127`
- Titulares: Archivo · Cuerpo: Source Serif 4 · Datos: IBM Plex Mono
- **`.titular`** es el titular deportivo: caja alta, tracking −0.02em, peso 800.
  La fuente sigue siendo Archivo: el mockup usaba Barlow Condensed y se
  descartó por la misma razón que el blueprint descartó Oswald.
- `.meta` son las badges (13px, 700, uppercase, 0.08em). `.tarjeta` y `.franja`
  son los dos fondos del rediseño.
- Cuerpo 18/19px, line-height 1.7, **máx 68ch** (clase `.prose-nota`). **El
  rediseño no toca el cuerpo de la nota**: entra en chrome, portada, listados y
  componentes.
- Radius 2–4px (tarjetas 8px). Espaciado base 4px. Mobile-first a 375px. Áreas
  táctiles 44px (clase `.tactil`)
- Todo color nuevo se verifica a AA antes de entrar: del mockup ya se corrigieron
  el gris tenue (3.8:1 → 5.3:1) y el amarillo como texto sobre tarjeta clara
  (2.6:1 → se usa verde).

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
