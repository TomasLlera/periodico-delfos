# Reporte de cobertura — Periódico Delfos

> Medido el 26/10/2026 sobre la rama `fix/back-dependencias-vulnerables` @ `0b07538` (`main` + Next 15.5.28 / Vitest 4.1.12). El código de `src/` es idéntico al de `main`.
> Herramienta: Vitest 4.1.12 + `@vitest/coverage-v8` 4.1.12, sobre **los 287 archivos de `src/`**, incluidos los que ningún test importa. Ningún archivo quedó fuera por errores de parseo.

## Resumen

| | Líneas | Ramas | Funciones | Statements |
|---|---|---|---|---|
| **Todo `src/`** (287 archivos) | **27,0 %** (1118/4143) | 25,6 % | 27,5 % | 27,5 % |
| Sin demos ni `types.ts` (266) | 27,9 % | 26,0 % | 28,5 % | 28,4 % |
| Sólo `.ts` (sin componentes ni páginas) | 51,7 % | 55,5 % | 60,6 % | 51,6 % |

- **756 tests en 44 archivos, todos verdes.** No hay tests skipeados ni `.only`.
- **239 de los 287 archivos están al 0 %.** Toda la cobertura sale de 48 archivos de `src/lib/`.
- **No hay ningún test de componentes**: `environment: 'node'`, sólo `*.test.ts`, y `happy-dom` instalado pero sin usar.

**El proyecto tiene dos mitades: la lógica pura está bien testeada (80 %) y todo lo que toca Supabase, Inngest, Auth o el navegador está en 0 %.**

> **Corrección al `REPORTE_CALIDAD.md`:** ahí estimé "~7 %" para todo `src/`, porque los `.tsx` no se pudieron instrumentar. La estimación contaba líneas de texto en lugar de líneas ejecutables y estaba mal. El número medido es **27 %**. La causa del problema de instrumentación está en "Cómo reproducirlo".

---

## Por capa

| Capa | Archivos | Líneas | Ramas | Funciones | Riesgo si falla |
|---|---|---|---|---|---|
| Lógica pura (`src/lib/**` sin supabase/inngest) | 56 | 🟢 **80,4 %** | 78,1 % | 79,8 % | — |
| Server Actions (`src/actions/`) | 15 | 🔴 **0 %** (0/390) | 0 % | 0 % | Alto: escriben en la base y disparan posteos |
| Acceso a datos (`src/lib/supabase/`) | 14 | 🔴 **0 %** (0/249) | 0 % | 0 % | Alto: todo el sitio lee de acá |
| Jobs (`src/lib/inngest/` + `/api/inngest`) | 4 | 🔴 **0 %** (0/77) | 0 % | 0 % | Alto: posteos a redes, que no se pueden deshacer |
| Middleware | 1 | 🔴 0 % (0/16) | 0 % | 0 % | Medio: RLS es la defensa real |
| Componentes UI (`src/components/`) | 116 | 🔴 0 % (0/1358) | 0 % | 0 % | Medio: lo cubre en parte el E2E |
| Páginas y rutas (`src/app/`, sin demos) | 61 | 🔴 0 % (0/536) | 0 % | 0 % | Medio: lo cubre en parte el E2E |

Los componentes y las páginas son el 46 % de las líneas ejecutables. Parte de eso lo ejercita la suite de Playwright (233 tests verdes en la corrida local), pero el E2E no suma a este número.

## Por carpeta

