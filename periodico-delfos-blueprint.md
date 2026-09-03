# Periódico Delfos — Blueprint

> Generado por The Architect el 2026-08-07
> Arquetipo: Content Platform / CMS
> Dominio: periodicodelfos.com

---

## 1. Project Overview

### Vision
**Periódico Delfos** es un diario digital estilo periódico clásico: portada con nota principal, secciones temáticas (Política, Economía, Deportes, Cultura, etc.) y buscador. Dos editores redactan, editan y publican las notas 100% a mano desde un panel de redacción. La lectura es libre y abierta, con la arquitectura preparada para incorporar un muro de suscripción en una segunda fase.

La pieza diferencial es la **auto-publicación en redes sociales**: al publicar una nota, el sistema la reparte automáticamente a Facebook, Instagram y X (Twitter), con reintentos y registro de estado por red. El objetivo es que la redacción publique una sola vez y la distribución en redes ocurra sola, sin intervención manual.

### Goals
- Portada + secciones + buscador con experiencia de lectura impecable y SEO de primer nivel.
- Panel de redacción simple y pulido para 2 editores (borrador → publicado).
- Auto-posting confiable a Facebook, Instagram y X al publicar cada nota.
- Base técnica lista para activar suscripciones (paywall) sin reescribir el core.

### Success Metrics
- Time-to-publish: de "publicar" a "visible en el sitio + posteado en las 3 redes" en < 60s.
- Tasa de éxito de auto-posting ≥ 99% (con reintentos automáticos).
- Core Web Vitals en verde (LCP < 2.5s) en portada y notas.
- Cero pasos manuales de distribución tras publicar.

---

## 2. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 15 (App Router) | SSR/ISR para SEO de noticias y carga instantánea; ecosistema maduro para content |
| Language | TypeScript (strict) | Seguridad de tipos en todo el pipeline de contenido y posteo |
| Styling | Tailwind CSS v4 | Sistema de diseño editorial rápido y consistente |
| Components | shadcn/ui | Primitivas accesibles listas (nav, dialog, inputs del buscador) |
| CMS / Editor | Sanity Studio v3 | Editor de redacción pulido, Portable Text, media, borrador→publicado, webhook de publish nativo |
| Content CDN | Sanity Image CDN | Sirve URLs HTTPS públicas (requisito de Instagram) + transformaciones on-the-fly |
| Database | Supabase (Postgres) | Registro de estado de posteos por red + esquema de suscriptores listo a futuro |
| Jobs / Auto-posting | Inngest | Funciones durables con reintentos y fan-out a 3 redes; observabilidad de cada intento |
| Social APIs | Meta Graph API (FB + IG) + X API v2 | Una integración Meta cubre Facebook e Instagram; X aparte con API v2 |
| Search | GROQ (Sanity) en MVP → Algolia si escala | No pagar búsqueda hasta que el volumen lo justifique |
| Auth (editores) | Sanity Studio (login propio) | Los 2 editores entran al Studio; no requiere auth adicional en MVP |
| Auth (lectores, futuro) | Clerk + Stripe | Suscripción/paywall en fase 2; seam ya previsto |
| Hosting | Vercel | Deploy nativo de Next.js, ISR, preview deploys, dominio + SSL automáticos |
| Package Manager | pnpm | Rápido y eficiente en disco |

---

## 3. Directory Structure

