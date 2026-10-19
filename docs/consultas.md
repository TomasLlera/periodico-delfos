# Consultas sobre el proyecto

Registro de las preguntas hechas sobre el código, con la respuesta que salió de
**leerlo** y lo que queda por **comprobar contra la base real**. Ninguna de estas
respuestas se probó con Supabase andando: cuando se escribieron no había
proyecto ni `.env.local`.

Cada consulta termina con una lista "Verificar con la base". Marcarla a medida
que se prueba y anotar el resultado al lado, sobre todo si contradice lo que
dice la respuesta.

## Antes de verificar

1. Copiar `.env.example` a `.env.local` y completar como mínimo
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y
   `SUPABASE_SERVICE_ROLE_KEY`.
2. `pnpm install` y `pnpm dev`. El sitio queda en `http://localhost:3000`.
3. Para los `curl` de abajo, dejar las dos variables en la terminal (Git Bash):

   ```sh
   export SB_URL="https://<proyecto>.supabase.co"
   export SB_ANON="<anon key>"
   ```

---

## 1. Instalar Node y levantar el servidor

**Respuesta.** Node ya estaba (v26.12.0). Faltaba pnpm, que es el gestor del
proyecto: `npm install -g pnpm@11.1.2` (la versión de `packageManager`), después
`pnpm install` y `pnpm dev`. La portada responde 200 sin base, pero todo lo que
lee datos sale vacío.

**Verificar con la base**

- [ ] Con `.env.local` completo, la portada, una nota, un partido y `/admin/login`
      cargan con datos reales.

---

## 2. ¿Está separado en capas? Patrones y arquitectura

**Respuesta.** Monolito por capas sobre Next.js 15 (App Router), con la lógica
de negocio en funciones puras y los efectos en los bordes (*functional core,
imperative shell*).

| Capa | Dónde |
|---|---|
| Presentación | `src/app/`, `src/components/` |
| Aplicación (comandos) | `src/actions/` (Server Actions) |
| Dominio puro | `src/lib/entidades/`, `src/lib/partido.ts`, `temporada.ts`, `social/fanout.ts`… |
| Lecturas | `src/lib/supabase/queries/` |
| Infraestructura | clientes de Supabase, Inngest, `social/redes.ts`, `cola-idb.ts` |
| Base | `supabase/migrations/` (constraints, vistas, RLS) |

Patrones: CQRS liviano (lecturas en `queries/*`, escrituras en `actions/*`),
repositorio simple sin interfaces, esquema Zod + mapper por entidad, Result en
vez de excepciones, Strategy en `publicadorDe()` con dry-run como objeto nulo,
eventos con Inngest para el fan-out a redes, idempotencia por
`social_posts (nota_id, platform)`, cola offline en IndexedDB para la planilla,
inyección de dependencias por parámetro (`entorno`).

Puntos flojos: las Server Actions escriben con `supabase.from(...)` directo (las
lecturas sí están encapsuladas), no hay inversión de dependencias respecto de
Supabase, y la lógica pura está repartida entre `lib/entidades/` y `lib/*.ts`.

**Verificar con la base**

- Nada específico: es una pregunta sobre la estructura del código.

---

## 3. ¿La página soporta 10.000 peticiones a la vez?

**Respuesta.** Depende de la ruta, y nunca se midió.

- **Rutas cacheadas (ISR)**: la portada y las páginas estáticas salen de la CDN
  de Vercel. Un pico de 10.000 no llega a la base.
- **Rutas que van a la base en cada visita**:
  - `/nota/[slug]`, `/partido/[slug]`, `/plantel/[temporadaSlug]`,
    `/jugadora/[slug]`: declaran `revalidate = 60`, pero sus queries
    (`getNotaPorSlug`, `getPartidoPorSlug`, …) usan `createClient()`, que lee
    `cookies()` y vuelve dinámica la ruta. Es la trampa que ya anota
    `HANDOFF.md`. `/nota` es la que se comparte en redes, así que es la que
    recibiría el pico.
  - `/cronicas`, `/analisis`, `/temporada/[slug]`, `/buscar`: leen
    `searchParams`, son dinámicas siempre.
- En esas rutas, 10.000 visitas son ~10.000 funciones serverless (Vercel escala)
  y ~20–30.000 consultas a un Postgres con un pool de decenas de conexiones:
  lo esperable es cola, timeouts y 500.

**Arreglo propuesto (no aplicado).** Que las queries públicas usen
`createStaticClient()` —el visitante es anónimo y RLS aplica igual—, como ya
hacen `getEstadoDelSitio()` y la portada. Para la paginación, pasar la página a
la ruta (`/cronicas/2`) en vez de `?pagina=2`.

**Verificar con la base**

- [ ] `pnpm build` con la base cargada: anotar qué rutas salen `○`/`●`
      (estáticas/ISR) y cuáles `ƒ` (dinámicas). Confirmar que `/nota/[slug]` y
      `/partido/[slug]` salen `ƒ`, o que el build corta con *"Dynamic server
      usage"* en `generateStaticParams`.
