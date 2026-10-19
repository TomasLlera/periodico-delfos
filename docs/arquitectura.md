# Qué usa el proyecto y por qué

Resumen de las decisiones de arquitectura de Periódico Delfos: qué patrón usa
cada parte y la razón. Las razones salen de `periodico-delfos-blueprint-v2.md`
y de `HANDOFF.md`; donde la razón es una inferencia y no está escrita en esos
documentos, se aclara.

Escrito el 19/10/2026, a partir de las consultas 2 y 8 de `docs/consultas.md`.

## El contexto que explica casi todo

- Un medio con **un solo periodista**, que migra desde WordPress.
- Lectores **en el celular, con 4G, que llegan desde Instagram o WhatsApp**.
- El objetivo central: que los datos del partido (goles, formaciones, tabla)
  **dejen de escribirse a mano dentro de las notas** y vivan en la base.

Casi todas las decisiones de abajo se explican por esas tres cosas.

## Arquitectura: monolito por capas

**Qué.** Una sola app de Next.js 15 (App Router) con capas separadas:

| Capa | Dónde |
|---|---|
| Presentación | `src/app/`, `src/components/` |
| Comandos | `src/actions/` (Server Actions) |
| Lógica pura | `src/lib/entidades/`, `src/lib/partido.ts`, `temporada.ts`, `social/fanout.ts`… |
| Lecturas | `src/lib/supabase/queries/` |
| Infraestructura | clientes de Supabase, Inngest, `social/redes.ts`, `cola-idb.ts` |
| Base | `supabase/migrations/` (constraints, vistas, RLS) |

**Por qué.** Con un solo autor y poco tráfico de escritura, los
microservicios serían costo sin beneficio. El blueprint descartó incluso
separar el contenido en Sanity: con dos sistemas, `notas.partido_id` deja de
ser una foreign key y las notas no se pueden cruzar con los partidos, que es
el corazón del proyecto.

## Estilo: funcional, no POO

**Qué.** Cero clases y unas 470 funciones exportadas. La lógica de negocio son
funciones puras sobre datos planos tipados; la base, las redes y las colas
quedan en los bordes (*functional core, imperative shell*). No es
programación funcional estricta: hay mutaciones locales y no usa `fp-ts`.

**Por qué.**

- Next con Server Components está pensado para funciones, no para clases.
- Las funciones puras se testean sin levantar nada. El código lo dice en
  varios lugares: "sin React y sin Supabase, para poder probarla".

## SOLID: a medias, a propósito

| Principio | Estado | Evidencia |
|---|---|---|
| S — responsabilidad única | Se cumple | Lógica separada de React y de la base; un componente por archivo, máximo 300 líneas. Excepción: `actions/notas.ts`. |
| O — abierto/cerrado | Se cumple | `publicadorDe()` (Strategy): una red nueva es una línea. Mapas `Record<Red, …>` en vez de `switch`. |
| L — sustitución | Casi no aplica | No hay herencia. Los publicadores cumplen el mismo tipo `Publicador`. |
| I — interfaces chicas | Se cumple | Las funciones piden `Pick<SocialPost, 'platform' \| 'status'>`, no la fila entera. |
| D — inversión de dependencias | Débil | Actions y queries importan Supabase directo. Sí se inyecta en la lógica pura: `entorno`, `hoy: Date`, callbacks. |

**Por qué D es débil (inferencia).** Hay una sola base y no se piensa
cambiarla: abstraerla serían interfaces sin un segundo caso que las
justifique. Donde sí hay variantes reales (tres redes y un modo simulado) se
abstrajo con `publicadorDe()`.

## Acceso a datos: ni Repository formal ni Active Record

- **Lecturas**: funciones en `lib/supabase/queries/*`, un repositorio
  funcional sin interfaz (*Table Data Gateway* / *Query Object*). Regla del
  proyecto: ningún componente consulta la base directo.
- **Escrituras**: *Transaction Script*. Cada Server Action valida con Zod,
  escribe con `supabase.from(...)` y revalida.
- **No es Active Record**: no hay modelos con `save()`. Las filas son tipos
  planos generados desde el esquema de Supabase.

**Por qué.** Los tipos se generan del esquema
(`supabase gen types`): la base es la fuente de verdad y no hay modelos
duplicados que mantener sincronizados.

## Tests

| Tipo | Herramienta | Cantidad | Qué cubre |
|---|---|---|---|
| Unitarios | Vitest | 44 archivos, 759 tests | Toda la lógica pura |
| E2E | Playwright | 8 specs, ~37 tests | Accesibilidad (axe), SEO, medidas en 375 px, rendimiento, panel |

**Por qué esos.** Las métricas de éxito del blueprint son de lectura en el
celular, LCP < 2,5 s en 4G y 100 % de las URLs viejas redirigiendo: los e2e
miden eso.

**Lo que falta.** Tests de Server Actions, queries y RLS contra una base. Nunca
hubo base de prueba; para eso está `scripts/base-de-prueba.ts`.

## Guardrails: la defensa real está en la base

| Guardrail | Por qué |
|---|---|
| RLS en todas las tablas, roles editor/redactor | "RLS es la línea de defensa real, no el middleware" (blueprint § 9). El middleware sólo muestra el login. |
| Zod en el servidor **y** CHECK en la base | "El formulario se puede saltear." |
| Idempotencia de posteos con `social_posts (nota_id, platform)` | Un reintento no puede publicar dos veces en las redes: eso no se deshace. |
| Inngest para el reparto a redes | Si Meta falla, la nota ya está en el sitio y cada red se reintenta sola. |
| ISR de 60 s | La página sale de la CDN, rápida en 4G, y aguanta picos de tráfico. |
| Secretos sólo en el servidor, `server-only` | La service role saltea RLS. |
| Cuerpo de la nota sin `innerHTML` | Ninguna nota puede inyectar markup en la página. |
| Cabeceras de seguridad y JSON-LD escapado | Agregados en la consulta 8: clickjacking y XSS por el título. |

## En una línea

Cada decisión prioriza que **un solo periodista cargue datos confiables desde
el celular** y que **el sitio vuele en un celular con 4G**, aunque eso cueste
pureza arquitectónica.
