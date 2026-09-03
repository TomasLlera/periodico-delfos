# Periódico Delfos — Blueprint v2

> Versión 2 · 2026-08-07
> Reemplaza a `periodico-delfos-blueprint.md` (v1, escrito sin conocer el sitio real).
> Arquetipo: Medio digital monotemático con datos deportivos estructurados + distribución automática.
> Dominio: periodicodelfos.com

**Decisiones tomadas para esta versión:**
1. Auto-posting a Facebook, Instagram y X: **va**.
2. Framework: **Next.js 15 (App Router)** — no Vite.
3. Backend: **Supabase para todo** — no Sanity. Contenido y datos deportivos en el mismo Postgres.
4. Suscripciones / paywall: **fuera del alcance**. No se crea la tabla `subscribers`.

---

## 1. Project Overview

### Qué es

**Periódico Delfos** (periodicodelfos.com) es un medio digital de Mar del Plata dedicado exclusivamente al fútbol femenino de Aldosivi (las "Tiburonas"). Lo escribe una sola persona, **Charlie Redondo**, que cubre cada fecha del campeonato con una nota previa (Análisis) y una crónica posterior (Crónicas).

Hoy corre sobre WordPress con un theme genérico (ColorMag). Este proyecto es una **migración**, no un sitio nuevo: hay contenido publicado y posicionamiento acumulado que preservar.

### Los cuatro objetivos

1. **Arreglar la lectura.** Las notas son buenas y están mal presentadas: medida de línea de ~140 caracteres, tipografía chica, jerarquía débil.
2. **Estructurar los datos del partido.** Hoy toda la información deportiva (goles, formaciones, posiciones, estadísticas del rival) vive dentro del texto de las notas: se escribe a mano, no se puede consultar, no se acumula y queda desactualizada apenas se juega la fecha siguiente. **Este es el corazón del proyecto.**
3. **Convertir el sitio en la fuente de referencia del equipo.** Si alguien quiere saber cuántos goles lleva una jugadora esta temporada, la respuesta tiene que estar en el sitio.
4. **Automatizar la distribución.** Al publicar una nota, el sistema la reparte solo a Facebook, Instagram y X, con reintentos y estado por red. Charlie publica una vez; las redes ocurren solas.

El objetivo 2 manda sobre el resto. No se trata de hacer un sitio más lindo: se trata de sacarle trabajo manual de encima al periodista y de evitar que publique datos que envejecen mal.

### Audiencia real

Hinchas de Aldosivi, familiares de las jugadoras y periodistas del ascenso. **Mayoritariamente mobile, mayoritariamente 4G, mayoritariamente llegando desde un link de Instagram o WhatsApp.** Todo el diseño se decide primero en 375px de ancho.

### Success Metrics

| Métrica | Objetivo |
|---|---|
| Lectura | Una nota de 800 palabras se lee cómoda en un celular sin zoom |
| Carga de partido | Charlie carga un partido completo desde el celular en **< 3 minutos** |
| Consulta de dato | "¿Cuántos goles lleva Cortadi esta temporada?" se responde en **2 clicks desde la home** |
| Integridad de datos | **Cero** datos deportivos escritos a mano dentro del texto de una nota |
| SEO | **100%** de las URLs viejas de WordPress redirigen (301) a su equivalente nueva |
| Distribución | De "publicar" a "visible + posteado en las 3 redes" en **< 60s**; tasa de éxito ≥ 99% con reintentos |
| Performance | LCP < 2.5s en 4G en portada y notas |

---

## 2. Tech Stack

| Capa | Tecnología | Por qué |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | SSG/ISR para SEO; `generateStaticParams` cubre las ~32 páginas de jugadora, fixtures y partidos sin plugin de prerender; `@vercel/og` para imágenes dinámicas |
| Lenguaje | TypeScript (strict) | Tipos generados desde el schema de Supabase, de punta a punta |
| Estilos | Tailwind CSS v4 (tokens en `@theme`) | Sistema de diseño editorial consistente |
| Componentes | shadcn/ui | Primitivas accesibles (dialog, select, input) para el admin |
| Base de datos | **Supabase Postgres** | Contenido y datos deportivos en el mismo motor: las notas se joinean con partidos, temporadas y jugadoras |
| Auth | Supabase Auth + RLS | Un solo autor; RLS como línea de defensa real |
| Media | Supabase Storage (bucket `media` público) | Da URLs HTTPS públicas — requisito duro de la API de Instagram |
| Editor | **TipTap** (salida JSON) | Cuerpo como JSON estructurado, no HTML crudo; permite el bloque embebible `<PlanillaPartido />` |
| Formularios admin | React Hook Form + Zod | Validación compartida cliente/servidor |
| Data fetching (admin) | TanStack Query 5 | Solo en el admin (client). El sitio público es Server Components y no lo usa |
| Jobs / auto-posting | Inngest | Funciones durables con reintentos, fan-out a 3 redes y observabilidad por intento |
| Social APIs | Meta Graph API (FB + IG) + X API v2 | Una integración Meta cubre Facebook e Instagram |
| Búsqueda | Postgres full-text (`tsvector` + GIN, diccionario `spanish`) | Volumen bajo; cero servicios extra |
| Hosting | Vercel | ISR, preview deploys, dominio + SSL, funciones serverless para Inngest |
| Package manager | pnpm | Rápido y eficiente en disco |

### Por qué se cayó Sanity (v1 lo proponía)

Tres razones, en orden de peso:

1. `notas.partido_id` es una foreign key real. Con el contenido en Sanity y lo deportivo en Supabase, esa relación pasa a ser un ID pegado a mano, sin integridad referencial y sin posibilidad de join.
2. **Sanity Studio no puede ser la planilla de carga móvil.** Ese formulario hay que construirlo a mano igual. Tener además Sanity para las notas significa dos sistemas de administración y una frontera artificial en el medio.
3. "Insertar la planilla si `nota.partido_id` existe" y "notas relacionadas filtradas por la misma temporada" son joins entre contenido y datos deportivos. Cross-system no se joinean.

---

## 3. Directory Structure