```
periodico-delfos/
  src/
    app/
      layout.tsx                     # Root layout: masthead header + footer, fuentes
      page.tsx                       # Portada: nota principal + grilla destacada + últimas por sección
      globals.css                    # Tailwind v4 + tokens de diseño (CSS variables)
      [section]/
        page.tsx                     # Listado de sección con paginación (ISR)
      [section]/[slug]/
        page.tsx                     # Nota completa (ISR) — Portable Text, autor, compartir, SEO
      autores/
        [slug]/page.tsx              # Perfil de autor + sus notas
      buscar/
        page.tsx                     # Página de resultados de búsqueda
      sitemap.ts                     # Sitemap dinámico con todas las notas
      robots.ts                      # robots.txt
      rss.xml/route.ts               # Feed RSS
      api/
        search/route.ts              # Endpoint de búsqueda (GROQ)
        og/route.tsx                 # Generación dinámica de imágenes OG (@vercel/og)
        inngest/route.ts             # Endpoint que hostea las funciones Inngest
        webhooks/
          sanity/route.ts            # Recibe webhook de publish de Sanity → dispara evento Inngest
    components/
      ui/                            # Primitivas shadcn/ui
      layout/
        Masthead.tsx                 # Cabecera con logo/fecha del diario
        SectionNav.tsx               # Navegación de secciones
        Footer.tsx
      content/
        LeadStory.tsx                # Nota principal de portada
        ArticleCard.tsx              # Card de nota en listados
        ArticleBody.tsx              # Renderer de Portable Text con componentes custom
        FeaturedImage.tsx            # Imagen destacada con caption (next/image + Sanity)
        Kicker.tsx                   # Volanta/antetítulo
        AuthorBio.tsx                # Bio de autor al pie de la nota
        ShareButtons.tsx             # Botones de compartir (FB, X, WhatsApp, copiar link)
        RelatedArticles.tsx
      search/
        SearchBox.tsx                # Input de búsqueda (client)
        SearchResults.tsx
    lib/
      sanity/
        client.ts                    # Cliente Sanity (read)
        image.ts                     # urlFor() con @sanity/image-url
        queries.ts                   # GROQ queries centralizadas
        portable-text.tsx            # Componentes del renderer de Portable Text
      supabase/
        client.ts                    # Cliente server (service role) para social_posts
        types.ts                     # Tipos generados de la DB
      social/
        facebook.ts                  # postToFacebook()
        instagram.ts                 # postToInstagram()
        x.ts                         # postToX()
        compose.ts                   # Arma el copy del posteo desde la nota
      inngest/
        client.ts                    # Cliente Inngest
        functions/
          article-published.ts       # Función durable: fan-out a las 3 redes + revalidate
      seo.ts                         # Helpers de metadata + JSON-LD Article
      utils.ts
    types/
      content.ts                     # Tipos de Article, Category, Author
      index.ts
  sanity/                            # Sanity Studio (embebido o standalone)
    schemas/
      article.ts
      category.ts
      author.ts
      blockContent.ts                # Definición de Portable Text
      index.ts
    sanity.config.ts
  supabase/
    migrations/
      0001_social_posts.sql
      0002_subscribers.sql           # Esquema futuro (suscripción)
  tests/
    e2e/
      homepage.spec.ts
      article.spec.ts
      search.spec.ts
  .env.example
  next.config.ts
  tailwind.config.ts                 # (o config vía CSS en v4)
  playwright.config.ts
  CLAUDE.md
```

---

## 4. Data Model

### Sanity (contenido editorial)

**article (nota)**
| Field | Type | Notes |
|-------|------|-------|
| title | string | Título de la nota (obligatorio) |
| slug | slug | Generado del título; base de la URL |
| kicker | string | Volanta / antetítulo (opcional) |
| excerpt | text | Bajada / copete (usado en cards, meta description y copy de redes) |
| featuredImage | image | Con `alt` y `caption` obligatorios; fuente de la imagen en redes |
| body | array (Portable Text) | Cuerpo de la nota |
| section | reference → category | Sección a la que pertenece (obligatorio) |
| authors | array → author | Uno o más autores |
| tags | array<string> | Etiquetas para búsqueda/relacionadas |
| isBreaking | boolean | Marca "Última hora" en portada |
| publishedAt | datetime | Fecha/hora de publicación |
| socialAutoPost | boolean | Default `true`; si `false`, NO se auto-postea |
| socialPlatforms | array<string> | Redes destino: `["facebook","instagram","x"]` (default las 3) |
| seo | object | `metaTitle`, `metaDescription`, `ogImage` (opcionales; fallback a title/excerpt/featuredImage) |

**category (sección)**
| Field | Type | Notes |
|-------|------|-------|
| title | string | Ej. "Política" |
| slug | slug | Base de la URL de sección |
| description | text | Para SEO de la página de sección |
| order | number | Orden en la nav |
| color | string (hex) | Acento opcional por sección |

**author (autor)**
| Field | Type | Notes |
|-------|------|-------|
| name | string | Nombre del autor |
| slug | slug | URL del perfil |
| role | string | Ej. "Editor", "Redactor" |
| bio | text | Biografía |
| avatar | image | Foto |

### Supabase (estado operativo + futuro)

**social_posts** — registro de cada intento de posteo por red
| Field | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| article_id | text | ID del documento Sanity |
| article_slug | text | Para armar la URL canónica |
| platform | text | `facebook` \| `instagram` \| `x` |
| status | text | `pending` \| `processing` \| `success` \| `failed` |
| external_post_id | text | ID devuelto por la red (nullable) |
| external_url | text | URL pública del posteo (nullable) |
| error_message | text | Último error si falló (nullable) |
| attempts | int | Contador de intentos |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | |

Índice único: `(article_id, platform)` — evita postear dos veces la misma nota en la misma red (idempotencia).

**subscribers** *(esquema futuro — crear ahora, usar en fase 2)*
| Field | Type | Notes |
|-------|------|-------|
| id | uuid PK | |
| email | text unique | |
| clerk_user_id | text | nullable hasta activar Clerk |
| plan | text | `free` \| `premium` |
| status | text | `active` \| `canceled` |
| created_at | timestamptz | |