| Carpeta | Archivos | Líneas | Ramas | Funciones |
|---|---|---|---|---|
| `src/lib/entidades` (esquemas Zod) | 10 | 🟢 93,3 % | 86,9 % | 95,2 % |
| `src/lib/social` (copy, fan-out, límites) | 5 | 🟢 88,9 % | 84,5 % | 89,1 % |
| `src/lib/migracion` (WordPress) | 12 | 🟢 84,3 % | 79,0 % | 75,0 % |
| `src/lib` (raíz: partido, temporada, nota, seo, cola...) | 24 | 🟢 80,9 % | 84,2 % | 81,8 % |
| `src/lib/tiptap` | 5 | 🟡 56,5 % | 56,0 % | 47,1 % |
| `src/lib/supabase/queries` | 10 | 🔴 0 % | 0 % | 0 % |
| `src/lib/supabase` (clientes) | 4 | 🔴 0 % | 0 % | 0 % |
| `src/lib/inngest` | 3 | 🔴 0 % | 0 % | 0 % |
| `src/actions` | 15 | 🔴 0 % | 0 % | 0 % |
| `src/middleware.ts` | 1 | 🔴 0 % | 0 % | 0 % |
| `src/components/admin` | 53 | 🔴 0 % (0/919) | 0 % | 0 % |
| `src/components/layout` | 17 | 🔴 0 % (0/149) | 0 % | 0 % |
| `src/components/partido` | 11 | 🔴 0 % (0/107) | 0 % | 0 % |
| `src/components/` (resto: content, portada, temporada, jugadora, listado, plantel) | 35 | 🔴 0 % (0/183) | 0 % | 0 % |
| `src/app/admin` | 36 | 🔴 0 % (0/271) | 0 % | 0 % |
| `src/app` público | 21 | 🔴 0 % (0/235) | 0 % | 0 % |
| `src/app/api` + `auth` | 4 | 🔴 0 % (0/30) | 0 % | 0 % |
| `src/app/demo` (no va a producción) | 20 | 0 % (0/128) | 0 % | 0 % |

---

## Lo que más importa cubrir, por riesgo

Ordenado por "qué pasa si se rompe", no por tamaño. Todos están al 0 %.

| # | Archivo | Líneas | Qué protege | Bugs que ya tuvo | Test sugerido |
|---|---|---|---|---|---|
| 1 | [src/actions/notas.ts](src/actions/notas.ts) | 70 | Publicar, fechar, firmar y disparar posteos | 3 (firma `30439ef`, fecha `b1eb205` ×2) | Unit con el cliente de Supabase mockeado: la fecha (elegida > guardada > ahora), que la firma no se pise al editar, que una nota de archivo no dispare `inngest.send`, el `23505` |
| 2 | [src/lib/inngest/funciones/nota-publicada.ts](src/lib/inngest/funciones/nota-publicada.ts) | 45 | Idempotencia de los posteos a FB/IG/X | La duplicación de `b78d8e6` (rama sin mergear) | Unit con `step.run` falso: no postear si ya hay registro en `social_posts`, anotar fallos y agotadas |
| 3 | [src/lib/inngest/funciones/publicar-programadas.ts](src/lib/inngest/funciones/publicar-programadas.ts) | 29 | El cron que publica solo | — | Unit: sólo toma las vencidas, emite el evento y revalida |
| 4 | [src/lib/supabase/queries/notas.ts](src/lib/supabase/queries/notas.ts) | 65 | Todo lo que lee el sitio público | Ignora `error`: el ISR guarda páginas vacías (reportado el 15/10) | Arreglar primero (que tire error) y después un test de "con `error`, tira" |
| 5 | [src/actions/eventos.ts](src/actions/eventos.ts) | 32 | Goles y tarjetas en vivo | — | Unit: el `23505` cuenta como éxito y `finalizarPartido` |
| 6 | [src/components/admin/usarCola.ts](src/components/admin/usarCola.ts) + [src/lib/cola-idb.ts](src/lib/cola-idb.ts) | 85 | Que un gol sin señal no se pierda | `779a971` | La parte pura (`lib/cola.ts`) ya está al 100 %. Esto lo cubre mejor un E2E con `context.setOffline()` |
| 7 | [src/actions/autor.ts](src/actions/autor.ts) | 54 | Alta de colaboradores con service role | — | Unit: rechaza si quien llama no es titular |
| 8 | [src/middleware.ts](src/middleware.ts) | 16 | Redirige a login desde `/admin` | — | Unit con `NextRequest`: sin usuario → `/admin/login?volver=`, y `/admin/login` no hace loop |
| 9 | [src/app/auth/confirm/route.ts](src/app/auth/confirm/route.ts) | 10 | Login por magic link | `631f1e2` | Unit: con `token_hash` llama a `verifyOtp` y sin él va a error |
| 10 | [src/lib/tiptap/render.tsx](src/lib/tiptap/render.tsx) | 54 | Cómo se ve el cuerpo de cada nota | — | Unit sin DOM: `renderToStaticMarkup` sobre los documentos que ya usan los tests de `esquema.ts` |