```
periodico-delfos/
  src/
    app/
      layout.tsx                      # Root layout: header + footer, fuentes, lang="es-AR"
      page.tsx                        # Portada
      globals.css                     # Tailwind v4 @theme con los tokens
      nota/[slug]/page.tsx            # Artículo
      cronicas/page.tsx               # Listado de crónicas (paginado)
      analisis/page.tsx               # Listado de análisis
      temporada/[slug]/page.tsx       # Fixture + tabla + goleadoras
      partido/[slug]/page.tsx         # Ficha completa del partido
      plantel/[temporadaSlug]/page.tsx
      jugadora/[slug]/page.tsx        # ~32 páginas indexables nuevas
      quienes-somos/page.tsx
      contacto/page.tsx
      privacidad/page.tsx
      buscar/page.tsx
      sitemap.ts                      # Generado desde Supabase
      robots.ts
      rss.xml/route.ts
      api/
        og/route.tsx                  # OG dinámico: nota y partido (con resultado)
        inngest/route.ts              # Host de las funciones Inngest
      admin/
        layout.tsx                    # Layout protegido (middleware + verificación server)
        page.tsx                      # Dashboard: estado de últimos posteos + próximo partido
        login/page.tsx
        notas/page.tsx
        notas/[id]/page.tsx           # Editor TipTap
        partidos/page.tsx
        partidos/[id]/planilla/page.tsx   # ★ Carga de eventos, optimizada para pulgar
        jugadoras/page.tsx
        plantel/[temporadaId]/page.tsx
        tabla/[temporadaId]/page.tsx
    components/
      layout/
        Header.tsx
        Footer.tsx
        BarraEstado.tsx               # Último resultado + próximo partido + posición
      content/
        NotaPrincipal.tsx
        NotaCard.tsx
        CuerpoNota.tsx                # Renderer de TipTap JSON → React
        ImagenResponsive.tsx          # srcset 400/800/1600, WebP
        Bajada.tsx
        BotonesCompartir.tsx          # "use client" — WhatsApp, IG Stories, X, copiar
        CajaAutor.tsx
        NotasRelacionadas.tsx         # Filtradas por temporada
      partido/
        PlanillaPartido.tsx           # ★ El componente firma
        PlanillaCompacta.tsx          # Versión home / embebida
        Formaciones.tsx
        ProximoPartido.tsx            # Reemplaza las placas de imagen con texto adentro
        FechaAFecha.tsx               # Franja horizontal de resultados
        ChipResultado.tsx
      temporada/
        TablaPosiciones.tsx
        Goleadoras.tsx
        Fixture.tsx
      jugadora/
        TarjetaJugadora.tsx
        EstadisticasJugadora.tsx
      admin/
        EditorTipTap.tsx
        SelectorMinuto.tsx            # Rueda numérica
        GrillaJugadoras.tsx           # Selección por foto + dorsal
        ListaEventos.tsx              # Editable
        EstadoPosteos.tsx             # Estado por red + botón reintentar
      ui/                             # Primitivas shadcn/ui
    lib/
      supabase/
        client.ts                     # Browser client (anon)
        server.ts                     # Server client (cookies)
        admin.ts                      # Service role — SOLO server
        types.ts                      # Tipos generados: supabase gen types
        queries/
          notas.ts
          partidos.ts
          temporadas.ts
          jugadoras.ts
      tiptap/
        extensions.ts                 # Incluye el nodo PlanillaPartido
        render.tsx                    # JSON → React (server)
      social/
        facebook.ts                   # postToFacebook()
        instagram.ts                  # postToInstagram()
        x.ts                          # postToX()
        compose.ts                    # Arma el copy usando datos del partido
      inngest/
        client.ts
        functions/
          nota-publicada.ts           # Fan-out durable a las 3 redes
      seo.ts                          # Metadata + JSON-LD
      formato.ts                      # Fechas es-AR, minutos, resultados
      utils.ts
    actions/
      publicar-nota.ts                # Server Action: publica + revalida + emite evento
      eventos.ts                      # Server Actions de la planilla (autoguardado)
    types/
      index.ts
    middleware.ts                     # Protege /admin/*
  supabase/
    migrations/
      0001_catalogos.sql
      0002_jugadoras_plantel.sql
      0003_partidos_eventos.sql
      0004_tabla_posiciones.sql
      0005_notas.sql
      0006_vistas.sql
      0007_social_posts.sql
      0008_rls.sql
      0009_busqueda.sql
  scripts/
    migrate-wp.ts                     # WordPress → Supabase
    generate-redirects.ts             # → vercel.json
  tests/
    e2e/
  .env.example
  next.config.ts
  vercel.json                         # Redirecciones 301
  playwright.config.ts
  CLAUDE.md
```

---

## 4. Data Model

Este es el núcleo. El resto del sitio se deriva de acá.

### 4.1 Catálogos — `0001_catalogos.sql`

```sql
create table temporadas (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,               -- "Primera B 2026"
  slug          text not null unique,        -- "primera-b-2026"
  division      text not null,               -- "Primera B" | "Primera C"
  anio          int  not null,
  zona          text,                        -- "Zona B"
  activa        boolean not null default false,
  created_at    timestamptz default now()
);

create table equipos (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,               -- "Club Atlético Aldosivi"
  nombre_corto  text not null,               -- "Aldosivi"
  apodo         text,                        -- "Tiburonas"
  slug          text not null unique,
  escudo_url    text,
  ciudad        text,
  es_aldosivi   boolean not null default false
);

create table autores (
  id            uuid primary key references auth.users(id) on delete cascade,
  nombre        text not null,
  slug          text not null unique,
  bio           text,
  foto_url      text,
  instagram     text,
  x_handle      text
);
```

### 4.2 Jugadoras y planteles — `0002_jugadoras_plantel.sql`

```sql
create type posicion_t as enum ('arquera','defensora','mediocampista','delantera','dt','ayudante');

create table jugadoras (
  id                uuid primary key default gen_random_uuid(),
  nombre            text not null,
  apellido          text not null,
  slug              text not null unique,
  posicion          posicion_t not null,
  fecha_nacimiento  date,
  foto_url          text,
  lugar_origen      text,
  bio               text,
  activa            boolean not null default true
);

-- El dorsal y hasta la posición pueden cambiar entre temporadas
create table plantel (
  temporada_id  uuid references temporadas(id) on delete cascade,
  jugadora_id   uuid references jugadoras(id)  on delete cascade,
  dorsal        int,
  posicion      posicion_t,
  capitana      boolean default false,
  primary key (temporada_id, jugadora_id)
);
```

### 4.3 Partidos y eventos — `0003_partidos_eventos.sql`

```sql
create type estado_partido_t as enum ('programado','en_curso','finalizado','suspendido','postergado');

create table partidos (
  id                    uuid primary key default gen_random_uuid(),
  temporada_id          uuid not null references temporadas(id),
  fecha_numero          int,
  fecha_hora            timestamptz not null,
  equipo_local_id       uuid not null references equipos(id),
  equipo_visitante_id   uuid not null references equipos(id),
  goles_local           int,
  goles_visitante       int,
  estado                estado_partido_t not null default 'programado',
  cancha                text,
  arbitra               text,
  slug                  text not null unique,  -- "fecha-11-tiburonas-all-boys-2026"
  observaciones         text,
  created_at            timestamptz default now(),
  constraint equipos_distintos check (equipo_local_id <> equipo_visitante_id)
);

create index partidos_temporada_fecha_idx on partidos (temporada_id, fecha_numero);
create index partidos_fecha_hora_idx      on partidos (fecha_hora desc);

-- Alineación: quiénes jugaron
create table formaciones (
  partido_id    uuid references partidos(id) on delete cascade,
  jugadora_id   uuid references jugadoras(id),
  es_titular    boolean not null default true,
  dorsal        int,
  posicion      posicion_t,
  primary key (partido_id, jugadora_id)
);

-- Eventos: la unidad mínima de dato deportivo
create type tipo_evento_t as enum (
  'gol','gol_penal','gol_en_contra','penal_errado',
  'amarilla','roja','doble_amarilla',
  'cambio','lesion'
);

create table eventos (
  id                   uuid primary key default gen_random_uuid(),
  partido_id           uuid not null references partidos(id) on delete cascade,
  minuto               int not null,
  adicionado           int default 0,
  tipo                 tipo_evento_t not null,
  equipo_id            uuid not null references equipos(id),
  jugadora_id          uuid references jugadoras(id),   -- null si es del rival
  jugadora_nombre      text,                            -- fallback para rivales
  jugadora_sale_id     uuid references jugadoras(id),   -- sólo para 'cambio'
  jugadora_sale_nombre text,
  detalle              text
);

create index eventos_partido_minuto_idx on eventos (partido_id, minuto);
create index eventos_jugadora_idx       on eventos (jugadora_id, tipo);
```

### 4.4 Tabla de posiciones — `0004_tabla_posiciones.sql`

> **Decisión deliberada:** no se calcula desde `partidos`. El medio sólo cubre a Aldosivi, no todos los partidos de la zona; calcularla requeriría cargar el campeonato entero. Se carga a mano por fecha desde el admin. Esta es la **única** excepción a la regla de "ningún dato deportivo a mano", y está acotada a una tabla, no al texto de las notas.

