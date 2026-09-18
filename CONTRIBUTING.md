# Cómo trabajamos

Periódico Delfos lo escriben tres personas. Este archivo es el acuerdo de cómo
se mueve el código. Lo que **no** se discute acá son las reglas del producto:
están en `CLAUDE.md` (reglas no negociables) y el estado real del build en
`HANDOFF.md`.

## El flujo, en cuatro pasos

1. Salís de `main` actualizado: `git checkout main && git pull`
2. Abrís una rama corta con el nombre de abajo.
3. Commiteás, pusheás y abrís un **Pull Request**.
4. Una aprobación y merge. `main` no se toca directo.

**Las ramas viven días, no semanas.** Es la única regla de esta lista que
importa de verdad: una rama que vive tres semanas no se mergea, se negocia.
Si una tarea es grande, se parte en varias ramas que entran una atrás de la otra.

## Nombres de rama

```
<tipo>/<área>-<tarea>
```

`tipo` es `feat`, `fix`, `chore` o `docs`. `área` es una de las cuatro de abajo.
`tarea` son dos a cuatro palabras, sin acentos.

```
feat/db-carga-temporada-2026
feat/back-auth-admin
feat/admin-planilla-carga
feat/front-widgets-portada
fix/front-scroll-horizontal
docs/handoff-step-19
```

Con eso se filtra por área: `git branch --list "feat/front-*"`.

## Quién toca qué

No son compartimentos estancos —un cambio real cruza varias áreas y está bien
que así sea—, pero sirve para saber a quién pedirle la revisión del PR.

| Área | Carpetas |
|---|---|
| `db` | `src/lib/supabase/`, `supabase/migrations/` |
| `back` | `src/app/api/`, `src/actions/`, `src/lib/inngest/`, `src/lib/social/` |
| `front` | `src/components/`, `src/app/globals.css` |
| `admin` | `src/app/admin/` |

Las páginas de `src/app/` son de quien esté haciendo la feature: son cuatro
líneas que leen datos y se los pasan a un componente.

## Antes de abrir el PR

```bash
npx tsc --noEmit     # limpio
npx vitest run       # todo verde
npx next build       # verde
```

Si tocaste UI, **miralo en un navegador** a 1280 y 375 px, en tema claro y
oscuro. Y medí el scroll horizontal: comparás
`document.documentElement.scrollWidth` con `clientWidth`, y mirás también
`document.body.scrollWidth`. Ya hubo dos desbordes que las capturas no mostraron
y que estuvieron sesiones sin verse. Está contado en `HANDOFF.md`.

## Trampas de este repo, ya pagadas

- **Parar el server antes de buildear, y matar el proceso, no la terminal.**
  Un `next start` vivo impide que el build reemplace los archivos que tiene
  tomados, y el server sigue sirviendo el build viejo: páginas sin CSS, sin
  hidratar, y una tanda entera de verificación que dice cosas falsas. En
  Windows: `Get-NetTCPConnection -LocalPort 3000` → `Stop-Process -Force`.
  Ante la duda, borrar `.next/` y buildear limpio.
- **No arrancar el dev server con `| head`.** Cuando `head` cierra el pipe, el
  server queda colgado escuchando el puerto pero sin responder. Redirigilo a un
  archivo.
- **`pnpm-lock.yaml` no se resuelve a mano.** Ante un conflicto: quedate con el
  de `main` y corré `pnpm install`. Está marcado en `.gitattributes` para que
  Git ni lo intente.
- **`.env.local` no se commitea nunca.** `.gitignore` lo tapa; `.env.example`
  sí está versionado y es la lista de lo que hay que completar. Si agregás una
  variable, agregala también ahí, con el valor vacío.

## `HANDOFF.md` tiene un solo dueño

Son más de mil líneas que describen el estado del proyecto, y si las tres
personas lo editan en paralelo cada merge es un conflicto. **Lo actualiza quien
cierra el step**, en su propio commit `docs:`, y el resto no lo toca en un PR de
código. Si necesitás anotar algo y no es tu step, decilo en el PR.

## Commits

En español, sin acentos —así están todos los anteriores— y con prefijo:
`feat:`, `fix:`, `chore:`, `docs:`. El cuerpo explica **por qué**, no qué: el
qué ya está en el diff. Si la decisión tuvo una alternativa que se descartó,
escribí cuál y por qué, que es lo que nadie puede reconstruir después.

## Lo que decide el autor, no el código

Hay cosas que están frenadas porque dependen de datos que sólo tiene Charlie —el
mail del medio, los handles de redes, el responsable de datos— y **no se
inventan**. La lista viva está en `HANDOFF.md`, en "Decisiones que el usuario
todavía no tomó". Vale también para los datos deportivos: ningún marcador, gol
ni posición se escribe a mano en una ruta pública. Los datos falsos viven
encerrados en `src/app/demo/`.
