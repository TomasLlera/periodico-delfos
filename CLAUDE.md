# Periódico Delfos

Medio digital de Mar del Plata dedicado al fútbol femenino de Aldosivi. Un solo autor
(Charlie Redondo). Migración desde WordPress. El corazón del proyecto es estructurar los
datos del partido — goles, formaciones, tarjetas, goleadoras — para que dejen de escribirse
a mano dentro del texto de las notas. Al publicar, cada nota se auto-postea a Facebook,
Instagram y X.

El plan completo está en `../periodico-delfos-blueprint-v2.md`. El Build Order es la
sección 10.

## Commands

- `pnpm dev` — Desarrollo
- `pnpm build` / `pnpm lint`
- `npx inngest-cli dev` — Auto-posting local (terminal aparte)
- `pnpm dlx supabase db push` — Aplicar migraciones
- `pnpm dlx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts`

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

- Verde 900 `#0A3F24` · Verde 600 `#0F7A3D` · Verde 100 `#E4F1E9` · Amarillo `#FFC72C`
- Tinta `#111614` · Gris `#5B6560` · Papel `#FFFFFF` / `#F4F6F4` · Línea `#DDE2DE` · Roja `#C42127`
- Titulares: Archivo · Cuerpo: Source Serif 4 · Datos: IBM Plex Mono
- Cuerpo 18/19px, line-height 1.7, **máx 68ch** (clase `.prose-nota`)
- Radius 2–4px. Espaciado base 4px. Mobile-first a 375px. Áreas táctiles 44px (clase `.tactil`)

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