```sql
create table tabla_posiciones (
  id             uuid primary key default gen_random_uuid(),
  temporada_id   uuid not null references temporadas(id) on delete cascade,
  fecha_numero   int not null,
  equipo_id      uuid not null references equipos(id),
  posicion       int not null,
  puntos         int not null,
  jugados        int not null,
  ganados        int not null,
  empatados      int not null,
  perdidos       int not null,
  goles_favor    int not null,
  goles_contra   int not null,
  unique (temporada_id, fecha_numero, equipo_id)
);
```

### 4.5 Contenido editorial — `0005_notas.sql`

```sql
create type categoria_t   as enum ('cronica','analisis','temporada','plantel','institucional');
create type estado_nota_t as enum ('borrador','publicada','archivada');

create table notas (
  id              uuid primary key default gen_random_uuid(),
  titulo          text not null,             -- SIN el sufijo "Fecha N - Aldosivi..."
  slug            text not null unique,
  bajada          text not null,             -- extracto escrito a mano, OBLIGATORIO
  cuerpo          jsonb not null,            -- TipTap JSON
  imagen_portada  text,
  imagen_alt      text not null default '',
  imagen_credito  text,
  categoria       categoria_t not null,
  temporada_id    uuid references temporadas(id),
  partido_id      uuid references partidos(id),   -- vincula la nota con la ficha
  autor_id        uuid not null references autores(id),
  estado          estado_nota_t not null default 'borrador',
  publicada_en    timestamptz,
  destacada       boolean default false,
  -- Distribución automática
  auto_post       boolean not null default true,
  redes           text[] not null default '{facebook,instagram,x}',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index notas_estado_pub_idx  on notas (estado, publicada_en desc);
create index notas_categoria_idx   on notas (categoria, publicada_en desc);
create index notas_temporada_idx   on notas (temporada_id, publicada_en desc);

create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger notas_updated_at before update on notas
  for each row execute function set_updated_at();
```

### 4.6 Vistas derivadas — `0006_vistas.sql`

> `security_invoker = on` para que las políticas RLS de las tablas base se apliquen a quien consulta la vista, en lugar de al owner.

```sql
-- Goleadoras por temporada: se calcula solo, nunca se escribe a mano
create view goleadoras with (security_invoker = on) as
select
  p.temporada_id,
  e.jugadora_id,
  j.nombre, j.apellido, j.slug, j.foto_url,
  count(*)                                     as goles,
  count(*) filter (where e.tipo = 'gol_penal') as de_penal
from eventos e
join partidos  p  on p.id  = e.partido_id
join jugadoras j  on j.id  = e.jugadora_id
join equipos   eq on eq.id = e.equipo_id and eq.es_aldosivi
where e.tipo in ('gol','gol_penal')
group by p.temporada_id, e.jugadora_id, j.nombre, j.apellido, j.slug, j.foto_url;

-- Estadísticas completas por jugadora y temporada
create view estadisticas_jugadora with (security_invoker = on) as
select
  f.jugadora_id,
  p.temporada_id,
  count(*)                              as partidos,
  count(*) filter (where f.es_titular)  as titular,
  sum(coalesce(g.goles, 0))             as goles,
  sum(coalesce(t.amarillas, 0))         as amarillas,
  sum(coalesce(t.rojas, 0))             as rojas
from formaciones f
join partidos p on p.id = f.partido_id and p.estado = 'finalizado'
left join lateral (
  select count(*) as goles
  from eventos e
  where e.jugadora_id = f.jugadora_id
    and e.partido_id  = f.partido_id
    and e.tipo in ('gol','gol_penal')
) g on true
left join lateral (
  select
    count(*) filter (where e.tipo = 'amarilla')                 as amarillas,
    count(*) filter (where e.tipo in ('roja','doble_amarilla')) as rojas
  from eventos e
  where e.jugadora_id = f.jugadora_id
    and e.partido_id  = f.partido_id
) t on true
group by f.jugadora_id, p.temporada_id;
```

> Nota de implementación: la versión de esta vista en el documento fuente agrupaba por los valores laterales, lo que sumaba mal entre partidos. Acá se agrega con `sum()` y se agrupa sólo por jugadora y temporada.

### 4.7 Registro de posteos — `0007_social_posts.sql`

```sql
create type social_platform as enum ('facebook','instagram','x');
create type social_status   as enum ('pending','processing','success','failed');

create table social_posts (
  id               uuid primary key default gen_random_uuid(),
  nota_id          uuid not null references notas(id) on delete cascade,
  nota_slug        text not null,
  platform         social_platform not null,
  status           social_status not null default 'pending',
  external_post_id text,
  external_url     text,
  error_message    text,
  attempts         int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (nota_id, platform)     -- idempotencia
);

create index social_posts_status_idx on social_posts (status);

create trigger social_posts_updated_at before update on social_posts
  for each row execute function set_updated_at();
```

### 4.8 RLS — `0008_rls.sql`

```sql
alter table temporadas       enable row level security;
alter table equipos          enable row level security;
alter table autores          enable row level security;
alter table jugadoras        enable row level security;
alter table plantel          enable row level security;
alter table partidos         enable row level security;
alter table formaciones      enable row level security;
alter table eventos          enable row level security;
alter table tabla_posiciones enable row level security;
alter table notas            enable row level security;
alter table social_posts     enable row level security;

-- Helper: ¿el usuario actual es un autor del medio?
create or replace function es_autor() returns boolean as $$
  select exists (select 1 from autores where id = auth.uid());
$$ language sql stable security definer;

-- Lectura pública de todas las tablas deportivas y de catálogo
create policy lectura_publica on temporadas       for select using (true);
create policy lectura_publica on equipos          for select using (true);
create policy lectura_publica on autores          for select using (true);
create policy lectura_publica on jugadoras        for select using (true);
create policy lectura_publica on plantel          for select using (true);
create policy lectura_publica on partidos         for select using (true);
create policy lectura_publica on formaciones      for select using (true);
create policy lectura_publica on eventos          for select using (true);
create policy lectura_publica on tabla_posiciones for select using (true);

-- Notas: sólo las publicadas son públicas
create policy lectura_publicadas on notas for select
  using (estado = 'publicada' and publicada_en <= now());
create policy lectura_autor on notas for select using (es_autor());

-- Escritura: sólo autores. (Repetir el patrón en cada tabla.)
create policy escritura_autor on notas    for all using (es_autor()) with check (es_autor());
create policy escritura_autor on partidos for all using (es_autor()) with check (es_autor());
create policy escritura_autor on eventos  for all using (es_autor()) with check (es_autor());
-- … ídem jugadoras, plantel, formaciones, tabla_posiciones, temporadas, equipos.

-- social_posts: nadie lo lee desde el cliente público
create policy lectura_autor on social_posts for select using (es_autor());
-- La escritura la hace Inngest con service role, que bypassea RLS.
```

**Storage:** bucket `media` con lectura pública (requisito de Instagram: la API exige una `image_url` HTTPS accesible sin auth) y escritura restringida a autores autenticados.

### 4.9 Búsqueda — `0009_busqueda.sql`

```sql
alter table notas add column busqueda tsvector
  generated always as (
    setweight(to_tsvector('spanish', coalesce(titulo, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(bajada, '')), 'B')
  ) stored;

create index notas_busqueda_idx on notas using gin (busqueda);
```

### Relaciones