### Relationships
- `article` → `category` (many-to-one).
- `article` → `author` (many-to-many vía array de references).
- `social_posts` → `article` (many-to-one, por `article_id`); un registro por red por nota.

### Database Schema (Supabase / SQL)
```sql
-- 0001_social_posts.sql
create type social_platform as enum ('facebook', 'instagram', 'x');
create type social_status as enum ('pending', 'processing', 'success', 'failed');

create table social_posts (
  id uuid primary key default gen_random_uuid(),
  article_id text not null,
  article_slug text not null,
  platform social_platform not null,
  status social_status not null default 'pending',
  external_post_id text,
  external_url text,
  error_message text,
  attempts int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (article_id, platform)
);
create index social_posts_status_idx on social_posts (status);

-- 0002_subscribers.sql  (futuro)
create table subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  clerk_user_id text,
  plan text not null default 'free',
  status text not null default 'active',
  created_at timestamptz not null default now()
);
```

---

## 5. API Design

### Routes Overview
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/webhooks/sanity` | Recibe el webhook de publish de Sanity, valida la firma HMAC y dispara el evento Inngest `article/published` | Firma HMAC (`SANITY_WEBHOOK_SECRET`) |
| GET/PUT/POST | `/api/inngest` | Endpoint que Inngest usa para registrar y ejecutar las funciones durables | Firma Inngest |
| GET | `/api/search?q=` | Búsqueda full-text sobre notas publicadas (GROQ) | Público |
| GET | `/api/og?slug=` | Genera imagen Open Graph dinámica por nota (`@vercel/og`) | Público |

> El sitio es mayormente Server Components leyendo Sanity directo (sin API intermedia). Solo existen endpoints para: recibir el webhook, hostear Inngest, buscar y generar OG.

### Key Endpoints Detail

**POST `/api/webhooks/sanity`**
- Configurado en Sanity como webhook que dispara **solo** cuando un `article` pasa a estado publicado (`_type == "article" && !(_id in path("drafts.**"))`).
- Valida el header `sanity-webhook-signature` con `SANITY_WEBHOOK_SECRET` (HMAC SHA-256). Si falla → `401`.
- Body incluye `_id` y `slug`. Envía a Inngest el evento `article/published` con `{ articleId, slug }`.
- Responde `200` de inmediato (el trabajo pesado corre asíncrono en Inngest). Nunca postea inline.

**Inngest function `article/published`** (no es HTTP directo; se dispara por evento)
1. `step.run("fetch-article")` — trae la nota completa de Sanity (título, excerpt, URL absoluta de `featuredImage`, slug de sección).
2. Determina las redes destino desde `article.socialPlatforms` (default las 3) y `article.socialAutoPost`.
3. Para cada red, en paralelo con reintentos automáticos:
   - `step.run("post-facebook")` → `postToFacebook()` → upsert en `social_posts` con status.
   - `step.run("post-instagram")` → `postToInstagram()` (2 pasos: crear media container + publish).
   - `step.run("post-x")` → `postToX()` (upload media v1.1 + POST /2/tweets v2).
   - Idempotencia: antes de postear, chequea `social_posts (article_id, platform)`; si ya está `success`, skip.
4. `step.run("revalidate")` — revalida `/`, `/[section]` y `/[section]/[slug]` (ISR on-demand).
- Reintentos: Inngest reintenta cada `step.run` fallido con backoff exponencial (config: 4 reintentos). El estado final (`success`/`failed`) queda en `social_posts`.

**GET `/api/search?q=`**
- Ejecuta GROQ: busca `q` en `title`, `excerpt`, `tags[]` de notas publicadas. Devuelve `[{ title, slug, section, excerpt, publishedAt }]`.
- Respuesta cacheada 60s. Validación con Zod: `q` requerido, 2–80 chars.

### Contrato de respuesta de errores (todos los endpoints)
```json
{ "error": { "code": "STRING_CODE", "message": "human readable" } }
```

---

## 6. Frontend Architecture

### Pages / Routes
| Route | Page | Description |
|-------|------|-------------|
| `/` | Portada | Nota principal (lead), grilla de destacadas, últimas por sección |
| `/[section]` | Sección | Listado paginado de notas de la sección |
| `/[section]/[slug]` | Nota | Nota completa: Portable Text, imagen destacada, autor, compartir, relacionadas |
| `/autores/[slug]` | Autor | Perfil + notas del autor |
| `/buscar?q=` | Búsqueda | Resultados de búsqueda |

### Component Hierarchy (portada y nota)
```
/ (page.tsx — Server Component)
  Masthead                      # logo, fecha, edición
  SectionNav
  LeadStory                     # nota principal (imagen grande + título + volanta)
  FeaturedGrid
    ArticleCard × N
  SectionFeeds
    SectionBlock (× sección)
      ArticleCard × N
  Footer

