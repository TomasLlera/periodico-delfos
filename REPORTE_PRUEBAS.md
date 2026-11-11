# Informe de pruebas — Periódico Delfos

**Fecha:** 06/11/2026 · **Sistema bajo prueba:** Periódico Delfos (Next.js 15 +
Supabase, desplegado en Vercel) · **Versión evaluada:** `cfb426c`

> **Qué es este documento y qué no.** Es el informe final con el formato de la
> clase 10 (resumen, alcance, resultados, defectos, riesgos, recomendación,
> lecciones), armado con mediciones hechas sobre el repositorio y sobre el sitio
> desplegado. **No reemplaza la planilla de casos ni el registro de ejecuciones**,
> que viven fuera del repo: los porcentajes de ejecución y aprobación de la
> clase 9 se citan como dato propio y no se recalculan acá.
>
> Los otros dos reportes del repo —`REPORTE_CALIDAD.md` y
> `REPORTE_COBERTURA.md`— son de ingeniería: cobertura, complejidad,
> duplicación. No tienen formato de casos ni estados, y por eso existe éste.

---

## 1. Resumen ejecutivo

Se encontraron y cerraron **tres defectos que no estaban en el informe previo**,
uno de ellos crítico y en producción. El hallazgo más importante no es ninguno de
los tres por separado, sino la relación entre ellos: **un defecto de código de
estado estaba ocultando una caída real del sitio.**

| | |
|---|---|
| Defectos nuevos encontrados | 8 |
| Defectos cerrados en esta iteración | 8 |
| Defectos abiertos de prioridad alta | **2** (DEF-09 configuración de Vercel, DEF-11 la suite puede correr contra un build viejo) |
| Hallazgos previos invalidados | 1 |
| Hallazgos previos recategorizados | 1 |
| Casos automatizados nuevos | 21 (13 de estados HTTP + 8 de login) |
| Criterio de salida | **No se cumple todavía** — ver §7 |

**El titular.** Todas las páginas inexistentes del sitio devolvían **HTTP 200**
mientras mostraban la pantalla de "no encontrado". Para un buscador eso es
contenido válido, y lo indexa. Como efecto colateral, cualquier excepción del
servidor también salía como 200: por eso `/plantel` y `/jugadora/*` llevaban
tiempo **caídas en producción sin que ningún test ni el monitoreo lo notaran**.

---

## 2. Alcance

### Dentro del alcance

| Componente | Técnica | Estado |
|---|---|---|
| Web pública | Playwright (10 proyectos: 375/1280 px × claro/oscuro, + SEO, rendimiento, estados) | Ejecutado |
| Códigos de estado HTTP | `curl` manual + `e2e/estados.spec.ts` | Ejecutado |
| Seguridad / acceso | RLS en base + `e2e/admin.login.spec.ts` | Ejecutado |
| Lógica de negocio | 790 pruebas unitarias (Vitest) en 48 archivos | Ejecutado |
| Panel de administración | `e2e/admin.spec.ts`, 15 casos | Ejecutado **por primera vez** (ver DEF-07) |

### Fuera del alcance

- **Carga y estrés.** Un autor, poco tráfico. Sí se mide rendimiento de una
  carga (`e2e/rendimiento.spec.ts`, 375 px con red estrangulada a 4G), que es
  otra cosa.
- **Posteo real a redes.** Se prueba en modo simulado (`SOCIAL_DRY_RUN`), que
  tiene sus propias unitarias en `src/lib/social/redes.test.ts`.
- **Celular real.** Sólo emulación, y sólo motor Chromium (Edge). Sin Safari
  real, así que el zoom de iOS y la hoja de compartir del sistema siguen sin
  verificarse. Es la limitación conocida de la clase 7.
- **API con Postman/Newman.** Los 12 casos de la clase 8 no están en el
  repositorio y no corren en CI. Ver riesgo R-01.

---

## 3. Resultados

### 3.1 Pruebas automatizadas

| Nivel | Cantidad | Resultado |
|---|---|---|
| Unitarias (Vitest) | 790 en 48 archivos | **790 Pasa** |
| E2E (Playwright) | 282 ejecuciones | **282 Pasa**, 8 No aplica, 2 Falla* |
| API automatizadas | **0** | — |

\* Los 2 fallos son el pedido de `/_vercel/insights/script.js`, que **sólo existe
desplegado**: verificado que en producción responde 200. No es un defecto del
producto sino un artefacto de correr el build local. Es intermitente porque
depende del orden de carga.