- `notas` → `autores` (many-to-one), → `temporadas` (many-to-one, nullable), → `partidos` (many-to-one, nullable).
- `partidos` → `temporadas`, → `equipos` ×2.
- `eventos` → `partidos`, → `equipos`, → `jugadoras` (nullable: los eventos del rival guardan sólo el nombre).
- `formaciones` y `plantel` son tablas de unión con atributos.
- `social_posts` → `notas`, un row por red por nota.

---

## 5. Migración desde WordPress

**Esto no existía en el blueprint v1 y es lo que más caro sale omitir.** Hay posicionamiento acumulado; sin las 301 se pierde entero.

### Script `scripts/migrate-wp.ts`

1. `GET https://periodicodelfos.com/wp-json/wp/v2/posts?per_page=100&_embed` — traer todas las notas con categorías, autor y media.
2. Descargar cada imagen destacada, convertir a WebP en tres anchos (400/800/1600) y subir al bucket `media`.
3. Convertir el HTML del cuerpo a JSON de TipTap con `generateJSON` de `@tiptap/html`.
4. **Limpiar los títulos:** quitar por regex el sufijo `": Fecha N°X – Aldosivi Femenino en la Primera B 2026"`, y extraer de ahí `fecha_numero` y temporada para guardarlos como campos estructurados.
5. Mapear categorías de WP → enum `categoria_t`.
6. Reportar en consola las notas **sin bajada** para escribirlas a mano antes del lanzamiento. WordPress hoy corta el extracto a mitad de oración (*"...una temporada que quedará en la historia. No"*); ninguna de esas se importa como está.
7. Emitir `redirects.json` con el mapa URL vieja → nueva.

### Redirecciones — `scripts/generate-redirects.ts` → `vercel.json`

Obligatorias, 301 permanente:

| Vieja | Nueva |
|---|---|
| `/:slug-viejo/` | `/nota/:slug-nuevo` |
| `/category/futbol-femenino/cronicas/` | `/cronicas` |
| `/category/futbol-femenino/analisis/` | `/analisis` |
| `/author/:slug/` | `/quienes-somos` |

### Datos deportivos históricos

Se cargan **a mano desde el admin**. La información está en el texto de las crónicas viejas pero no vale la pena parsearla. **Priorizar la temporada 2026 completa; 2024 queda para después del lanzamiento.**

---

## 6. Pipeline de publicación y API

### 6.1 El flujo completo

```
Charlie toca "Publicar" en /admin/notas/[id]
        │
        ▼
Server Action  publicarNota()
   1. UPDATE notas SET estado='publicada', publicada_en=now()
   2. revalidatePath('/'), ('/nota/[slug]'), ('/cronicas' | '/analisis')
   3. inngest.send('nota/publicada', { notaId, slug })
   4. return  → la UI muestra "publicada, distribuyendo…"
        │
        ▼
Inngest  fn: nota-publicada          (durable, con reintentos)
   step "fetch-nota"        → trae nota + partido + equipos + temporada
   step "compose"           → arma el copy por red (usa datos del partido)
   step "post-facebook"     ─┐
   step "post-instagram"    ─┼─ en paralelo, cada uno con su reintento
   step "post-x"            ─┘
   cada step: chequea social_posts → si ya está 'success', skip
              postea → upsert status + external_url + attempts
```

**Por qué la revalidación va en el Server Action y no en Inngest:** el sitio tiene que estar actualizado *antes* de que el link llegue a las redes. Separar responsabilidades — el Action publica, Inngest sólo distribuye — evita que un fallo de Meta retrase la aparición de la nota.

**Por qué no hay webhook de base de datos:** todo el publishing pasa por el admin custom; no hay un segundo camino. Si en el futuro se publica desde el table editor de Supabase, agregar un Database Webhook sobre la transición de `estado` que dispare el mismo evento. La idempotencia de `social_posts` hace que convivir los dos caminos sea seguro.

**Recuperación manual:** el dashboard del admin muestra el estado por red de cada nota reciente y un botón **"Reintentar"** que re-emite el evento. Como el fan-out es idempotente, reintentar nunca duplica.

### 6.2 Routes

| Método | Path | Descripción | Auth |
|---|---|---|---|
| GET/PUT/POST | `/api/inngest` | Host de las funciones durables | Firma Inngest |
| GET | `/api/og?tipo=nota&slug=` | Imagen OG de nota (`@vercel/og`) | Público |
| GET | `/api/og?tipo=partido&slug=` | Imagen OG con escudos y **resultado** | Público |

El resto del sitio son Server Components leyendo Supabase directo. La búsqueda es una query server-side en `/buscar`, sin endpoint intermedio.

### 6.3 `lib/social/compose.ts` — el copy usa los datos del partido

Acá es donde el auto-posting deja de ser genérico. Como la nota está vinculada a `partido_id`, el copy se arma con datos reales en vez de sólo título + link:

```
Crónica con partido finalizado:
  ⚽ Fecha 11 · Aldosivi 0-1 All Boys
  {bajada}
  🔗 periodicodelfos.com/nota/{slug}
  #Aldosivi #Tiburonas #FútbolFemenino

Análisis con partido programado:
  🔍 Previa Fecha 12 · Aldosivi vs Villa San Carlos
  📅 sábado 15/8, 15:30 · {cancha}
  {bajada}
  🔗 …

Otras categorías:
  {titulo}
  {bajada}
  🔗 …
```

Reglas por red:
- **Facebook:** sin límite práctico. `POST /{page-id}/photos` con `url` (imagen de portada) + `caption`.
- **Instagram:** caption máx. 2200 chars, hasta 30 hashtags. Dos pasos: `POST /{ig-id}/media` con `image_url` + `caption` → `POST /{ig-id}/media_publish`. Si la nota no tiene imagen de portada, usar la OG generada del partido. Límite de la API: 25 publicaciones cada 24h — irrelevante a este volumen.
- **X:** 280 chars. El link consume 23 sin importar su largo. Truncar la bajada, nunca el título ni el link. Imagen vía `v1.1 media/upload` → `POST /2/tweets` con `media.media_ids`.

### 6.4 Contrato de error

```json
{ "error": { "code": "STRING_CODE", "message": "human readable" } }
```

---

## 7. Frontend Architecture

### 7.1 Rutas

| Ruta | Render | Descripción |
|---|---|---|
| `/` | ISR 60s | Portada |
| `/nota/[slug]` | SSG + ISR | Artículo |
| `/cronicas` | ISR | Listado paginado |
| `/analisis` | ISR | Listado paginado |
| `/temporada/[slug]` | ISR | Fixture + tabla + goleadoras (3 pestañas) |
| `/partido/[slug]` | SSG + ISR | Ficha completa |
| `/plantel/[temporadaSlug]` | SSG | Plantel agrupado por posición |
| `/jugadora/[slug]` | SSG | Ficha de jugadora |
| `/quienes-somos`, `/contacto`, `/privacidad` | Estáticas | Institucionales |
| `/buscar?q=` | Dynamic | Resultados |
| `/admin/*` | Dynamic, protegido | Panel |

`generateStaticParams` desde Supabase para notas, partidos y jugadoras.

### 7.2 Portada

**Problema a evitar:** la home de WordPress muestra las mismas 6 notas cuatro veces (hero, grilla, bloque Crónicas, bloque Análisis, recientes del footer). Con ~11 notas publicadas, la portada es un eco de sí misma.

Estructura nueva, **sin repetir ninguna nota**:

1. **`<BarraEstado />`** — fija arriba, siempre visible: último resultado + próximo partido + posición en la tabla. Tres datos, una línea en desktop, scroll horizontal en mobile. Todo desde la base.
2. **Nota principal** — una sola, ancho completo, imagen grande.
3. **Últimas notas** — grilla de 4, excluyendo la principal.
4. **`<FechaAFecha />`** — franja horizontal con los resultados de la temporada actual (chips con escudos y marcador, el próximo destacado). Enlaza a `/partido/[slug]`.
5. **`<Goleadoras />`** — top 5 de la temporada, desde la vista. Cero mantenimiento.
6. **Archivo** — links a `/cronicas`, `/analisis`, `/plantel` y temporadas anteriores.

