-- 0017_configuracion.sql — los ajustes que se cargan desde el panel.
--
-- Pedido de Charlie: el id de Google Analytics como un casillero del panel y no
-- como una variable de entorno. Hoy anda con `NEXT_PUBLIC_GA_ID`, que para
-- cambiarlo hay que entrar a Vercel y volver a desplegar — o sea que no lo puede
-- cambiar él.
--
-- Es la tabla que también va a necesitar AdSense cuando se decida dónde van los
-- huecos, así que nace genérica en vez de nacer como una columna `ga_id` en
-- algún lado.
--
-- ============================================
-- LO QUE NO VA ACÁ
-- ============================================
--
-- **Nada secreto.** El sitio público tiene que poder leer esta tabla para
-- inyectar el script de analítica, así que la lectura es pública: cualquiera con
-- la anon key —que viaja en el bundle por diseño— puede listarla entera. Un
-- token de la API de Instagram o la service role acá serían un secreto
-- publicado.
--
-- Los secretos siguen en el entorno, que es donde están (`lib/social/*`,
-- `SUPABASE_SERVICE_ROLE_KEY`). Lo que entra acá es lo que de todas formas
-- termina en el HTML de cada página: un id de medición, un id de cliente de
-- publicidad.
--
-- **El CHECK sobre `clave` es lo que sostiene esa regla.** Sin él, la tabla es
-- un lugar donde cualquiera que pueda escribir deja lo que quiera y el sitio lo
-- publica. Agregar una clave nueva es una migración, a propósito: es el momento
-- en que alguien tiene que leer este comentario y decidir si el valor es
-- publicable.

create table configuracion (
  clave      text primary key,
  valor      text,
  updated_at timestamptz not null default now(),

  constraint clave_conocida check (clave in ('analytics_ga_id'))
);

comment on table configuracion is
  'Ajustes del sitio cargados desde el panel. LECTURA PÚBLICA: nada secreto.';

comment on column configuracion.valor is
  'Null o vacío es "no configurado", y el sitio no dibuja nada.';

-- ============================================
-- RLS
-- ============================================

alter table configuracion enable row level security;

-- El layout raíz lee esto con el cliente anónimo —`createStaticClient()`— para
-- no volver dinámicas todas las rutas del sitio. Sin esta política, el casillero
-- se cargaría en el panel y no haría nada en producción.
create policy lectura_publica on configuracion for select using (true);

-- Escribe un editor y nadie más. Prender la analítica del medio no es una tarea
-- de redacción: deja cookies en el navegador de cada lector y eso lo decide
-- quien responde por el sitio. `es_editor()` viene de la 0014.
create policy escritura_editor on configuracion for all
  using (es_editor())
  with check (es_editor());

-- ============================================
-- La fila
-- ============================================

-- Nace vacía y a propósito: esta migración **no prende la analítica**. Mientras
-- `valor` sea null, `<Analitica />` no inyecta nada, que es exactamente lo que
-- pasa hoy con la variable sin cargar.
--
-- **No cargar el id antes de publicar la política de privacidad.** GA deja
-- cookies, y la política no existe porque depende de datos que sólo tiene
-- Charlie —el mail del medio, el responsable de datos, los handles—. Está
-- contado en el comentario de `<Footer />` y ahora también en la pantalla que
-- edita esto.
insert into configuracion (clave, valor) values ('analytics_ga_id', null);

-- ============================================
-- Verificación
-- ============================================
--
--   select clave, valor, updated_at from configuracion;
--
-- Tiene que haber una fila con `valor` en null. Y la clave de más tiene que
-- rebotar, que es el punto del CHECK:
--
--   insert into configuracion (clave, valor) values ('token_de_instagram', 'x');
--   -- ERROR: new row violates check constraint "clave_conocida"