- [ ] Prueba de carga contra un **preview de Vercel**, no contra localhost
      (`pnpm dev` no cachea y mide otra cosa):

      ```sh
      npx autocannon -c 500 -d 30 https://<preview>.vercel.app/
      npx autocannon -c 500 -d 30 https://<preview>.vercel.app/nota/<slug>
      ```

      Comparar latencia y errores entre la portada y una nota. Mirar en
      Supabase → Reports cuántas consultas llegaron durante cada prueba.
- [ ] Repetir las dos mediciones después de pasar las queries públicas a
      `createStaticClient()`.

---

## 4. ¿Qué pasa si alguien entra al código o a la base desde la consola del navegador?

**Respuesta.** Ve lo mismo que un visitante y no puede escribir nada. La
protección es RLS en la base, no el navegador.

- **Se ve**: el JS/CSS/HTML del cliente, la URL de Supabase y la anon key
  (públicas por diseño, `NEXT_PUBLIC_*`).
- **No se ve**: el código de servidor (actions, queries, Inngest, migraciones),
  la `SUPABASE_SERVICE_ROLE_KEY` ni los tokens de redes (sin `NEXT_PUBLIC_`, Next
  no los mete en el bundle).
- **Con la anon key** (según `0008_rls.sql` y `0014_roles_de_autor.sql`): lee
  sólo notas publicadas y datos deportivos; no lee borradores ni
  `social_posts`; no escribe ninguna tabla ni el bucket `media` (todo exige
  `es_autor()`). La tabla `autores` es pública pero no tiene mail.
- **Server Actions**: son endpoints POST que se pueden llamar a mano. Las 15
  chequean sesión con `getAutorDeLaSesion()` y rol `editor` donde hace falta.
  El magic link usa `shouldCreateUser: false`.

**Pendientes encontrados**

1. Desactivar el registro público en Supabase (Auth → Settings → *Allow new
   users to sign up*). Con la anon key cualquiera puede llamar a `signUp()` y
   crear cuentas basura; no hacen nada por RLS, pero ensucian `auth.users`.
2. Confirmar que RLS quedó aplicado en producción (Security Advisor).
3. Cargar `INNGEST_SIGNING_KEY` en Vercel: es lo que protege `/api/inngest`.
4. Agregar `import 'server-only'` a `src/lib/supabase/admin.ts`, para que el
   build falle si alguien lo importa desde el cliente.
5. Mantener privado el repo de GitHub.

**Verificar con la base**

Cada `curl` usa sólo la anon key, es decir, lo mismo que tiene cualquiera que
abra la consola.

- [ ] Leer notas publicadas — **debe devolver filas**:

      ```sh
      curl "$SB_URL/rest/v1/notas?select=slug,estado&limit=3" \
        -H "apikey: $SB_ANON" -H "Authorization: Bearer $SB_ANON"
      ```

- [ ] Leer borradores — **debe devolver `[]`**:

      ```sh
      curl "$SB_URL/rest/v1/notas?select=slug&estado=neq.publicada" \
        -H "apikey: $SB_ANON" -H "Authorization: Bearer $SB_ANON"
      ```

- [ ] Leer `social_posts` — **debe devolver `[]`**:

      ```sh
      curl "$SB_URL/rest/v1/social_posts?select=*" \
        -H "apikey: $SB_ANON" -H "Authorization: Bearer $SB_ANON"
      ```

- [ ] Escribir — **debe fallar** (`401`/`403`, *row-level security*):

      ```sh
      curl -X POST "$SB_URL/rest/v1/equipos" \
        -H "apikey: $SB_ANON" -H "Authorization: Bearer $SB_ANON" \
        -H "Content-Type: application/json" \
        -d '{"nombre":"Prueba","nombre_corto":"Prueba","slug":"prueba-rls","es_aldosivi":false}'
      ```

- [ ] Borrar — **debe afectar 0 filas** (devuelve `[]` con
      `Prefer: return=representation`):

      ```sh
      curl -X DELETE "$SB_URL/rest/v1/partidos?id=not.is.null" \
        -H "apikey: $SB_ANON" -H "Authorization: Bearer $SB_ANON" \
        -H "Prefer: return=representation"
      ```

- [ ] Registro público — **después de desactivarlo debe fallar**
      (*Signups not allowed*). Si crea el usuario, borrarlo desde Auth → Users:

      ```sh
      curl -X POST "$SB_URL/auth/v1/signup" \
        -H "apikey: $SB_ANON" -H "Content-Type: application/json" \
        -d '{"email":"prueba-rls@example.com","password":"una-clave-larga-123"}'
      ```

- [ ] Server Actions sin sesión: entrar al panel, abrir un formulario de
      edición, cerrar sesión en otra pestaña y guardar. **Debe responder** *"Se
      cerró la sesión. Entrá de nuevo."* sin escribir nada.
- [ ] Con un autor de rol distinto de `editor`: intentar dar de alta un autor o
      tocar sponsors. **Debe negarse.**
- [ ] Buscar la service role en el bundle — **no debe aparecer**: en
      DevTools → Sources, Ctrl+Shift+F con el principio de la clave, o
      `grep -r "<principio de la clave>" .next/static` después de `pnpm build`.
- [ ] Supabase → Advisors → Security: **sin tablas sin RLS**.