### 7.3 Nota

```
/nota/[slug] (Server Component)
  Header
  article
    Metadatos            # Categoría · Fecha N · Temporada — NO en el <h1>
    h1                   # Título limpio, sin sufijo
    Bajada               # Obligatoria, escrita a mano
    LíneaAutor + fecha + tiempo de lectura
    ImagenResponsive     # con epígrafe y crédito
    BotonesCompartir     # "use client"
    CuerpoNota           # TipTap JSON → React, server-rendered
    PlanillaPartido      # ← automático si nota.partido_id existe
    CajaAutor            # foto, bio, redes
    NotasRelacionadas    # ← filtradas por la MISMA temporada
  Footer
  JSON-LD NewsArticle
```

Decisiones que corrigen el sitio actual:

- **El `<h1>` va sin el sufijo** `": Fecha N°X – Aldosivi Femenino en la Primera B 2026"`. Ese sufijo hace que *todos* los títulos se trunquen con "…" en la home, en los listados y en el footer. La fecha y la temporada van como metadatos debajo del título.
- **Bajada obligatoria**, escrita a mano. Nunca un extracto automático.
- **Barra de compartir: WhatsApp primero, después Instagram Stories, X y copiar link.** Es la omisión más cara del sitio actual: se distribuye por WhatsApp y no tiene un botón para mandarlo.
- **Notas relacionadas filtradas por temporada.** Hoy aparecen partidos de la Primera C 2024 como si fueran contexto de 2026.
- **Comentarios: fuera.** El formulario actual se come un tercio del scroll. Si se quieren en el futuro, Giscus colapsado detrás de un botón.

### 7.4 Partido — `/partido/[slug]`

Cabecera con escudos y resultado grande. Debajo: `<PlanillaPartido />`, formaciones en dos columnas, datos del partido (cancha, árbitra, fecha), links a la previa y la crónica, e historial contra ese rival.

### 7.5 Temporada, plantel y jugadora

- `/temporada/[slug]`: tres pestañas — **Fixture** (todas las fechas), **Tabla** (última cargada, Aldosivi resaltada), **Goleadoras**.
- `/plantel/[temporadaSlug]`: agrupado por posición con foto, dorsal y nombre.
- `/jugadora/[slug]`: partidos jugados, titularidades, goles con minuto y rival de cada uno, tarjetas, y las notas donde aparece. **Cada jugadora es una URL indexable que hoy no existe: ~32 páginas nuevas de contenido único.**

### 7.6 Admin — la planilla de carga

**El formulario más importante del sistema.** Charlie lo va a usar desde el celular, sentado en la tribuna o en el auto después del partido. Diseñar para pulgar:

- Seleccionar partido → pantalla con botones grandes: **⚽ Gol · 🟨 Amarilla · 🟥 Roja · ⇄ Cambio**.
- Al tocar: selector de minuto (rueda numérica) + selector de jugadora (grilla de fotos con dorsal, **filtrada por las que están en cancha**).
- Los eventos se apilan en una lista editable.
- **Autoguardado en cada evento.** Si se corta la señal: cola local (IndexedDB) y sincronización al recuperar.
- Botón **"Finalizar partido"** que calcula el resultado desde los goles cargados y lo compara con lo ingresado a mano, avisando si no coinciden.

Objetivo concreto: **cargar un partido completo en menos de 3 minutos.**

### 7.7 State Management

- **Server Components por defecto.** Todo el contenido público se renderiza en el servidor leyendo Supabase.
- **`"use client"` sólo en:** `BotonesCompartir`, buscador, y todo `/admin`.
- **TanStack Query sólo en el admin**, donde hay mutaciones optimistas y refetch. El sitio público no lo carga.
- **ISR 60s** + revalidación on-demand desde el Server Action al publicar.

---

## 8. Design System

### Dirección

No es un blog deportivo genérico. Es **un medio de un solo club**, con una identidad que ya existe: verde y amarillo de Aldosivi, logo con pluma y tiburón sobre papel de diario. El diseño tiene que sentirse como una publicación con criterio editorial, no como un template de noticias.

Se descarta el naranja/marrón actual del theme: pelea con el verde y amarillo de todas las fotos del sitio. (También se descarta la paleta rojo + azul pizarra que proponía el blueprint v1, por la misma razón.)

### Tokens — `globals.css`

```css
@theme {
  /* Color — claro */
  --color-verde-900:  #0A3F24;   /* bloques oscuros, footer */
  --color-verde-600:  #0F7A3D;   /* acento principal, links, headers */
  --color-verde-100:  #E4F1E9;   /* fondos suaves, filas alternas */
  --color-amarillo:   #FFC72C;   /* acento secundario, resaltados, tarjeta */
  --color-tinta:      #111614;   /* texto principal */
  --color-gris:       #5B6560;   /* metadatos, epígrafes */
  --color-papel:      #FFFFFF;
  --color-papel-alt:  #F4F6F4;   /* secciones alternas */
  --color-linea:      #DDE2DE;
  --color-roja:       #C42127;   /* tarjeta roja, derrotas */

  /* Tipografía */
  --font-display: "Archivo", system-ui, sans-serif;   /* variable, eje expandido */
  --font-body:    "Source Serif 4", Georgia, serif;   /* cuerpo de las notas */
  --font-data:    "IBM Plex Mono", monospace;         /* minutos, resultados, dorsales */
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-papel:     #0D110F;
    --color-papel-alt: #141A17;
    --color-tinta:     #ECF1EE;
    --color-gris:      #9AA5A0;
    --color-linea:     #26302B;
    --color-verde-600: #34A15E;   /* aclarado para mantener contraste AA sobre fondo oscuro */
    --color-verde-100: #14261C;
  }
}
```

**Por qué esta combinación:** *Archivo* en su eje expandido da titulares con peso de portada deportiva sin caer en el condensado de Oswald que usa medio internet. *Source Serif 4* es una serif de pantalla diseñada para textos largos — el problema número uno del sitio actual es la legibilidad de notas de 800 palabras, y una serif bien seteada lo resuelve mejor que cualquier sans. La mono es para datos: minutos, dorsales y resultados tienen que alinearse en columna.

Fuentes vía `next/font/google` (self-hosted, sin FOUT), subset latino, `font-display: swap`.

### Escala tipográfica y medida

**Regla no negociable — es el arreglo de mayor impacto de todo el proyecto:**

```css
.prose-nota {
  max-width: 68ch;        /* ~65-75 caracteres por línea (hoy: ~140) */
  font-family: var(--font-body);
  font-size: 1.125rem;    /* 18px mobile */
  line-height: 1.7;
}
@media (min-width: 768px) {
  .prose-nota { font-size: 1.1875rem; line-height: 1.75; }
}
```

| Rol | Fuente | Mobile / desktop | Peso |
|---|---|---|---|
| H1 nota | display | 30 / 44px | 700, tracking -0.02em |
| H2 sección | display | 22 / 28px | 600, con filete verde arriba |
| Cuerpo | body | 18 / 19px | 400 |
| Bajada | body | 20 / 22px | 400, italic, color gris |
| Epígrafe | display | 13px | 400, gris |
| Metadatos | display | 13px | 500, mayúsculas, tracking 0.06em |
| Resultado | data | 32 / 48px | 700, `tabular-nums` |