/[section]/[slug] (page.tsx — Server Component)
  Masthead
  SectionNav
  article
    Kicker
    h1 (título)
    excerpt (bajada)
    AuthorLine + fecha + tiempo de lectura
    FeaturedImage (caption)
    ShareButtons             # "use client"
    ArticleBody              # Portable Text server-render
    AuthorBio
    RelatedArticles
  Footer
  <script type="application/ld+json"> JSON-LD Article
```

### State Management
- **Server Components por defecto.** Todo el contenido se renderiza en el servidor leyendo Sanity → SEO y performance óptimos.
- **ISR (revalidate) por defecto 60s**, más revalidación on-demand disparada por el webhook/Inngest al publicar → la nota aparece al instante sin rebuild.
- **Client Components solo donde hay interactividad:** `SearchBox`, `ShareButtons`. No hay estado global; no se necesita Zustand/Redux en el MVP.
- **Imágenes:** `next/image` con loader de Sanity + transformaciones del CDN (formatos modernos, tamaños responsive).

---

## 7. Design System

Estética: **periódico clásico, tipografía protagonista, alto contraste, "tinta sobre papel".** Serif de display para titulares, serif de lectura para el cuerpo, sans para UI y volantas. Acento rojo editorial (masthead) + azul pizarra secundario.

### Colors
| Role | Hex (light) | Hex (dark) | Usage |
|------|-------------|-----------|-------|
| Background (papel) | `#FBF9F4` | `#16130F` | Fondo de página |
| Surface | `#FFFFFF` | `#1F1B16` | Cards, paneles |
| Text (tinta) | `#1C1917` | `#F2EDE4` | Cuerpo y titulares |
| Muted | `#6B6560` | `#A8A199` | Metadatos, fechas, bordes de texto |
| Border | `#E4DFD6` | `#332C24` | Separadores, reglas del diario |
| Primary (masthead) | `#9E1B1B` | `#E0524C` | Logo, links, "Última hora", acentos |
| Secondary | `#2B3A55` | `#8FA6C7` | Etiquetas de sección, acentos fríos |
| Success | `#2E7D46` | `#5FBE7C` | Estado de posteo OK (panel) |
| Destructive | `#B4241E` | `#E86A64` | Errores, posteo fallido |

### Typography
| Role | Font | Size | Weight |
|------|------|------|--------|
| Titulares / Masthead | Playfair Display (serif display) | clamp 1.75–3.5rem | 700 / 900 |
| Cuerpo | Source Serif 4 (serif lectura) | 1.125rem / 1.7 line-height | 400 / 600 |
| UI / volantas / etiquetas | Inter (sans) | 0.75–0.95rem, uppercase tracking en kickers | 500 / 600 |
| Código (bloques en notas) | JetBrains Mono | 0.9rem | 400 |

Fuentes vía `next/font/google` (self-hosted, sin FOUT).

### Spacing & Layout
- Escala base 4px: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Border radius: **2–4px** (estética "impresa", esquinas casi rectas). Avatares circulares.
- Ancho de lectura de nota: **68ch** (máx. legibilidad). Ancho de contenedor general: 1200px.
- Breakpoints: sm 640 / md 768 / lg 1024 / xl 1280.
- Reglas horizontales finas (`1px solid Border`) para separar bloques, al estilo diario.

### Component Style
Plano, sin sombras pesadas (a lo sumo una sombra sutil en cards al hover). Predomina la tipografía y las reglas divisorias. Densidad media-alta en portada (varias notas visibles), amplitud y aire en la vista de nota individual. Transiciones sutiles (150ms) en links y hover de cards.

> En el build, usar `/ui-ux-pro-max` para refinar y `/frontend-design` para las páginas clave.

---

## 8. Authentication & Authorization

### MVP: editores vía Sanity Studio
- Los **2 editores** acceden al **Sanity Studio** (`/studio` embebido o deploy standalone) con su propio login de Sanity (email + magic link / Google). No se construye auth propia para el MVP.
- El sitio público **no tiene login**: la lectura es libre.
- No hay endpoints públicos de escritura de contenido → superficie de ataque mínima.

### Protected Routes
| Ruta | Acceso |
|------|--------|
| `/` , `/[section]` , `/[section]/[slug]` , `/buscar` , `/autores/*` | Público |
| `/studio` (Sanity) | Solo editores (auth de Sanity) |
| `/api/webhooks/sanity` | Firma HMAC |
| `/api/inngest` | Firma de Inngest |

