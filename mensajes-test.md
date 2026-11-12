# Mensajes y códigos, situación por situación

**Fecha de la medición:** 12/11/2026 · **Contra:** `https://periodico-delfos.vercel.app`
y el proyecto de Supabase de `.env.local` · **Rama:** `main` (`0fada3f`)

> **Qué es esto.** La tabla de "qué mensaje recibo en cada situación", medida y no
> supuesta. Sirve para dos cosas: saber qué tiene que ver el usuario cuando algo
> sale mal, y saber qué código HTTP tiene que afirmar un test para cada caso.
>
> Los datos crudos de la corrida —método, URL, código, tiempo y cuerpo de cada
> uno de los 18 casos— están en
> [`evidencias/EV-HTTP-2026-11-12.json`](evidencias/EV-HTTP-2026-11-12.json).
> El criterio de códigos es el de la clase 8 de Metodología de Sistemas de Pruebas.

---

## 1. El panel de login

El login del panel es un **Server Action**. Importa para los tests: cuando el
login falla, la respuesta HTTP es **200** y el error viaja adentro del payload.
No hay un 401 que afirmar a este nivel — lo verificable es el mensaje, la URL y
que no se haya creado sesión.

| Situación | Mensaje que recibís | De dónde sale | HTTP |
|---|---|---|---|
| Mail vacío | Cartel del navegador ("Completá este campo"), foco al campo Mail | Navegador (`required`) | **no hay petición** |
| Mail puesto, sin contraseña | "Faltan el mail o la contraseña" | Server Action | 200 |
| Contraseña incorrecta | "No pudimos entrar con esos datos" | Server Action | 200 |
| Mail que no tiene cuenta | "No pudimos entrar con esos datos" | Server Action | 200 |
| Datos correctos | Sin mensaje: entrás a `/admin` o a la pantalla de la que te echaron | — | 200 + redirección |
| Pediste el link por mail | "Te mandamos un link por mail. Vale por una hora." | Server Action | 200 |
| El link no se pudo enviar | "No pudimos mandar el link. Probá con la contraseña." | Server Action | 200 |
| Link vencido o ya usado | "Ese link no sirve más. Los links valen una hora y un solo uso: pedí uno nuevo." | `?error=link` en la página | 200 |
| Magic link sin mail | "Falta el mail" | Server Action | 200 |
| `/admin` sin sesión | Sin mensaje: redirige al login guardando de dónde venías | `src/middleware.ts` | **307** |

**El mensaje de "contraseña incorrecta" y el de "mail inexistente" son idénticos
a propósito.** Distinguirlos le confirmaría a cualquiera qué mails tienen cuenta
en el panel. Está escrito así en
[`src/actions/sesion.ts`](src/actions/sesion.ts) y hay un test que se pone rojo
si alguien lo "mejora".

**Tras un intento fallido se crean 0 cookies de sesión.** Medido, no deducido.

---

## 2. El sitio público

| Situación | Mensaje que recibís | HTTP |
|---|---|---|
| Portada | — | 200 |
| Nota que no existe | Pantalla "No encontramos", en español, con salidas | **404** |
| Ruta que no existe | Pantalla "No encontramos", en español | **404** |
| Búsqueda sin resultados | "No hay notas que coincidan con **tu búsqueda**." + link a todas las crónicas | **200** |
| `rss.xml` | XML del feed | 200 (0,58 s) |
| URL vieja de WordPress | Te lleva a `/nota/<slug>` | **308** |
| `/api/inngest` | `{"code":"internal_server_error"}` | **500 — defecto abierto** |

**Una búsqueda sin resultados es 200 y no 404.** El recurso `/buscar` existe y la
respuesta informa que no hay nada; contestar 404 sacaría la página del índice.
Es el caso que alguien "arregla" por error al leer los de arriba.

**El 308 de las redirecciones de WordPress es correcto.** Lo emite Vercel por
`"permanent": true` en `vercel.json` (82 redirecciones). Es el permanente que
además preserva el método; para un buscador equivale al 301 que pide la materia.

**El 404 sólo se ve pidiendo el documento**: URL escrita a mano, F5, o un enlace
desde afuera. Navegando por dentro del sitio, Next pide un payload interno
(`?_rsc=`) que responde 200 con el contenido del 404 adentro. No es un defecto:
es su protocolo de navegación sin recarga.

