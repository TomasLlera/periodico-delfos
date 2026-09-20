# El panel de administración

El mapa de `/admin`: qué pantallas hay, cuáles faltan y dónde va cada cosa
nueva. **Se actualiza en el mismo commit que agrega una pantalla**, no después.

La razón de que este archivo exista: el panel se construyó salteando pasos del
Build Order —el Step 13 antes que el Step 12— y sin un mapa cada sesión nueva
tiene que deducir el estado leyendo carpetas. Ya pasó una vez: `/admin/partidos`
se creó y quedó una hora sin ningún link que llevara ahí.

## Lo que existe hoy

| Ruta | Qué hace | Step |
|---|---|---|
| `/admin/login` | Entrar: contraseña o magic link | 5 |
| `/admin` | Listado de notas, borradores arriba | 8 |
| `/admin/notas/nueva` · `/admin/notas/[id]` | El editor, con vista previa | 8 |
| `/admin/partidos` | Los partidos, puerta a la planilla | — |
| `/admin/partidos/[id]/planilla` | Cargar goles, tarjetas y cambios | 13 ★ |

## Lo que falta, y dónde va

**Step 12 — CRUD de entidades.** Es el hueco grande, y va **antes** de que esto
escale: hoy jugadoras, equipos, temporadas y partidos entran sólo por SQL.

| Ruta a crear | Para qué | Hoy se hace |
|---|---|---|
| `/admin/jugadoras` | Alta y edición de jugadoras, foto incluida | SQL |
| `/admin/equipos` | Los rivales. Uno solo es propio (`es_aldosivi`) | `seed.sql` |
| `/admin/temporadas` | Alta de temporada, cuál está activa | `seed.sql` |
| `/admin/plantel/[temporadaId]` | Quién está en el plantel de cada temporada | SQL |
| `/admin/partidos/nuevo` | **Crear** un partido. Hoy sólo se puede editar uno que ya existe | SQL |
| `/admin/tabla/[temporadaId]` | Cargar la tabla de posiciones | nadie |

Otras cosas anotadas y no hechas:

- **Cola offline en IndexedDB** para la planilla (blueprint § 7.6). Sin ella un
  evento cargado sin señal se pierde. Es lo que hace que la planilla sirva en
  una cancha de ascenso.
- **Los nodos `imagen` y `planilla` en el editor.** El renderer ya los dibuja;
  falta la extensión de TipTap que los inserta.
- **Reintentar posteos fallidos** desde el panel, leyendo `social_posts`.
- **Etiquetas / palabras clave.** No hay nada en el schema y es una feature
  entera: tabla, ABM y páginas de listado. Decisión tomada el 20/09: **se deja
  para más adelante**. Ojo con la tentación de usar etiquetas para "notas de
  esta jugadora" o "de este rival": para eso están `jugadora_id` y los datos
  duros, que no se escriben mal ni se duplican. Las etiquetas sirven para lo que
  no es un dato —"mercado de pases", "lesiones"—.

## Cómo se agrega una pantalla

1. **La ruta** va en `src/app/admin/(panel)/`. El grupo `(panel)` es el que
   tiene el layout protegido; sólo `/admin/login` queda afuera, o se
   redirigiría a sí mismo para siempre.
2. **El link va en `BarraAdmin`.** Una pantalla a la que no se llega desde la
   barra es una pantalla que nadie va a encontrar.
3. **Esta tabla se actualiza en el mismo commit.**
4. **Las queries van en `src/lib/supabase/queries/*`**, nunca un `.from()`
   adentro de un componente.
5. **Los Server Actions van en `src/actions/*`**, uno por entidad: `notas.ts`,
   `eventos.ts`, `imagenes.ts`, `sesion.ts`.
6. **La lógica que se pueda sacar del componente va a `src/lib/` con su test.**
   `nota.ts`, `planilla.ts` y `vista-previa.ts` son los que ya están.

## Las reglas que este panel sigue

- **Todo se escribe con la sesión del autor, nunca con la service role.** El
  cliente de `supabase/admin.ts` bypassea RLS y es para procesos sin usuario
  —Inngest, los scripts—. Si una pantalla del admin lo necesitara, está mal
  pensada: lo que falta es una política.
- **El layout re-verifica fila en `autores`.** Tener sesión de Auth no es ser el
  autor; es el mismo criterio que `es_autor()` en RLS.
- **Los datos deportivos no se escriben a mano en el texto** (regla no
  negociable 2). La nota elige un partido; los goles se cargan en la planilla.
- **Un componente por archivo, máximo 300 líneas.** `FormularioNota` ya las pasó
  dos veces y se partió en `CamposClasificacion`, `CampoImagen` y
  `BarraAcciones`.
- **Todo control lleva `.tactil`** (44px). La única excepción del proyecto está
  documentada en `BotonesCompartir`, y es del sitio público, no del panel.