### Roles & Permissions
| Role | Can Do |
|------|--------|
| Editor (Sanity) | Crear, editar, publicar y despublicar notas; gestionar secciones y autores |
| Lector | Leer todo el contenido publicado |
| *(Futuro)* Suscriptor | Acceder a contenido premium tras el paywall |

### Session Management
- Editores: sesión gestionada por Sanity (cookies del Studio).
- Fase 2 (suscripción): **Clerk** para cuentas de lector + **Stripe** para el cobro; middleware de Next.js protegiendo rutas/segmentos premium. El esquema `subscribers` en Supabase ya deja el seam listo (campo `clerk_user_id`).

---

## 9. Build Order

> **Esta es la sección más crítica.** Ejecutar en orden. Cada paso deja algo funcional y verificable. **Arrancar el Paso 12 (Meta App Review) lo antes posible en paralelo** — la aprobación de Meta tarda días.

**Step 1 — Scaffolding**
```bash
pnpm create next-app@latest periodico-delfos --typescript --tailwind --app --src-dir --import-alias "@/*"
cd periodico-delfos
pnpm dlx shadcn@latest init          # base color: neutral
pnpm add zod date-fns lucide-react
```
Configurar `tsconfig` en strict, alias `@/`, y `next.config.ts` con `images.remotePatterns` para `cdn.sanity.io`.

**Step 2 — Sanity Studio + schemas**
```bash
pnpm add sanity next-sanity @sanity/client @sanity/image-url @portabletext/react
pnpm add @sanity/vision styled-components
```
Crear `sanity.config.ts` y los schemas `article`, `category`, `author`, `blockContent` (sección 4). Embeber el Studio en `/studio` (ruta de Next) o deploy standalone. Crear 2-3 secciones y 1 autor de prueba, y 2 notas de ejemplo.

**Step 3 — Cliente Sanity + queries GROQ**
Implementar `lib/sanity/client.ts`, `lib/sanity/image.ts` (`urlFor`), y `lib/sanity/queries.ts` con: `getLatestArticles`, `getArticleBySlug`, `getArticlesBySection`, `getAllSlugs`, `searchArticles`, `getAuthorBySlug`. Definir tipos en `types/content.ts`.

**Step 4 — Design system + layout**
Cargar fuentes (`next/font`), definir tokens de color/espaciado en `globals.css` (CSS variables + Tailwind v4 `@theme`). Construir `Masthead`, `SectionNav`, `Footer`, `root layout`. Aplicar la estética de la sección 7. **Usar `/ui-ux-pro-max` acá.**

**Step 5 — Portada (`/`)**
`LeadStory` + `FeaturedGrid` (`ArticleCard`) + `SectionFeeds`. Server Component leyendo `getLatestArticles`. ISR `revalidate = 60`. **Usar `/frontend-design`.**

**Step 6 — Página de nota (`/[section]/[slug]`)**
`ArticleBody` (Portable Text con componentes custom: imágenes con caption, blockquotes, código, embeds), `FeaturedImage`, `Kicker`, `AuthorBio`, `ShareButtons` (client), `RelatedArticles`. `generateStaticParams` desde `getAllSlugs`. Metadata dinámica + JSON-LD Article (sección 12/SEO).

**Step 7 — Páginas de sección (`/[section]`) + autores**
Listado paginado por sección (`getArticlesBySection` con rango). `/autores/[slug]` con bio + notas del autor.

**Step 8 — Búsqueda**
`SearchBox` (client) → `/buscar?q=` (Server Component) usando `/api/search` (GROQ). Resaltar coincidencias, estado vacío, debounce.

**Step 9 — SEO técnico**
`sitemap.ts` (todas las notas + secciones), `robots.ts`, `rss.xml/route.ts`, `/api/og` (`@vercel/og`), canonical URLs con `NEXT_PUBLIC_SITE_URL`. **Correr `/seo-audit` al final.**

**Step 10 — Supabase + tabla social_posts**
Crear proyecto Supabase, correr migraciones `0001_social_posts.sql` y `0002_subscribers.sql`. Implementar `lib/supabase/client.ts` (service role, solo server) y helpers `upsertSocialPost`, `getSocialPostStatus`.

**Step 11 — Inngest + función esqueleto**
```bash
pnpm add inngest
```
`lib/inngest/client.ts`, `app/api/inngest/route.ts`, y `article-published.ts` con el esqueleto de fan-out (sección 5). Probar localmente con `npx inngest-cli dev` disparando el evento manualmente. Todavía sin postear real: solo loguear e insertar en `social_posts`.

