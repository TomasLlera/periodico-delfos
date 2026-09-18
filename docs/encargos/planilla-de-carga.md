# Encargo — La planilla de carga (Step 13)

Rama: `fase/13-planilla-de-carga`

## Qué hay que hacer

La pantalla con la que Charlie carga un partido: `/admin/partidos/[id]/planilla`,
según la sección 7.6 del blueprint. Botones grandes, selector de minuto, grilla
de jugadoras, lista de eventos editable, autoguardado, cola offline en
IndexedDB y "Finalizar partido" con verificación del resultado.

**Es el Step marcado con estrella en el Build Order, y es el motivo por el que
existe el proyecto.** Hoy las crónicas del sitio viejo traen la ficha, la
formación, los suplentes y las incidencias escritas a mano adentro del texto,
setenta veces. Esta pantalla es lo que hace que eso deje de pasar.

## Por qué se puede empezar sin base

Casi todo es interfaz y lógica local. Se construye contra datos falsos, que es
el patrón que ya usa todo el proyecto:

- Componentes puros que reciben todo por props y no consultan nada.
- Los datos inventados, encerrados en `src/app/demo/`.
- Toda la lógica que se pueda sacar a `src/lib/`, con tests de vitest.

Cuando Supabase esté arriba, lo único que falta es cablear el guardado: un
Server Action que escriba los eventos. La pantalla ya va a estar probada.

## Lo que decide si sirve

El blueprint pide dos cosas que **no se pueden hacer desde una computadora**:

1. **Probarla en un celular de verdad**, no en el emulador.
2. **Cronometrar la carga de un partido completo. Si pasa de 3 minutos, iterar
   antes de seguir.**

Ese ciclo de medir y corregir es el entregable real de este encargo. Una
planilla que funcione pero tarde seis minutos por partido no sirve: Charlie va
a volver a escribir los goles a mano.

## Dónde mirar antes de escribir

- `periodico-delfos-blueprint-v2.md`, sección 7.6 (la planilla) y 10 (Build
  Order, Steps 12 y 13).
- `HANDOFF.md` — el estado real. Leer primero la sección de arriba de todo.
- `CLAUDE.md` — las reglas no negociables y el sistema de diseño.
- `src/components/partido/PlanillaPartido.tsx` — la planilla de **lectura**, que
  ya existe y está testeada. La de carga es su reverso; conviene que hablen el
  mismo idioma de datos.
- `supabase/migrations/` — el esquema de `eventos`, `formaciones` y `partidos`
  ya está escrito. **`eventos.minuto` es obligatorio**, y es justamente el dato
  que el sitio viejo no tiene en la mitad de los goles.

## Qué NO tocar

Reservado para la rama que levanta Supabase:

- `src/lib/supabase/types.ts` (se regenera con el CLI)
- `vercel.json`
- `supabase/migrations/`
- los scripts de migración y `alt.json` / `bajadas.json`

Y el imán de conflictos: **`HANDOFF.md` lo tocan todas las ramas**. Escribir
sólo en una sección nueva al final, nunca editar las de otro.

## Cómo verificar antes de pedir el merge

```
npx tsc --noEmit
npx vitest run          # los 347 de hoy tienen que seguir pasando
npx next build
```

Y medir el scroll horizontal en cada pantalla nueva, a 375px: comparar
`document.documentElement.scrollWidth` con `clientWidth` **y** mirar
`document.body.scrollWidth`. Los dos, no uno.
