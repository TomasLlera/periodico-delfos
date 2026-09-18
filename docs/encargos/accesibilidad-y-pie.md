# Encargo — Accesibilidad y los links rotos del pie

Rama: `fix/accesibilidad-y-pie`

Cuatro arreglos chicos e independientes entre sí. Es el encargo más corto de
los tres: bueno para quien tenga menos tiempo seguido.

## 1. `/quienes-somos` no tiene ningún `<h1>`

Medido en navegador, a 375 y 1280, en los dos temas. La página tiene contenido
propio, así que **esto no se explica por la base vacía: es un bug**. Una página
sin `h1` no le dice a un lector de pantalla de qué se trata.

Archivo: `src/app/quienes-somos/page.tsx`.

## 2. `/`, `/cronicas` y `/analisis` tampoco tienen `h1`

Acá sí es efecto de la base vacía: el `h1` de la portada es el titular de la
nota de tapa, y sin notas no hay ninguno. Se arregla solo el día que haya
contenido, pero **hoy hay una ventana en la que cuatro páginas del sitio no
tienen encabezado**.

Hay que decidir qué encabeza un listado vacío y una portada vacía. No es
obvio: poner un `h1` que desaparezca cuando haya notas agrega complejidad.
Conviene discutirlo antes de escribirlo.

## 3. El contorno de foco sobre las superficies oscuras

Da **1.98:1** y no se ve. Está anotado desde hace varias sesiones en
`HANDOFF.md`. Son tres líneas en `src/app/globals.css` y **cambia el foco en
todo el sitio**, así que hay que mirarlo en varias páginas antes de darlo por
cerrado.

Ojo: `globals.css` es el único archivo compartido de este encargo. Avisá cuando
lo toques.

## 4. Los dos links del pie que dan 404 en todas las páginas

`/contacto` y `/privacidad` están en el pie de **todas** las páginas del sitio y
las dos rutas no existen. Comprobado en navegador.

Están bloqueadas por cuatro datos que sólo tiene Charlie y que no se pueden
deducir del repo: el **mail de contacto** del medio, los **handles de las
redes**, el **responsable de datos** para la política de privacidad, y si el
sitio **va a usar analítica** —de eso depende si la política tiene que hablar
de cookies—.

**Una política de privacidad inventada es un documento legal falso. No se
escribe a ojo.** Son dos caminos:

- Con los datos: se escriben las dos páginas.
- Sin ellos: **se sacan los dos links del pie** hasta que existan. Es una
  constante en `src/components/layout/Footer.tsx`, reversible en una línea. Un
  404 en el pie de todas las páginas es peor que un pie con una sección menos.

## Qué NO tocar

Reservado para la rama de Supabase: `src/lib/supabase/types.ts`, `vercel.json`,
`supabase/migrations/` y los scripts de migración.

Reservado para `fase/20-e2e`: todo `e2e/`.

**`HANDOFF.md` lo tocan todas las ramas**: escribir sólo en una sección nueva al
final, nunca editar las de otro.

## Cómo verificar

```
npx tsc --noEmit
npx vitest run
npx next build
```

Y en navegador, porque estos cuatro arreglos **no los ve ningún test de hoy**: a
375 y 1280, en tema claro y oscuro. La rama `fase/20-e2e` está construyendo
justo la suite que los cubriría; si ya está lista cuando tomes esto, usala.