**Step 12 — Integración Meta (Facebook + Instagram)** *(arrancar el review temprano)*
- Crear **App de Meta** (tipo Business), agregar productos *Facebook Login* + *Instagram Graph API*.
- Vincular **Página de Facebook** + **cuenta de Instagram Business**.
- Obtener **Page Access Token de larga duración** e `IG Business Account ID`.
- Implementar `lib/social/facebook.ts` (`POST /{page-id}/photos` con `url` + `caption`) y `lib/social/instagram.ts` (2 pasos: `POST /{ig-id}/media` con `image_url`+`caption` → `POST /{ig-id}/media_publish`).
- Permisos a solicitar en **App Review**: `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`.
- `lib/social/compose.ts`: arma el copy (`kicker`/`title` + `excerpt` + link a `periodicodelfos.com/[section]/[slug]` + hashtags de la sección).

**Step 13 — Integración X (API v2)**
- Crear app en el **X Developer Portal**, plan **Basic (~US$100/mes)**, credenciales OAuth 1.0a (API key/secret + access token/secret).
- `lib/social/x.ts`: subir imagen vía `v1.1 media/upload` → `POST /2/tweets` con `text` + `media.media_ids`. Respetar límite de 280 chars (truncar título+link).

**Step 14 — Cablear webhook de Sanity → Inngest (auto-posting real)**
- Implementar `/api/webhooks/sanity` con validación HMAC → dispara `article/published`.
- Completar `article-published.ts`: fan-out real a FB/IG/X con `step.run` + reintentos + idempotencia + `revalidate`.
- Configurar el webhook en Sanity (filtro: `article` publicado). Probar publicando una nota real de prueba.
- (Opcional) Vista admin mínima en `/studio` o página protegida que muestre `social_posts` (estado por red).

**Step 15 — Testing E2E (Playwright)**
Smoke tests: portada renderiza notas, nota individual carga con SEO tags, búsqueda devuelve resultados, navegación por secciones. Mock del pipeline social en test.

**Step 16 — Deploy**
Deploy en Vercel, conectar dominio `periodicodelfos.com` (DNS), cargar env vars de producción, registrar las funciones Inngest (deploy sync), configurar el webhook de Sanity apuntando a producción. Confirmar Meta App en modo Live tras aprobación. Correr `/seo-audit` sobre producción.

---

## 10. Environment Setup

### Prerequisites
- Node.js 20+ y pnpm 9+
- Cuenta en: Sanity, Supabase, Vercel, Inngest, Meta for Developers, X Developer Portal
- Página de Facebook + cuenta de Instagram **Business** vinculadas
- Dominio `periodicodelfos.com` (ya adquirido)

### Environment Variables
| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | ID del proyecto Sanity | sanity.io/manage |
| `NEXT_PUBLIC_SANITY_DATASET` | Normalmente `production` | Sanity |
| `SANITY_API_READ_TOKEN` | Token de lectura (server) | Sanity → API → Tokens |
| `SANITY_WEBHOOK_SECRET` | Secreto para validar el webhook | Generado por vos (Sanity webhook config) |
| `NEXT_PUBLIC_SITE_URL` | `https://periodicodelfos.com` | — |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key | Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (solo server) | Supabase |
| `INNGEST_EVENT_KEY` | Envío de eventos | Inngest dashboard |
| `INNGEST_SIGNING_KEY` | Firma de funciones | Inngest dashboard |
| `META_APP_ID` / `META_APP_SECRET` | Credenciales de la app Meta | developers.facebook.com |
| `FACEBOOK_PAGE_ID` | ID de la Página | Graph API Explorer |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | Token de Página de larga duración | Graph API |
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | ID de la cuenta IG Business | Graph API |
| `X_API_KEY` / `X_API_SECRET` | Consumer keys | X Developer Portal |
| `X_ACCESS_TOKEN` / `X_ACCESS_TOKEN_SECRET` | Tokens de acceso (OAuth 1.0a) | X Developer Portal |
| *(futuro)* `CLERK_*`, `STRIPE_*` | Suscripción fase 2 | Clerk / Stripe |

### Initial Setup Commands
```bash
pnpm install
cp .env.example .env.local     # completar con las claves de arriba
pnpm dlx supabase db push      # aplicar migraciones (o SQL desde el dashboard)
npx inngest-cli dev            # Inngest local (terminal aparte)
pnpm dev                       # http://localhost:3000  y  /studio
```

---

## 11. Dependencies

### Core
| Package | Purpose |
|---------|---------|
| next / react / react-dom | Framework y runtime |
| typescript | Tipado estricto |
| tailwindcss (v4) | Estilos |
| sanity / next-sanity / @sanity/client | CMS y cliente de contenido |
| @sanity/image-url | URLs de imágenes del CDN de Sanity |
| @portabletext/react | Render del cuerpo de las notas |
| @supabase/supabase-js | Estado de posteos + suscriptores |
| inngest | Jobs durables / auto-posting con reintentos |
| zod | Validación de inputs (webhook, búsqueda) |
| date-fns | Formateo de fechas editoriales |
| lucide-react | Íconos |
| @vercel/og | Imágenes Open Graph dinámicas |