Links en el cuerpo: `--color-verde-600` **con subrayado**. El naranja claro actual no llega al contraste mínimo de WCAG AA.

### Layout

- Escala de espaciado base 4px: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Border radius **2–4px** (estética impresa, esquinas casi rectas). Avatares y fotos de jugadora circulares.
- Contenedor general 1200px; medida de lectura 68ch.
- Breakpoints: sm 640 / md 768 / lg 1024 / xl 1280. **Diseñar a 375px primero.**
- Reglas horizontales de 1px (`--color-linea`) para separar bloques, al estilo diario.
- Sombras mínimas. Predomina la tipografía y las reglas divisorias. Transiciones de 150ms en links y hover de cards, respetando `prefers-reduced-motion`.
- **Áreas táctiles de 44px mínimo**, sin excepción en el admin.

### El elemento distintivo: `<PlanillaPartido />`

El componente firma del sitio: la ficha del partido presentada como una planilla oficial de juego, con una línea de tiempo vertical de 0' a 90'+ y los eventos cayendo a izquierda (Aldosivi) o derecha (rival) según a quién le corresponden.

```
        ALDOSIVI  0 — 1  ALL BOYS
     Fecha 11 · Primera B 2026 · 2 ago
   ─────────────────────────────────────
                 ┌──┐
        ⚽ Cortadi│23'│
                 ├──┤
                 │34'│ 🟨 M. Suárez
                 ├──┤
        🟨 Garro │51'│
                 ├──┤
   ↑ Acosta ↓ Larea│67'│
                 └──┘
   ─────────────────────────────────────
   TITULARES    Díaz · Cassarino · Corona ...
```

Se usa en tres lugares: la página del partido, embebida dentro de la crónica correspondiente (nodo de TipTap), y en versión compacta en la home. **Es lo que ningún otro medio del ascenso tiene, y es lo que hace que el sitio se comparta.**

### Reglas de imagen

- Tres anchos (400/800/1600) en WebP, `srcset` obligatorio, `loading="lazy"` salvo el hero.
- **`alt` es campo requerido en el formulario de carga, no opcional.**
- Las placas de "próximo partido" **no van más como imagen con texto adentro**. Se reemplazan por `<ProximoPartido />` con datos reales: rival, escudo, fecha, hora, cancha. El texto tiene que ser texto (indexable, seleccionable, accesible).
- Miniatura de crónica: **foto de acción, no la foto del once.** A tamaño chico todas las fotos del once son indistinguibles entre sí.
- Generación de los tres anchos: las Image Transformations de Supabase Storage requieren plan Pro. Si se queda en el plan free, generar los tres archivos **en el momento de la subida** (canvas/`sharp` en el Server Action) y guardarlos como objetos separados. Decidir esto en el Step 4 — condiciona el helper `ImagenResponsive`.

---

## 9. Authentication & Authorization

### Modelo

Un solo usuario real (Charlie) con fila en `autores`. Supabase Auth con email + magic link.

- `middleware.ts` protege `/admin/*`: sin sesión → redirect a `/admin/login`.
- El layout del admin **re-verifica en el servidor** que `auth.uid()` tenga fila en `autores`. El middleware solo no alcanza.
- **RLS es la línea de defensa real**, no el middleware: aunque alguien obtenga la anon key (está en el bundle por diseño), no puede escribir nada ni leer borradores.

### Rutas protegidas

| Ruta | Acceso |
|---|---|
| Todo el sitio público | Anónimo |
| `/admin/*` | Sesión + fila en `autores` |
| `/api/inngest` | Firma de Inngest |

### Roles

| Rol | Puede |
|---|---|
| Autor | Todo: notas, partidos, eventos, jugadoras, plantel, tabla, reintentar posteos |
| Lector | Leer contenido publicado y todos los datos deportivos |

---

## 10. Build Order

> **La sección más crítica. Ejecutar en orden; cada paso deja algo funcional y verificable.**
>
> **Arrancar el Step 15 (Meta App Review) en paralelo desde el día 1** — la aprobación de Meta tarda días y es el bloqueo de mayor lead time del proyecto.

### Fase 1 — Fundación

**Step 1 — Scaffolding**
```bash
pnpm create next-app@latest periodico-delfos --typescript --tailwind --app --src-dir --import-alias "@/*"
cd periodico-delfos
pnpm dlx shadcn@latest init
pnpm add zod date-fns lucide-react
```
`tsconfig` en strict, `next.config.ts` con `images.remotePatterns` apuntando al dominio de Supabase Storage.

**Step 2 — Supabase: schema completo**
Crear el proyecto y correr las migraciones `0001`–`0009` de la sección 4, en orden. Generar tipos: `pnpm dlx supabase gen types typescript --project-id … > src/lib/supabase/types.ts`. Crear el bucket `media` público. **Verificar RLS con un cliente anónimo antes de seguir:** una nota en borrador no debe ser legible.

**Step 3 — Clientes y queries**
`lib/supabase/{client,server,admin}.ts` y `lib/supabase/queries/*`. Todas las queries centralizadas ahí; **nunca inline en un componente**.

**Step 4 — Design system + layout**
Fuentes con `next/font`, tokens en `globals.css` (`@theme` + variantes dark), `Header`, `Footer`, root layout con `lang="es-AR"`. Resolver acá la decisión de transformación de imágenes (Pro vs. tres archivos al subir) y construir `ImagenResponsive`.

**Step 5 — Auth + shell del admin**
Supabase Auth, `middleware.ts`, layout de `/admin` con verificación server-side, `/admin/login`.

**Step 6 — Migración de WordPress**
`scripts/migrate-wp.ts` completo (sección 5). Correrlo contra el proyecto de Supabase. Revisar a mano el listado de notas sin bajada y escribirlas. Generar `redirects.json` → `vercel.json`.

### Fase 2 — Sitio público de lectura

> *A partir del final de esta fase, el sitio nuevo ya es mejor que el viejo y se puede lanzar.*

**Step 7 — Editor de notas**
`/admin/notas` (listado, filtros por estado) y `/admin/notas/[id]` con TipTap. Extensiones: encabezados, negrita/itálica, links, blockquote, imagen con epígrafe y crédito. `alt` obligatorio validado con Zod. Guardado de borradores.

**Step 8 — Página de nota**
`CuerpoNota` (renderer de TipTap JSON server-side), `Bajada`, `ImagenResponsive`, `BotonesCompartir` (client), `CajaAutor`, `NotasRelacionadas` filtradas por temporada. `generateStaticParams`. Metadata dinámica + JSON-LD `NewsArticle`.

**Step 9 — Portada y listados**
Portada según 7.2 pero **sin** `BarraEstado`, `FechaAFecha` ni `Goleadoras` (todavía no hay datos deportivos): nota principal + últimas 4 + archivo. `/cronicas` y `/analisis` con paginación. Estados vacíos escritos.

**Step 10 — Institucionales + SEO técnico**
`/quienes-somos`, `/contacto`, `/privacidad`. `sitemap.ts` desde Supabase, `robots.ts`, `rss.xml`, `/api/og`, canonicals. **Corregir los links rotos del footer**: hoy Cookies apunta a `/blog/`, Términos a `/contact-2/` y Contacto a `/contact-3/` (restos del demo import del theme). **Todos los strings en español** — el sitio actual tiene "Useful Links", "Read More" y "You May Also Like" en inglés.

**Step 11 — Deploy + redirecciones**
Deploy en Vercel, dominio, `vercel.json` con las 301. **Verificar una por una** con `curl -I`. Este es el punto de no retorno: a partir de acá el sitio nuevo es el de producción.

### Fase 3 — Datos deportivos

