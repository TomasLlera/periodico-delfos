# El reparto de trabajo — qué queda de cada frente

Este archivo tenía el arranque de tres frentes en paralelo. **Casi todo eso ya
está hecho**, así que quedó sólo lo que falta; el detalle de cómo se hizo cada
cosa está en `HANDOFF.md`, y el arranque del proyecto —setup, comandos,
trampas del entorno— en el `README.md` de la raíz.

Los tres encargos originales siguen al lado de este archivo, enteros. Se leen
para entender **por qué** se pidió cada cosa, que es lo que no se reconstruye
después.

---

## `planilla-de-carga.md` — hecha, sin el entregable que decide si sirve

La planilla existe y está cerrada, con la cola offline incluida (Step 13). Lo
que falta es lo único que el encargo marcaba como la prueba de fuego, y **no se
puede hacer desde la computadora**:

> Probarla en un celular de verdad y **cronometrar la carga de un partido
> completo. Si pasa de tres minutos, iterar antes de seguir.**

Y probar la cola offline cortando los datos a mitad de carga. Una planilla que
funcione pero sea lenta no sirve: Charlie vuelve a escribir los goles a mano.

## `e2e.md` — hecho

Los borradores se convirtieron a `@playwright/test`, con `playwright.config.ts`
y `pnpm test:e2e`. Hoy son 240 tests contra el build —público, panel, SEO y
rendimiento— con 8 que se saltean.

Quedan abiertos dos de los bugs que el encargo listaba, y están **marcados como
`skip` a propósito**, no olvidados: `/demo/nota` y `/demo/articulo` tiran
`ERR_NAME_NOT_RESOLVED` en consola, y `/demo/nota` además loguea que el cuerpo
no tiene forma de documento TipTap. Son páginas de demo, así que no afectan al
sitio.

## `accesibilidad-y-pie.md` — dos de cuatro

**Hechos:** los `h1` que faltaban en `/quienes-somos`, `/`, `/cronicas` y
`/analisis` (puntos 1 y 2).

**Falta el punto 3, el contorno de foco.** `globals.css` sigue teniendo una sola
regla sin excepciones:

```css
:focus-visible {
  outline: 2px solid var(--color-verde-600);
  outline-offset: 2px;
}
```

Sobre las superficies `verde-900` —cabecera, tapa y aside, que son oscuras en
los dos temas— eso da los **1,98:1** que midió el encargo y no se ve. Son tres
líneas, pero cambian el foco en **todo** el sitio, así que hay que mirarlo en
varias páginas antes de darlo por cerrado. Ojo: la suite de axe está en verde y
**no lo detecta** — axe no mide bien el contraste del indicador de foco.

**Falta el punto 4, y sigue bloqueado.** `/contacto` y `/privacidad` están en el
pie de todas las páginas y las dos rutas no existen: son dos 404 en cada
pantalla del sitio. Los links siguen ahí, en `src/components/layout/Footer.tsx`.

Bloqueado por cuatro datos que sólo tiene Charlie: el **mail de contacto**, los
**handles de las redes**, el **responsable de datos** y si el sitio **va a usar
analítica** —de eso depende si la política tiene que hablar de cookies—.

**Una política de privacidad inventada es un documento legal falso. No se
escribe a ojo.** Son dos caminos, y mientras no estén los datos el encargo ya
eligió el segundo:

- Con los datos: se escriben las dos páginas.
- Sin ellos: **se sacan los dos links del pie** hasta que existan. Es una
  constante en `Footer.tsx`, reversible en una línea. Un 404 en el pie de todas
  las páginas es peor que un pie con una sección menos.

---

## Lo que sigue valiendo para cualquier rama

**`HANDOFF.md` es el imán de conflictos.** Lo actualiza quien cierra el step, en
su propio commit `docs:`. Escribir **sólo en una sección nueva al final**, nunca
editando las de otro.

**`wip/portada-15-sep` no se mergea nunca.** Es una implementación paralela de
los widgets deportivos que quedó sin commitear el 15/09 y se parqueó para no
perderla. Tiene su propio `BarraEstado`, `ChipResultado`, `FechaAFecha` y un
`lib/portada.ts` que **compiten** con los que están en `main`: mergearla
duplicaría los cuatro componentes. Lo que valía la pena ya se portó, y está
contado en `HANDOFF.md`, sección "La rama de rescate".

**Archivos que se regeneran y no se editan a mano:**
`src/lib/supabase/types.ts` (sale del CLI de Supabase) y `vercel.json` (las 82
redirecciones salen de `scripts/generate-redirects.ts`).