**Sobre la pirámide.** La base está bien (790 unitarias), pero el medio está
vacío: **cero pruebas de API automatizadas**. Y el tope es más ancho de lo que la
pirámide recomienda: 282 ejecuciones E2E, aunque el número engaña porque los 9
archivos de especificación se multiplican por los 4 proyectos de viewport y tema.

### 3.2 Códigos de estado — antes y después

Medido con `curl` sobre `https://periodico-delfos.vercel.app`:

| Petición | Antes | Después | Correcto |
|---|---|---|---|
| `/nota/<inexistente>` | 200 | **404** | ✅ |
| `/partido/<inexistente>` | 200 | **404** | ✅ |
| `/jugadora/<inexistente>` | 200 | **404** | ✅ |
| `/temporada/<inexistente>` | 200 | **404** | ✅ |
| `/plantel/<inexistente>` | 200 | **404** | ✅ |
| `/cronicas?pagina=9999` | 200, luego 500 | **404** | ✅ |
| `/ruta-inventada` | 404 | 404 | ✅ |
| `/plantel/primera-b-2026` | **500** | **200** | ✅ |
| `/jugadora/luna-vera` | **500** | **200** | ✅ |
| `/buscar?q=<sin resultados>` | 200 | 200 | ✅ |

**La última fila es deliberada y no hay que "arreglarla".** Una búsqueda que no
encuentra nada es una respuesta exitosa que informa que no hay resultados: el
recurso `/buscar` existe. Devolver 404 ahí sería incorrecto y además sacaría la
página del índice. Está escrito como caso de prueba porque es justamente el que
alguien cambiaría por error al leer los de arriba.

### 3.3 Una advertencia para verificar en el navegador

Al abrir la pestaña Network, el 404 **sólo se ve pidiendo el documento**: URL
escrita en la barra, F5, o un enlace desde afuera. Si se llega haciendo clic
dentro del sitio, Next no pide el documento sino un payload interno (`?_rsc=`)
que responde **200 con el contenido del 404 adentro**. No es un defecto: es su
protocolo de navegación sin recarga, y ningún rastreador lo pide. Medido en las
dos formas.

---

## 4. Defectos

**Severidad** = daño técnico si ocurre. **Prioridad** = urgencia de arreglarlo.
No son lo mismo, y los dos primeros lo muestran bien.

| ID | Defecto | Severidad | Prioridad | Estado |
|---|---|---|---|---|
| DEF-02 | Toda página inexistente responde 200 con la pantalla de 404 (soft-404). Causa: `loading.tsx` en la raíz abre la respuesta antes del `notFound()` | Alta | **Alta** | **Cerrado** `c55e2a4` |
| DEF-03 | `/plantel/*` y `/jugadora/*` responden 500 en producción. La migración 0020 borró `plantel.dorsal` y el código seguía pidiéndola (`42703`) | **Crítica** | **Crítica** | **Cerrado** `c55e2a4` |
| DEF-04 | Paginación fuera de rango responde 500. `PGRST103` de PostgREST se convertía en excepción antes del `notFound()` | Media | Media | **Cerrado** `c55e2a4` |
| DEF-05 | La pantalla de 404 está en inglés ("This page could not be found") y sin enlaces de salida. Incumple la regla 9 del proyecto | Baja | Media | **Cerrado** `cfb426c` |
| DEF-06 | No existe forma de eliminar una nota desde el panel. Una nota de prueba queda publicada o en borrador para siempre | Media | **Alta** | **Cerrado** `c18f612` |
| DEF-07 | El proyecto `entrar` de Playwright no declara `channel: 'msedge'`: **los 15 casos del panel nunca se habían ejecutado** | Alta | **Alta** | **Cerrado** `c55e2a4` |
| DEF-08 | `signOut()` revoca todas las sesiones del usuario: en paralelo invalidaba la sesión del setup y los 15 casos del panel fallaban juntos | Media | Media | **Cerrado** `c55e2a4` |
| DEF-09 | `/api/inngest` responde 500 en producción por falta de `INNGEST_SIGNING_KEY` en Vercel. Sin auto-posteo ni notas programadas | Alta | **Alta** | **Abierto** |
| DEF-01 | La ficha del último partido muestra el resultado 2–3 junto a "Sin goles ni tarjetas cargadas" | Media | Alta | **Abierto** |
| DEF-10 | El listado del panel no tiene filtro: con el archivo de WordPress, encontrar una nota es recorrer la lista entera | Baja | Media | **Cerrado** `c18f612` |
| DEF-11 | `reuseExistingServer` de Playwright toma cualquier servidor que haya en el puerto 3100, **incluido uno olvidado con un build viejo**: la suite entera reporta contra código que no es el que se quiere probar | Alta | **Alta** | **Abierto** |
| DEF-12 | `/demo/nota` incumple `aria-prohibited-attr` por el markup del reproductor embebido de YouTube (`div.html5-video-player` con `aria-label` y sin rol) | Media | Baja | **Abierto** |
| DEF-13 | `medidas.spec.ts` da falsos rojos con los 10 proyectos en paralelo: el `next start` local no acompaña y aparecen errores de consola en rutas al azar. Aislado pasa 34 de 34 | Baja | Media | **Abierto** |