**Step 12 — CRUD de entidades**
`/admin/jugadoras`, equipos, `/admin/plantel/[temporadaId]`, `/admin/partidos`, `/admin/tabla/[temporadaId]`. Formularios con React Hook Form + Zod. Cargar la temporada 2026 completa: equipos, jugadoras, plantel, fixture.

**Step 13 — La planilla de carga** ★
`/admin/partidos/[id]/planilla` según 7.6: botones grandes, selector de minuto, grilla de jugadoras, lista editable, autoguardado, cola offline en IndexedDB, "Finalizar partido" con verificación de resultado. **Probarlo en un celular real, no en el emulador.** Cronometrar la carga de un partido: si pasa de 3 minutos, iterar antes de seguir.

**Step 14 — Páginas deportivas públicas**
`<PlanillaPartido />` y `<PlanillaCompacta />`, `/partido/[slug]`, `/temporada/[slug]` (fixture + tabla + goleadoras), `/plantel/[temporadaSlug]`, `/jugadora/[slug]` desde la vista `estadisticas_jugadora`. JSON-LD `SportsEvent` y `Person`. Insertar `<PlanillaPartido />` automáticamente en las notas con `partido_id`.

### Fase 4 — Distribución automática

**Step 15 — Integración Meta (Facebook + Instagram)** *(el review arranca en el día 1)*
- Crear **App de Meta** (tipo Business); agregar *Facebook Login* + *Instagram Graph API*.
- Vincular la **Página de Facebook** con la **cuenta de Instagram Business**.
- Obtener **Page Access Token de larga duración** e `IG Business Account ID`.
- Implementar `lib/social/facebook.ts` y `lib/social/instagram.ts` (2 pasos: `/media` → `/media_publish`).
- Permisos a pedir en App Review: `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`.
- Verificar el dominio en Meta Business (acelera el review).

**Step 16 — Integración X (API v2)**
Crear la app en el X Developer Portal (tier **Basic**), credenciales OAuth 1.0a. `lib/social/x.ts`: `v1.1 media/upload` → `POST /2/tweets`. Respetar 280 chars.

**Step 17 — `compose.ts` + Inngest**
```bash
pnpm add inngest
```
`lib/social/compose.ts` con las variantes de copy de 6.3 (usando datos del partido). `lib/inngest/client.ts`, `app/api/inngest/route.ts`, `functions/nota-publicada.ts` con el fan-out, idempotencia y reintentos. Probar local con `npx inngest-cli dev`, **primero en modo dry-run** (loguea e inserta en `social_posts` sin postear de verdad).

**Step 18 — Cablear la publicación real**
Server Action `publicarNota()` (update + revalidate + `inngest.send`). `EstadoPosteos` en el dashboard del admin con el botón "Reintentar". Publicar una nota real de prueba y verificar las tres redes.

### Fase 5 — Integración y cierre

**Step 19 — Integrar lo deportivo en la portada**
`<BarraEstado />`, `<FechaAFecha />`, `<Goleadoras />`. Nodo de TipTap para embeber la planilla manualmente. OG dinámico de partidos con el resultado. Buscador (`/buscar`).

**Step 20 — E2E + auditorías**
Playwright sobre los flujos críticos. Auditoría de SEO, accesibilidad (contraste AA, foco visible, jerarquía de headings) y performance (LCP < 2.5s en 4G simulado).

**Step 21 — Carga histórica 2024**
Partidos, formaciones y eventos de la temporada anterior desde el admin. No bloquea el lanzamiento.

---

## 11. Environment Setup

### Prerequisites

- Node.js 20+ y pnpm 9+
- Cuentas: Supabase, Vercel, Inngest, Meta for Developers, X Developer Portal
- Página de Facebook + cuenta de Instagram **Business** vinculadas
- Dominio `periodicodelfos.com` (ya adquirido)
- **Costos recurrentes a prever:** X API tier Basic (~US$100/mes) y, si se usan las Image Transformations, Supabase Pro (~US$25/mes). Inngest y Vercel entran en free tier a este volumen.

### Environment Variables

| Variable | Descripción | Dónde se saca |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://periodicodelfos.com` | — |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (pública por diseño; RLS la contiene) | Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role — **sólo server** | Supabase |
| `INNGEST_EVENT_KEY` | Envío de eventos | Inngest dashboard |
| `INNGEST_SIGNING_KEY` | Firma de funciones | Inngest dashboard |
| `META_APP_ID` / `META_APP_SECRET` | Credenciales de la app | developers.facebook.com |
| `FACEBOOK_PAGE_ID` | ID de la Página | Graph API Explorer |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | Token de Página de larga duración | Graph API |
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | ID de la cuenta IG Business | Graph API |
| `X_API_KEY` / `X_API_SECRET` | Consumer keys | X Developer Portal |
| `X_ACCESS_TOKEN` / `X_ACCESS_TOKEN_SECRET` | Tokens OAuth 1.0a | X Developer Portal |
| `WP_MIGRATION_SOURCE` | `https://periodicodelfos.com` | Sólo para el script de migración |

### Comandos iniciales

```bash
pnpm install
cp .env.example .env.local        # completar
pnpm dlx supabase db push         # migraciones
npx inngest-cli dev               # terminal aparte
pnpm dev                          # http://localhost:3000
```

---

## 12. Dependencies

### Core
| Paquete | Para qué |
|---|---|
| next / react / react-dom | Framework y runtime |
| typescript | Tipado estricto |
| tailwindcss (v4) | Estilos |
| @supabase/supabase-js / @supabase/ssr | Cliente y manejo de sesión en App Router |
| @tiptap/react / @tiptap/starter-kit / @tiptap/html | Editor y conversión HTML→JSON |
| @tanstack/react-query | Estado del admin |
| react-hook-form / @hookform/resolvers / zod | Formularios y validación |
| inngest | Jobs durables / auto-posting con reintentos |
| date-fns | Fechas en es-AR |
| lucide-react | Íconos |
| @vercel/og | Imágenes Open Graph dinámicas |

### Dev
| Paquete | Para qué |
|---|---|
| @playwright/test | E2E |
| vitest | Unit (compose, formato, seo) |
| supabase (CLI) | Migraciones y generación de tipos |
| inngest-cli | Dev server local |
| eslint / prettier | Linting y formato |

---

## 13. Deployment Strategy

- **Vercel.** `main` → producción; ramas → preview deploys. Build `pnpm build`.
- **DNS:** `periodicodelfos.com` apuntado a Vercel, SSL automático. Verificar el dominio también en **Meta Business**.
- **`vercel.json`** con las 301 generadas por el script de migración. Auditar que ninguna URL vieja devuelva 404.
- **Inngest** detecta el endpoint `/api/inngest` en el deploy y sincroniza las funciones.
- **Entornos:** dev local con Inngest CLI + proyecto Supabase de staging; producción con la Meta App en modo Live.
- **Orden de corte:** desplegar y verificar el sitio nuevo en un dominio de preview → verificar redirecciones → recién ahí mover el DNS.

---

## 14. Testing Strategy

### Unit (Vitest)
- `lib/social/compose.ts`: armado y truncado del copy por red, especialmente el límite de 280 de X con link.
- `lib/formato.ts`: fechas es-AR, minutos con adicionado, resultados.
- Regex de limpieza de títulos del script de migración.

### Integration
- **Idempotencia:** disparar el fan-out dos veces sobre la misma nota no genera dos posteos (constraint `(nota_id, platform)`).
- **RLS:** un cliente anónimo no lee borradores ni escribe nada. Test explícito por tabla.
- **Vistas:** `goleadoras` y `estadisticas_jugadora` contra un dataset semilla con valores conocidos.
- Mockear Meta y X. **Nunca pegarle a las APIs reales en tests.**