### Dev
| Package | Purpose |
|---------|---------|
| @playwright/test | E2E smoke tests |
| eslint / prettier | Linting y formato |
| @types/node / @types/react | Tipos |
| inngest-cli | Dev server local de Inngest |

---

## 12. Deployment Strategy

### Hosting
**Vercel.** Deploy nativo de Next.js con ISR y funciones serverless (para `/api/*` e Inngest). Preview deploy por cada PR.

### CI/CD
- `main` → producción; ramas → preview deploys automáticos.
- Build command `pnpm build`. Registrar funciones Inngest en el deploy (Inngest detecta el endpoint `/api/inngest`).

### Domain & DNS
- Conectar `periodicodelfos.com` en Vercel → agregar registros DNS (`A`/`CNAME` según indique Vercel). SSL/HTTPS automático.
- Verificar el dominio en **Meta Business** (facilita y acelera el App Review) y setear `NEXT_PUBLIC_SITE_URL=https://periodicodelfos.com`.

### Environments
- **Dev:** local con Inngest CLI + dataset Sanity `development` (opcional).
- **Producción:** dataset `production`, Meta App en modo Live, webhook de Sanity apuntando a `https://periodicodelfos.com/api/webhooks/sanity`.

---

## 13. Testing Strategy

### Unit
- Vitest para `lib/social/compose.ts` (armado y truncado del copy) y helpers de SEO.

### Integration
- Test de `/api/webhooks/sanity`: firma válida/ inválida, disparo del evento.
- Test de idempotencia de `social_posts` (no doble posteo por `(article_id, platform)`).
- Mockear las APIs de Meta/X (no pegarle a producción en tests).

### E2E (Playwright)
Flujos críticos: (1) portada renderiza notas; (2) abrir una nota muestra título, cuerpo, autor y meta tags/JSON-LD; (3) búsqueda devuelve resultados; (4) navegación por secciones. Correr en CI antes de producción. **Usar `/playwright-cli`.**

---

## 14. Skills to Use During Build

| Skill | When to Use | Why |
|-------|-------------|-----|
| `/ui-ux-pro-max` | Step 4 (design system) | Refinar paleta, tipografía y estilo editorial |
| `/frontend-design` | Steps 5, 6, 7 (portada, nota, secciones) | UI distintiva y de producción para las páginas clave |
| `/shadcn-ui` | Steps 1, 8 (scaffolding, buscador) | Instalar y customizar primitivas (dialog, input, nav) |
| `/seo-audit` | Step 9 y post-deploy (Step 16) | Auditoría técnica de SEO antes y después de lanzar |
| `/playwright-cli` | Step 15 (E2E) | Automatizar los smoke tests de los flujos críticos |
| `/deep-research` | Steps 12-13 (Meta / X) | Confirmar endpoints/permisos vigentes de Graph API y X API v2 al momento de construir |

---

## 15. CLAUDE.md for Target Project

