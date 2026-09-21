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
| `/admin/equipos` · `/nuevo` · `/[id]` | Los rivales y el equipo propio | 12 |
| `/admin/temporadas` · `/nueva` · `/[id]` | Las temporadas, y cuál está en curso | 12 |
| `/admin/jugadoras` · `/nueva` · `/[id]` | Las fichas, con foto | 12 |
| `/admin/plantel/[temporadaId]` | Quién está en el plantel, con su dorsal | 12 |
| `/admin/tabla/[temporadaId]` | La tabla de posiciones, por fecha | 12 |
| `/admin/partidos` | Los partidos, con lo que tiene cargado cada uno | 12 |
| `/admin/partidos/nuevo` · `/[id]` | Crear y editar la ficha de un partido | 12 |
| `/admin/partidos/[id]/formacion` | Quiénes juegan: titulares y suplentes | 12 |
| `/admin/partidos/[id]/planilla` | Cargar goles, tarjetas y cambios | 13 ★ |

**El plantel y la tabla no tienen link en la barra**: cuelgan de una temporada
y se entra desde el listado de temporadas, que es donde ya se sabe de cuál. Una
pantalla suelta obligaría a elegirla de nuevo, y seis links parten la barra en
dos renglones en un celular.

## El orden en que se carga una temporada

Las seis pantallas del Step 12 no son independientes: cada una necesita la
anterior. En una base recién creada el orden es **uno solo**, y la pantalla de
alta de partido lo dice cuando falta algo.

1. **Temporada** — de ella cuelga todo lo demás. Marcarla como en curso.
2. **Equipos** — Aldosivi con "es el equipo propio", y los rivales.
3. **Jugadoras** — la ficha de la persona. Sin dorsal: el dorsal es del año.
4. **Plantel** — quién está este año y con qué número.
5. **Partido** — necesita la temporada y dos equipos.
6. **Formación** — quiénes juegan ese partido, del plantel del año.
7. **Planilla** — recién acá se cargan los goles.

El paso 6 es el que no estaba y el que rompía la cadena: `PlanillaCarga` arma
su grilla con `enCancha()`, que arranca de las titulares de `formaciones`. Un
partido sin formación abre la planilla sin ninguna jugadora que tocar.

## Lo que falta, y dónde va

- **Probar la planilla en un celular real y cronometrarla**, y probar la cola
  offline cortando los datos a mitad de partido. El encargo dice que ése es el
  entregable de verdad: si pasa de tres minutos, iterar. Es lo único del panel
  que no se puede verificar desde esta máquina.
- **Reintentar posteos fallidos** desde el panel, leyendo `social_posts`. Hoy
  no hay nada que reintentar: Inngest no está cableado.
- **Una quita de puntos en la tabla.** Hoy `puntos` es derivado —se calcula con
  ganados y empatados— porque el CHECK `puntos_cuadran` de `0004` lo exige. El
  día que haga falta hay que tocar el CHECK **y** el `refine` de
  `entidades/tabla.ts`, no sólo la pantalla.
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
2. **El link va en `BarraAdmin`**, salvo que cuelgue de otra entidad y se entre
   desde su listado, como el plantel y la tabla. Una pantalla a la que no se
   llega es una pantalla que nadie va a encontrar.
3. **Esta tabla se actualiza en el mismo commit.**
4. **Las queries van en `src/lib/supabase/queries/*`**, nunca un `.from()`
   adentro de un componente.
5. **Los Server Actions van en `src/actions/*`**, uno por entidad.
6. **La lógica que se pueda sacar del componente va a `src/lib/` con su test.**

## Dónde vive cada cosa del CRUD

| Capa | Dónde | Qué hay |
|---|---|---|
| Validación y reglas | `src/lib/entidades/*` | Un esquema de Zod y la lógica pura por entidad, con test |
| Piezas compartidas | `src/lib/entidades/campos.ts` | `slugificar`, los campos de Zod, el huso de la fecha |
| Escritura | `src/actions/*` | Un Server Action por entidad |
| Lectura | `src/lib/supabase/queries/*` | Una query por caso de uso |
| Estado del formulario | `src/components/admin/usarFormulario.ts` | El hook que comparten los cuatro formularios |
| Revalidación | `src/lib/revalidar.ts` | Qué rutas públicas caen con cada cambio |
| Cola offline | `src/lib/cola.ts` · `cola-idb.ts` · `usarCola.ts` | La lógica con test, el IndexedDB y el hook |
| Nodos del editor | `src/lib/tiptap/extensiones.tsx` | `imagen` y `planilla`, con los atributos que fija `esquema.ts` |

**La lógica de cada entidad está partida en dos archivos a propósito.**
`src/lib/partido.ts` es la de lectura —lados, minutos, agrupación de eventos— y
`src/lib/entidades/partido.ts` es la de escritura —qué se puede guardar—. Lo
mismo con `temporada.ts`, `jugadora.ts` y `plantel.ts`. Juntarlas dejaría
archivos de seiscientas líneas donde la mitad la usa el sitio público y la otra
mitad sólo el panel.

## Las reglas que este panel sigue

- **Todo se escribe con la sesión del autor, nunca con la service role.** El
  cliente de `supabase/admin.ts` bypassea RLS y es para procesos sin usuario
  —Inngest, los scripts—. Si una pantalla del admin lo necesitara, está mal
  pensada: lo que falta es una política.
- **El layout re-verifica fila en `autores`.** Tener sesión de Auth no es ser el
  autor; es el mismo criterio que `es_autor()` en RLS.
- **Los datos deportivos no se escriben a mano en el texto** (regla no
  negociable 2). La nota elige un partido; los goles se cargan en la planilla.
  La única excepción del proyecto es la tabla de posiciones, razonada en el
  blueprint § 4.4 y acotada a esa tabla.
- **Lo que la base valida, el formulario lo repite.** No para reemplazarla
  —manda la base— sino para que el error llegue como una frase en español al
  lado del campo y no como un 400 de Postgres.
- **Lo que no se puede borrar, no se borra.** Una jugadora tiene goles en
  `eventos`: se marca inactiva. Un partido con la planilla cargada no se borra:
  se marca suspendido. Los borrados que sí existen chequean antes y explican qué
  se llevarían puesto.
- **En la planilla, el evento se guarda primero en el teléfono y después se
  sube.** Nunca al revés: el corte de señal más desprolijo —el que deja el
  request colgado hasta el timeout— no puede perder un gol si el gol ya estaba
  escrito antes de intentar nada. El id lo genera el navegador, y es lo que
  hace que reintentar no cargue el gol dos veces.
- **La hora de un partido es la de Mar del Plata, siempre.** El huso está fijo
  en `entidades/campos.ts` y no sale del reloj de la máquina: el mismo cálculo
  corre en el servidor —Vercel, en UTC— y en el navegador.
- **Un componente por archivo, máximo 300 líneas.**
- **Todo control lleva `.tactil`** (44px). La única excepción del proyecto está
  documentada en `BotonesCompartir`, y es del sitio público, no del panel.