### Huecos dentro de la lógica que sí tiene tests

| Archivo | Líneas | Ramas | Qué falta |
|---|---|---|---|
| [src/lib/formato.ts](src/lib/formato.ts) | 50 % | **50 %** (17/34) | **No tiene test propio.** Sin cubrir: `resultadoParaAldosivi` (el color dorado/gris/tinta de cada resultado), `fechaCorta`, `fechaLarga`, `etiquetaFecha`, `etiquetaCategoria`, `tiempoLectura`, `contarPalabras`, `minutoEvento`. Las fechas fueron la fuente de 3 bugs en octubre |
| [src/lib/clima.ts](src/lib/clima.ts) | 66,7 % | 80 % | `getTemperatura()`, el fetch, sin test |
| [src/lib/migracion/extensiones.ts](src/lib/migracion/extensiones.ts) | 93,3 % | 66,7 % | Ramas de nodos raros |
| [src/lib/migracion/transformar.ts](src/lib/migracion/transformar.ts) | 96,1 % | 82,0 % | 11 ramas de `transformarPost` (complejidad 22) |
| [src/lib/partido.ts](src/lib/partido.ts) | 95,6 % | 82,7 % | 14 ramas de eventos |

`formato.ts` es lo más barato de esta lista: son funciones puras, se usan en más de 50 lugares y cubrirlas lleva alrededor de una hora.

---

## Plan propuesto

| Fase | Qué | Efecto estimado | Esfuerzo |
|---|---|---|---|
| 1 | `formato.test.ts` + `getTemperatura` | Lógica pura de 80 % a ~85 %; ramas de `formato` de 50 % a ~95 % | 1 h |
| 2 | Actions `notas` y `eventos` + las 2 funciones de Inngest, con Supabase y `step` mockeados | Cubre los 4 primeros de la tabla de riesgo, +176 líneas | 1 día |
| 3 | Queries: tirar error cuando Supabase devuelve `error`, con tests | +235 líneas y cierra el bug del ISR | 0,5 día |
| 4 | Middleware y `auth/confirm` | +26 líneas | 1 h |
| 5 | Mínimos de cobertura en el CI (abajo) para que no baje | — | 15 min |

Con las fases 1 a 4, la cobertura de todo `src/` pasa de 27 % a alrededor del 40 %. Más importante: **todas las capas que escriben datos o publican quedan cubiertas**. Los componentes conviene cubrirlos con E2E (publicar nota, planilla offline) más que con tests unitarios.

---

## Cómo reproducirlo en el repo

Hoy el repo no puede medir cobertura: no tiene el proveedor instalado. Para sumarlo:

```bash
pnpm add -D @vitest/coverage-v8@4.1.12   # misma versión exacta que vitest
```

```ts
// vitest.config.mts
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // Next usa "jsx": "preserve" en el tsconfig. Sin esto, los .tsx que ningún test
  // importa no se pueden instrumentar y quedan fuera del reporte (inflando el %).
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.ts', 'src/app/demo/**', 'src/lib/supabase/types.ts'],
      reporter: ['text-summary', 'html', 'json-summary'],
      // Mínimos un poco abajo del valor de hoy, para que sólo puedan subir.
      thresholds: {
        lines: 27,
        'src/lib/{entidades,social,migracion}/**': { lines: 80, branches: 75 },
      },
    },
  },
})
```

Después: `pnpm test --coverage`, y en `.github/workflows/ci.yml` se cambia `pnpm test` por `pnpm test --coverage`. `/coverage` ya está en `.gitignore`.

> Lo de `oxc.jsx` lo probé en esta medición con un config aparte que extiende al del proyecto: con él, los 287 archivos se instrumentaron sin errores y los 756 tests siguieron verdes. Los mínimos (`thresholds`) no los probé.

Con eso, `pnpm test --coverage` deja en `coverage/index.html` el reporte navegable, archivo por archivo y con las líneas sin cubrir marcadas.