```markdown
# Periódico Delfos

Diario digital estilo periódico con portada, secciones y buscador. Dos editores publican notas desde Sanity Studio; al publicar, cada nota se auto-postea a Facebook, Instagram y X. Lectura libre; arquitectura lista para suscripción a futuro.

## Commands
- `pnpm dev` — Servidor de desarrollo (sitio + /studio)
- `pnpm build` — Build de producción
- `pnpm lint` — Linter
- `pnpm test` — Tests (Vitest + Playwright)
- `npx inngest-cli dev` — Dev server de Inngest (auto-posting local)
- `pnpm dlx supabase db push` — Aplicar migraciones

## Tech Stack
Next.js 15 (App Router) + TypeScript + Tailwind v4 + shadcn/ui + Sanity (CMS) + Supabase (Postgres) + Inngest (jobs) + Meta Graph API & X API v2 + Vercel.

## Architecture
### Directory Structure
- `src/app/` — Rutas App Router (portada, `[section]/[slug]`, buscar, api/*)
- `src/components/` — UI por dominio (layout, content, search, ui)
- `src/lib/` — sanity/, supabase/, social/, inngest/, seo.ts, utils.ts
- `src/types/` — Tipos compartidos
- `sanity/` — Studio y schemas (article, category, author)
- `supabase/migrations/` — SQL de social_posts y subscribers

### Data Flow
Contenido: Server Components leen Sanity vía GROQ (con ISR). Publicación: Sanity publish → webhook `/api/webhooks/sanity` (valida HMAC) → evento Inngest `article/published` → función durable que hace fan-out a FB/IG/X (con reintentos + idempotencia vía tabla `social_posts`) y revalida las rutas. Nada de posteo inline en el request.

### Key Patterns
- Server Components por defecto; `"use client"` solo en SearchBox y ShareButtons.
- Todas las GROQ queries viven en `lib/sanity/queries.ts`. Nunca inline en componentes.
- Todo posteo a redes pasa por `lib/social/*` y se registra en `social_posts` (un row por red por nota).
- Idempotencia: chequear `social_posts (article_id, platform)` antes de postear.
- `SUPABASE_SERVICE_ROLE_KEY` y tokens de redes: SOLO en código server. Nunca en el cliente.

## Code Organization Rules
1. Un componente por archivo. Máx 300 líneas; si crece, extraer subcomponentes.
2. Path alias `@/` para `src/`.
3. Sin barrel exports; importar del archivo fuente.
4. Server Components por defecto; agregar `"use client"` solo si hay interactividad.
5. Colocar componentes específicos de una página junto a su page.

## Design System
### Colors (light / dark)
- Background `#FBF9F4` / `#16130F` · Surface `#FFFFFF` / `#1F1B16`
- Text `#1C1917` / `#F2EDE4` · Muted `#6B6560` / `#A8A199` · Border `#E4DFD6` / `#332C24`
- Primary `#9E1B1B` / `#E0524C` · Secondary `#2B3A55` / `#8FA6C7`
- Success `#2E7D46` · Destructive `#B4241E`
### Typography
- Titulares: Playfair Display 700/900
- Cuerpo: Source Serif 4 400/600 (1.125rem, line-height 1.7, ancho 68ch)
- UI/volantas: Inter 500/600 (uppercase tracking en kickers)
### Style
- Border radius 2–4px (estética impresa) · Sombras mínimas · Spacing base 4px
- Estético: tipografía protagonista, reglas divisorias finas, alto contraste, "tinta sobre papel"

## Environment Variables
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` / `_DATASET` | Proyecto y dataset Sanity |
| `SANITY_API_READ_TOKEN` / `SANITY_WEBHOOK_SECRET` | Lectura server / validación de webhook |
| `NEXT_PUBLIC_SITE_URL` | https://periodicodelfos.com |
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase |
| `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` | Inngest |
| `META_APP_ID` / `META_APP_SECRET` / `FACEBOOK_PAGE_ID` / `FACEBOOK_PAGE_ACCESS_TOKEN` / `INSTAGRAM_BUSINESS_ACCOUNT_ID` | Meta (FB + IG) |
| `X_API_KEY` / `X_API_SECRET` / `X_ACCESS_TOKEN` / `X_ACCESS_TOKEN_SECRET` | X API v2 |

## Reglas No Negociables
1. TypeScript strict. Prohibido `any`; usar tipos de `types/content.ts`.
2. Secrets (service role, tokens de redes) SOLO server-side. Nunca exponer al cliente.
3. Todo posteo a redes es idempotente vía `social_posts (article_id, platform)`. Nunca doble post.
4. El webhook de Sanity DEBE validar la firma HMAC antes de procesar.
5. Server Components por defecto; contenido server-rendered para SEO. No renderizar el cuerpo en el cliente.
6. No commitear `.env*`. Usar `.env.example` como plantilla.
```

---

## 16. Reglas No Negociables (para el builder)

1. **NO postear a redes de forma inline** en el request del webhook. Siempre vía Inngest (durable + reintentos). El webhook responde 200 rápido.
2. **Idempotencia obligatoria:** un row por `(article_id, platform)` en `social_posts`; verificar antes de postear para no duplicar.
3. **Secrets solo server-side.** `SUPABASE_SERVICE_ROLE_KEY`, tokens Meta y X jamás en componentes cliente ni en variables `NEXT_PUBLIC_*`.
4. **Instagram exige `image_url` HTTPS pública** — usar siempre la URL del CDN de Sanity, nunca un blob local.
5. **Validar el webhook de Sanity con HMAC** (`SANITY_WEBHOOK_SECRET`) antes de disparar cualquier posteo.
6. **Contenido server-rendered** (Server Components + ISR) para SEO; nada de fetch de contenido en cliente.
7. **TypeScript strict, sin `any`.** Un componente por archivo, máx 300 líneas.
8. **Empezar el Meta App Review temprano** (Step 12) — es el bloqueo de mayor lead time del proyecto.
9. **X API es de pago (~US$100/mes).** Confirmar la suscripción del tier Basic antes de construir el Step 13.
10. **No commitear `.env*`.** Todo secreto va por variables de entorno de Vercel.

---

> Fin del blueprint. Un agente de Claude Code puede construir Periódico Delfos de punta a punta siguiendo el Build Order (sección 9) sin contexto adicional.