**DEF-13 ya tiene precedente en el repo.** El proyecto `rendimiento` corre con
`fullyParallel: false` por exactamente esto, y su comentario lo mide: "en
paralelo la portada da 3264 ms y de a una, 1800". A `medidas` le falta el mismo
tratamiento. Se reconoce porque las rutas que fallan **cambian de corrida en
corrida** —`/buscar`, `/analisis`, `/plantel`, `/demo/partido`— y todas pasan al
correrlas solas.

#### DEF-11, que es el más engañoso de todos

Apareció al verificar este informe. Una corrida de la suite dio **12 fallas** que
parecían regresiones de `/plantel`, `/fixture` y la accesibilidad de
`/demo/nota`. No lo eran: había un `next start` olvidado en el 3100 desde horas
antes, con un build anterior a dos arreglos, y `reuseExistingServer: true` lo
reusó sin avisar. Contra un build fresco, los tres tests pasan.

**Es el mismo tipo de defecto que DEF-07**, y por eso van juntos: en los dos
casos la suite no prueba lo que quien la corre cree que prueba. Uno no ejecutaba
nada; el otro ejecuta contra lo que no es. El segundo es peor, porque da verde.

Se cierra con un puerto efímero o con `reuseExistingServer: false`. Mientras no
esté, la regla es: **ante un rojo raro, antes de buscar la causa en el código,
rebuildear y apuntar la suite con `E2E_BASE_URL` a un servidor recién
levantado.**

### Dos correcciones al informe previo

**INVÁLIDO — "el menú no marca la sección actual".** No reproduce.
`NavPrincipal.tsx` emite `aria-current="page"` en el enlace activo, y es la razón
documentada de que ese componente sea de cliente. Conviene retirarlo antes de
entregar: un defecto que no reproduce debilita el resto del informe.

**RECATEGORIZADO — "botones de compartir de 40 px (< 44 px)".** El hecho es
correcto: miden 40 px en móvil, y es una excepción deliberada y documentada en el
propio componente. Pero **44 px es el criterio WCAG 2.5.5, de nivel AAA**. El
criterio de nivel AA es 2.5.8 y exige 24 px, así que a AA —que es a lo que el
proyecto se comprometió— **cumple**. Presentarlo como incumplimiento de AA es
atacable; presentarlo como "no alcanza AAA, decisión aceptada y documentada" es
exacto.

### Nota sobre DEF-09 y DEF-01

Ninguno de los dos se verificó en esta iteración: se arrastran del informe previo
y se listan como abiertos para no perderlos. DEF-09 no es un defecto de código
sino de configuración del entorno de despliegue —se cierra agregando la variable
en Vercel, sin tocar el repositorio—.

---

## 5. Riesgos

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|---|
| R-01 | Sin pruebas de API automatizadas, una regresión en permisos o en validación se detecta a mano o no se detecta | Media | **Alto** | Exportar la colección de Postman al repo y correrla con Newman en CI |
| R-02 | Las E2E no corren en CI: hoy el workflow hace lint, tipos, unitarias, complejidad y build, pero no navegador | Alta | Medio | Agregar un segundo job con servidor y credenciales |
| R-03 | Sin celular real ni Safari, los defectos propios de iOS no se ven. Ya pasó: el zoom del buscador y la hoja de compartir | Alta | Medio | Una pasada manual en un iPhone, documentada |
| R-04 | Defectos silenciosos: un error que sale como 200 no lo ve ni el test ni el monitoreo. **Ya ocurrió** (DEF-02 ocultando DEF-03) | Media | **Alto** | Pruebas que afirmen sobre el código de estado y no sobre el HTML (hecho: `e2e/estados.spec.ts`) |
| R-05 | Migraciones aplicadas a la base sin actualizar el código. **Ya ocurrió** (0020 → DEF-03) | Media | **Alto** | Que ninguna migración se aplique sin su cambio de código en el mismo commit |