---

## 3. La API de Supabase

El formato es siempre el mismo objeto JSON. En PostgREST viene con `code`,
`details`, `hint` y `message`; en Auth, con `code`, `error_code` y `msg`.

| Situación | Código del cuerpo | Mensaje | HTTP |
|---|---|---|---|
| Notas publicadas con la anon key | — | Lista | 200 |
| Borradores sin sesión | — | `[]` (RLS los filtra) | 200 |
| Escribir sin sesión | `42501` | "new row violates row-level security policy" | **401** |
| Fecha mal formada en un filtro | `22007` | "invalid input syntax for type timestamp with time zone" | **400** |
| Contraseña incorrecta | `invalid_credentials` | "Invalid login credentials" | **400** |
| Campos vacíos | `validation_failed` | "missing email or phone" | **400** |
| Token inválido o vencido | `PGRST301` | "None of the keys was able to decode the JWT" | **401** |
| Evento con minuto 121 | `23514` | "violates check constraint `minuto_valido`" | **400** |
| Mismo id dos veces | `23505` | "duplicate key value violates unique constraint `eventos_pkey`" | **409** |
| Borrar una fila | — | Sin cuerpo | 204 |

**Supabase tiene sus propias convenciones y no coinciden con la materia en dos
puntos, los dos coherentes.** Ante contraseña incorrecta, GoTrue devuelve **400**
y no el 401 que enseña la materia: reserva el 401 para el token ausente o
ilegible, que es exactamente lo que devuelve el caso del token inválido. Y ante
una escritura bloqueada por RLS, PostgREST devuelve **401** donde un 403 sería
más preciso, porque la anon key sí está autenticada, como rol `anon`. Ninguno de
los dos es un defecto: son 4xx con mensaje claro y formato fijo.

**Ninguna de las nueve situaciones devolvió 500.** Es la regla de la materia que
más importa: un 500 nunca es un resultado esperado.

---

## 4. Qué verifica el test automatizado, y en qué nivel

[`e2e/admin.login.spec.ts`](e2e/admin.login.spec.ts) — proyecto `login` de
Playwright, 8 casos, **8 passed (30,0 s)** al 12/11/2026.

```bash
pnpm build && pnpm test:e2e --project=login e2e/admin.login.spec.ts
```

Cubre: redirección sin sesión con `?volver=`, validación del navegador antes de
enviar, falta de contraseña, contraseña equivocada, mail inexistente, ingreso
correcto, vuelta a la pantalla de origen y cierre de sesión real.

**Afirma en el nivel correcto.** Como el Server Action responde 200 aunque el
login falle, el test afirma sobre el mensaje `role="alert"` y sobre la URL, no
sobre el código. Un `expect(status).toBe(401)` acá estaría rojo siempre.

**Lo que le falta** es el nivel de la API de Auth: no hay ningún assert sobre el
`400 / invalid_credentials` ni sobre el `401` del token inválido. Hoy eso se
verifica a mano y no corre en CI — es el riesgo R-01 de
[`REPORTE_PRUEBAS.md`](REPORTE_PRUEBAS.md), el medio vacío de la pirámide.

> **Una trampa del arnés.** Antes de creerle a un rojo, rebuildear. La suite
> levanta su propio `next start` en el 3100 y falla ruidosamente si el puerto
> está ocupado; para correr contra otro servidor va
> `E2E_BASE_URL=http://localhost:3130 pnpm test:e2e`.

---

## 5. Defectos vivos al 12/11/2026

| ID | Defecto | Prioridad | Estado |
|---|---|---|---|
| DEF-09 | `/api/inngest` responde 500: falta `INNGEST_SIGNING_KEY` en Vercel. Sin auto-posteo ni notas programadas | **Alta** | **Abierto** — reconfirmado hoy |
| DEF-02 + DEF-05 | Las páginas inexistentes devolvían 200 con la pantalla de 404, y en inglés | Alta | **Cerrado** — verificado hoy |

DEF-09 se cierra cargando la variable en el panel de Vercel: es configuración
del entorno de despliegue, no toca el repositorio. Es el único bloqueante que
queda del criterio de salida.
