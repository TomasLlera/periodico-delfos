# Periódico Delfos

Medio digital de Mar del Plata dedicado al **fútbol femenino de Aldosivi**, las
Tiburonas. Lo escribe una sola persona, Charlie Redondo. Es una migración desde
WordPress.

El corazón del proyecto es **estructurar los datos del partido** —goles,
formaciones, tarjetas, minutos— para que dejen de escribirse a mano adentro del
texto de las notas, que es lo que hace hoy el sitio viejo, setenta veces. Se
cargan una vez en una planilla y de ahí salen solas la crónica, la tabla de
posiciones, las goleadoras y la ficha de cada jugadora. Al publicar, cada nota
se auto-postea a Facebook, Instagram y X.

Next.js 15 (App Router) · TypeScript strict · Tailwind v4 · Supabase
(Postgres/Auth/Storage/RLS) · TipTap · Inngest · Vercel.

## Arrancar

```bash
pnpm install
cp .env.example .env.local   # y completar; sin esto no hay base
pnpm dev
```

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Desarrollo, en el 3000 |
| `pnpm build` | El build de producción |
| `pnpm test` | Vitest. Hoy 603 tests en 36 archivos |
| `pnpm test:e2e` | La suite de navegador. Hoy 240 pasan y 8 se saltean |
| `pnpm tsx scripts/usuario-e2e.ts --crear` | El usuario de prueba del panel, una vez |

Verificar siempre con las tres, en este orden, antes de dar algo por hecho:

```bash
npx tsc --noEmit
npx vitest run
npx next build
```

## Cinco cosas que conviene saber antes de descubrirlas asustándose

**`pnpm lint` falla y no es culpa tuya.** `eslint.config.mjs` quedó de un
scaffolding de Next 16 e importa `eslint-config-next/core-web-vitals` sin
extensión. No afecta al build. Ver "Pendiente manual" en `HANDOFF.md` antes de
tocarlo.

**`next dev` y `next build` comparten `.next`.** Con el dev server abierto,
`next start` responde 404 en todas las rutas y la suite e2e falla entera con un
mensaje que no se parece a la causa. O se apaga el dev y se rebuildea, o se
corre `E2E_BASE_URL=http://localhost:3000 pnpm test:e2e`.

**Contra el dev server, la suite necesita `--workers=1`.** Con los seis por
omisión, media docena de tests fallan con `net::ERR_ABORTED`: es el dev
compilando varias rutas a la vez, no el código. Contra `next start` no pasa.

**Hay archivos en CRLF y otros en LF.** Un script que busca y reemplaza un
bloque de varias líneas escrito con `\n` **falla en silencio** contra un archivo
CRLF: no tira, no cambia nada, y el error aparece mucho después. Casi todo
`src/app` está en CRLF. Si un reemplazo "no hace nada", mirá eso antes que el
patrón.

**Next está fijado en 15 a propósito.** Next 16 cambia APIs y convenciones
respecto de lo que este proyecto asume. No subirlo sin revisar el blueprint.

## Qué leer, y en qué orden

| Archivo | Qué es |
|---|---|
| `HANDOFF.md` | **El estado real.** Qué está hecho, qué decisiones no hay que volver a discutir y cuál es la próxima tarea. Las últimas secciones son las vigentes; más arriba hay partes viejas |
| `CLAUDE.md` | Las reglas no negociables, el sistema de diseño y las convenciones de código |
| `periodico-delfos-blueprint-v2.md` | El plan completo. El Build Order es la sección 10 |
| `docs/admin.md` | El mapa del panel y el orden en que se cargan los datos |
| `docs/encargos/` | El reparto de trabajo y el estado de cada frente |
| `CONTRIBUTING.md` | Ramas, commits y quién toca `HANDOFF.md` |

`CLAUDE.md` describe la arquitectura **objetivo**. Para saber qué existe hoy de
verdad, manda `HANDOFF.md`.

## Cómo está, al 21/09/2026

Los Steps 12, 13, 17, 18, 19 y 20 del Build Order están cerrados. Hay base con
datos reales: dos temporadas, 10 equipos, 33 jugadoras con su plantel y un
partido cargado. **La tabla `notas` está vacía**, así que la portada muestra su
estado vacío: no está roto, es el estado real.

Lo que falta, en `HANDOFF.md` con el detalle:

- **Probar el panel contra la base, a mano.** Es lo más importante. La suite
  verifica que las pantallas abran y que los formularios validen, no el alta
  completa: no crea ni borra datos a propósito, porque corre contra la base de
  verdad.
- **La planilla en un celular real, cronometrada.** Si cargar un partido pasa de
  tres minutos, hay que iterar.
- **`/contacto` y `/privacidad` dan 404 desde el pie de todas las páginas.**
  Bloqueado por datos que sólo tiene Charlie.
- Los Steps 15 y 16 (Meta y X) esperan el App Review de Meta y las credenciales
  del Developer Portal de X. El pipeline ya funciona entero en modo dry-run.