### E2E (Playwright)
1. Portada renderiza notas, barra de estado y goleadoras.
2. Una nota carga con título, cuerpo, bajada, autor, meta tags y JSON-LD.
3. Una nota con `partido_id` muestra la planilla embebida.
4. `/jugadora/[slug]` muestra estadísticas correctas.
5. Búsqueda devuelve resultados.
6. **Carga de un partido completo desde la planilla en viewport de 375px** — el flujo más importante, y el que más fácil se rompe.

---

## 15. CLAUDE.md del proyecto

```markdown
# Periódico Delfos

Medio digital de Mar del Plata dedicado al fútbol femenino de Aldosivi. Un solo autor.
Migración desde WordPress. El corazón del proyecto es estructurar los datos del partido
(goles, formaciones, tarjetas, goleadoras) para que no se escriban a mano dentro del texto
de las notas. Al publicar, cada nota se auto-postea a Facebook, Instagram y X.

## Commands
- `pnpm dev` — Desarrollo
- `pnpm build` / `pnpm lint` / `pnpm test`
- `npx inngest-cli dev` — Auto-posting local
- `pnpm dlx supabase db push` — Migraciones
- `pnpm dlx supabase gen types typescript --project-id … > src/lib/supabase/types.ts`

## Tech Stack
Next.js 15 (App Router) + TypeScript strict + Tailwind v4 + shadcn/ui + Supabase
(Postgres/Auth/Storage/RLS) + TipTap + Inngest + Meta Graph API & X API v2 + Vercel.

## Architecture
- `src/app/` — Rutas públicas + `/admin`
- `src/components/` — layout, content, partido, temporada, jugadora, admin, ui
- `src/lib/` — supabase/, tiptap/, social/, inngest/, seo.ts, formato.ts
- `src/actions/` — Server Actions (publicar, eventos)
- `supabase/migrations/` — Schema completo
- `scripts/` — migrate-wp.ts, generate-redirects.ts

### Data Flow
Lectura: Server Components → Supabase (ISR 60s). Publicación: Server Action actualiza
`notas`, revalida las rutas y emite `nota/publicada` a Inngest; la función durable hace
fan-out a FB/IG/X con reintentos e idempotencia vía `social_posts`. Nada de posteo inline.

### Key Patterns
- Server Components por defecto. `"use client"` sólo en BotonesCompartir, buscador y /admin.
- Todas las queries en `lib/supabase/queries/*`. Nunca inline en un componente.
- Todo posteo pasa por `lib/social/*` y se registra en `social_posts` (un row por red por nota).
- Idempotencia: chequear `social_posts (nota_id, platform)` antes de postear.
- `SUPABASE_SERVICE_ROLE_KEY` y tokens de redes: SOLO server.

## Code Organization Rules
1. Un componente por archivo. Máx 300 líneas; si crece, extraer subcomponentes.
2. Path alias `@/` para `src/`.
3. Sin barrel exports; importar del archivo fuente.
4. Componentes específicos de una página, junto a su page.

## Design System
- Verde 900 `#0A3F24` · Verde 600 `#0F7A3D` · Verde 100 `#E4F1E9` · Amarillo `#FFC72C`
- Tinta `#111614` · Gris `#5B6560` · Papel `#FFFFFF` / `#F4F6F4` · Línea `#DDE2DE` · Roja `#C42127`
- Titulares: Archivo (expandido) · Cuerpo: Source Serif 4 · Datos: IBM Plex Mono
- Cuerpo 18/19px, line-height 1.7, **máx 68ch**. Radius 2–4px. Base de espaciado 4px.
- Mobile-first a 375px. Áreas táctiles 44px mínimo.

## Reglas No Negociables
1. TypeScript strict, prohibido `any`. Usar los tipos generados de Supabase.
2. Ningún dato deportivo se escribe a mano dentro del texto de una nota. Va a la base.
3. La medida de lectura de las notas es 68ch. No negociable — es el arreglo de mayor impacto.
4. `alt` de imagen es campo requerido, validado con Zod. No opcional.
5. Todo posteo a redes es idempotente vía `social_posts (nota_id, platform)`.
6. Instagram exige `image_url` HTTPS pública → siempre URL del bucket, nunca un blob local.
7. Secrets sólo server-side. RLS habilitado en todas las tablas.
8. Toda URL vieja de WordPress redirige 301. No romper links.
9. Todo string en español, `lang="es-AR"`.
10. No commitear `.env*`.
```

---

## 16. Reglas No Negociables (para el builder)

1. **Ningún dato deportivo se escribe a mano dentro del texto de una nota.** Goles, formaciones, posiciones y estadísticas van a la base y se renderizan desde componentes. Esta regla es el proyecto entero.
2. **Medida de lectura 68ch, cuerpo 18px, line-height 1.7.** Es el arreglo de mayor impacto y no se negocia por razones de layout.
3. **La planilla de carga se prueba en un celular real** y se cronometra. Si un partido tarda más de 3 minutos, se itera antes de avanzar.
4. **Todas las URLs viejas de WordPress redirigen 301**, verificadas una por una antes de mover el DNS.
5. **Idempotencia obligatoria:** un row por `(nota_id, platform)`; verificar antes de postear. Nunca doble post.
6. **No postear inline** en el request del Server Action. Siempre vía Inngest. La revalidación sí va en el Action, para que el sitio esté actualizado antes de que el link salga a las redes.
7. **Instagram exige `image_url` HTTPS pública** — siempre URL del bucket `media`, nunca un blob local ni una URL firmada con expiración.
8. **RLS habilitado en todas las tablas**, con test explícito de que un cliente anónimo no lee borradores ni escribe. El middleware no es la defensa; RLS sí.
9. **Secrets sólo server-side.** `SUPABASE_SERVICE_ROLE_KEY` y tokens de Meta/X jamás en componentes cliente ni en variables `NEXT_PUBLIC_*`.
10. **`alt` es requerido**, validado con Zod en el formulario de carga.
11. **Empezar el Meta App Review en el día 1.** Es el bloqueo de mayor lead time del proyecto y no depende de que el código esté listo.
12. **Estados vacíos escritos, nunca una pantalla en blanco.** "Todavía no hay crónicas de esta temporada" con un link a lo que sí hay.
13. **TypeScript strict, sin `any`.** Un componente por archivo, máx 300 líneas.
14. **No commitear `.env*`.**

---

## 17. Skills sugeridas durante el build

| Skill | Cuándo | Para qué |
|---|---|---|
| `ecc:postgres-patterns` | Step 2 | Revisar el schema, índices y las vistas antes de congelarlo |
| `ecc:database-migrations` | Step 2 | Ordenar y versionar las migraciones |
| `ecc:design-system` | Step 4 | Tokens, escala tipográfica, variantes dark |
| `ecc:frontend-design-direction` | Steps 8, 9, 14 | Nota, portada y `<PlanillaPartido />` |
| `ecc:accessibility` | Steps 4, 20 | Contraste AA, foco, jerarquía de headings |
| `ecc:seo` | Steps 10, 20 | Sitemap, JSON-LD, auditoría post-deploy |
| `ecc:security-review` | Steps 5, 18 | RLS, manejo de secrets, superficie del admin |
| `ecc:deep-research` | Steps 15, 16 | Confirmar endpoints y permisos vigentes de Graph API y X API v2 al momento de construir |
| `ecc:e2e-testing` | Step 20 | Playwright sobre los flujos críticos |

---

> Fin del blueprint v2. Un agente de Claude Code puede construir Periódico Delfos de punta a punta siguiendo el Build Order (sección 10) sin contexto adicional.