---

## 6. Recomendación

**No liberar funcionalidad nueva hasta cerrar DEF-09.** Es el único de prioridad
alta que queda abierto y deja dos funciones del producto sin servicio: el
auto-posteo a redes y las notas programadas. Se arregla agregando una variable de
entorno en Vercel, no hay código involucrado.

Después, en orden de impacto sobre esfuerzo:

1. **DEF-01**, que es el defecto que ve cualquier lector del sitio.
2. **R-02** — las E2E en CI. Es lo que evita que vuelva a pasar un DEF-07: una
   suite que no corre no protege nada, y nadie se enteró durante semanas.
3. **R-01** — la colección de API al repo.

---

## 7. Criterio de salida

> *"Ningún defecto de prioridad alta abierto."*

**No se cumple**, y tampoco se cumplía en el informe previo. La diferencia es que
ahora se sabe por qué: había **dos páginas públicas caídas que no estaban
contadas** porque un segundo defecto las disfrazaba de página válida. Hoy queda
un solo bloqueante (DEF-09) y es de configuración, no de código.

---

## 8. Lecciones aprendidas

**1. Un defecto puede ocultar a otro, y el peor caso es cuando el que oculta
parece menor.** El soft-404 se veía como un problema de SEO, "importante pero no
urgente". En realidad estaba convirtiendo cualquier error 500 en un 200: mientras
existió, ninguna caída del servidor podía ser detectada por un test que mirara el
código de estado. El defecto crítico apareció a los diez minutos de arreglarlo.

**2. Afirmar sobre lo que se ve no alcanza; hay que afirmar sobre el protocolo.**
En pantalla, un 404 con estado 200 es indistinguible de un 404 correcto. Las
pruebas de usabilidad de la clase 6 **detectaron el síntoma** —se vio la pantalla
en inglés— pero no podían dimensionarlo. Un `expect(status).toBe(404)` lo habría
encontrado el primer día.

**3. Una suite que no corre es peor que no tener suite**, porque genera confianza
sin darla. Los 15 casos del panel figuraban como automatizados y no se habían
ejecutado nunca por una línea de configuración ausente. El estado real no era
"Pasa" ni "Falla": era **No ejecutado**, y nadie lo sabía.

**4. Las suposiciones envejecen más rápido que el sistema.** Al revisar los
hallazgos de las clases 1 a 7 contra el repositorio: uno no reproducía, uno
estaba mal encuadrado por nivel de conformidad, dos ya estaban resueltos y el
límite de imagen era 8 MB y no 5 MB. **Un informe de pruebas tiene fecha de
vencimiento**, y conviene que diga contra qué versión se ejecutó. Por eso este
documento nombra el commit en el encabezado.

**5. Severidad y prioridad se separan de verdad, no en la teoría.** DEF-05 (el
404 en inglés) es de severidad baja —nada deja de funcionar— y lo ve todo
visitante que llega por un enlace roto. DEF-03 era de severidad crítica y estuvo
semanas sin prioridad asignada porque nadie sabía que existía.

---

## Anexo — cómo reproducir las mediciones

```bash
pnpm test                    # 790 unitarias
pnpm lint                    # 0 errores (5 avisos de <img>, documentados)
pnpm exec tsc --noEmit       # tipos
pnpm complejidad             # tope 25, promedio 4.00
pnpm build && npx next start -p 3100
pnpm test:e2e                # 282 E2E (necesita el usuario de prueba)

# Códigos de estado, uno por uno
curl -s -o /dev/null -w "%{http_code}\n" https://periodico-delfos.vercel.app/nota/no-existe
```

El usuario de prueba del panel se crea una sola vez con
`pnpm tsx scripts/usuario-e2e.ts --crear`, que deja `E2E_ADMIN_EMAIL` y
`E2E_ADMIN_PASSWORD` en `.env.local`. **Sin esas variables los casos del panel no
se saltean: los proyectos no se construyen** y los 15 casos quedan en estado No
ejecutado sin avisar (es DEF-07).
