-- 0014_roles_de_autor.sql — colaboradores que firman sus propias notas.
--
-- Pedido de Charlie. La base ya aguantaba la firma —`notas.autor_id` existe
-- desde la 0005 y `autores` desde la 0001—, pero no el reparto: con
-- `es_autor()` como única regla, toda cuenta con acceso al panel ve y edita
-- todas las notas, incluidas las de los demás.
--
-- LA DECISIÓN, que es lo que esto cambia: **cada autor toca sólo lo suyo, y un
-- rol de editor ve todo.** La alternativa era que todos vean y editen todo y
-- que la firma quede como un dato decorativo. Se descartó porque no hay forma
-- de deshacer una nota que otro editó encima, y porque el día que entre el
-- tercer colaborador la decisión ya no se puede tomar sin migrar notas ajenas.
--
-- QUÉ NO CAMBIA. Los datos deportivos siguen siendo de todos: cualquier autor
-- carga partidos, jugadoras, planillas y la tabla de posiciones. El reparto es
-- de las notas, que son lo que se firma. Un campeonato donde cada uno carga su
-- propia versión de la fecha 4 no es más seguro, es inservible.
--
-- UNA SOLA MIGRACIÓN Y NO DOS, al revés de la 0012 y la 0013. Lo que no se
-- puede usar en la misma transacción que lo creó es un valor **agregado** a un
-- enum que ya existía (`alter type ... add value`). Un `create type` nuevo se
-- puede usar enseguida, y es lo que pasa acá.

-- ============================================
-- El rol
-- ============================================

create type rol_autor as enum ('editor', 'redactor');

-- EL DEFAULT SE PONE DOS VECES A PROPÓSITO. Las filas que ya existen —la de
-- Charlie y las técnicas— tienen que quedar como editores: hoy ya ven todo y
-- una migración no puede sacarle acceso a quien está trabajando. Las que vengan
-- después nacen redactoras, que es el caso del colaborador nuevo. Es la única
-- forma de darle un valor distinto a lo viejo y a lo nuevo en un solo paso.
alter table autores add column rol rol_autor not null default 'editor';
alter table autores alter column rol set default 'redactor';

comment on column autores.rol is
  'editor: ve y edita todas las notas, y da de alta cuentas. redactor: sólo las suyas.';

-- ============================================
-- Helpers
-- ============================================

-- SECURITY DEFINER por la misma razón que `es_autor()`: si consultara `autores`
-- con los permisos del invocador, la política de escritura sobre `autores` se
-- llamaría a sí misma.
create or replace function es_editor() returns boolean as $$
  select exists (select 1 from autores where id = auth.uid() and rol = 'editor');
$$ language sql stable security definer set search_path = public;

-- Con qué `autor_id` quedan firmadas las notas de esta sesión.
--
-- **No es `auth.uid()`**, y la diferencia es la razón de ser de la 0011: una
-- cuenta técnica escribe con `firma_como` apuntando al titular, así que sus
-- notas se guardan con el `autor_id` de él. Si "lo suyo" se midiera contra
-- `auth.uid()`, esa cuenta no vería ni las notas que acaba de cargar.
--
-- Es la misma resolución que hace `firmaDe()` en `src/lib/nota.ts`, y tiene que
-- seguir siéndolo: una de las dos decide qué se guarda y la otra qué se puede
-- leer. Si se separan, alguien escribe una nota que después no puede abrir.
create or replace function firma_de_la_sesion() returns uuid as $$
  select coalesce(firma_como, id) from autores where id = auth.uid();
$$ language sql stable security definer set search_path = public;

-- ============================================
-- Notas: cada uno las suyas
-- ============================================

-- `lectura_publicadas` no se toca: lo publicado es público y eso no cambia.
drop policy lectura_autor on notas;
drop policy escritura_autor on notas;

create policy lectura_propias on notas for select
  using (es_editor() or autor_id = firma_de_la_sesion());

-- El `with check` es lo que impide firmar en nombre de otro: un redactor sólo
-- puede insertar o dejar una nota con su propio `autor_id`. `src/actions/notas.ts`
-- ya lo pone desde la sesión y nunca desde el formulario, pero un Server Action
-- es una ruta HTTP y la política es la que lo sostiene si alguien la llama a mano.
create policy escritura_propias on notas for all
  using (es_editor() or autor_id = firma_de_la_sesion())
  with check (es_editor() or autor_id = firma_de_la_sesion());

-- ============================================
-- Autores: el perfil propio, y el alta sólo para editores
-- ============================================

-- Antes cualquier autor podía escribir cualquier fila de `autores`, que con una
-- sola persona daba igual.
drop policy escritura_autor on autores;

create policy perfil_propio on autores for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy gestion_de_autores on autores for all
  using (es_editor())
  with check (es_editor());

-- EL ROL NO SE EDITA DESDE EL PERFIL PROPIO, y sin esto sí se podía: la
-- política de arriba deja a cada uno escribir su fila, y en esa fila está la
-- columna que decide si ve las notas de los demás. Un `update autores set rol =
-- 'editor' where id = auth.uid()` desde la anon key habría alcanzado.
--
-- Va como trigger y no como política porque RLS decide por fila y esto es por
-- columna. La alternativa era quitarle el `update` sobre la columna al rol
-- `authenticated` con un GRANT, pero eso también se lo quita a los editores,
-- que son los que tienen que poder cambiarlo.
--
-- `firma_como` viaja en el mismo bolsillo: apuntarla a otra cuenta es elegir en
-- nombre de quién se publica.
--
-- **Sin SECURITY DEFINER, al revés de los helpers de arriba**, y no es un
-- olvido: un trigger definer corre como su dueño y entonces `current_user` dice
-- `postgres` siempre, con lo que la excepción del service role de abajo no
-- distinguiría nada. No necesita permisos de más: lo único que consulta es
-- `es_editor()`, que sí es definer.
--
-- La excepción del service role no abre nada que no estuviera abierto: esa clave
-- bypassea RLS por completo y es sólo de servidor. La necesitan
-- `scripts/usuario-e2e.ts`, que deja su cuenta como editora para que la suite
-- del panel vea lo que veía antes, y cualquier arreglo a mano desde un script.
create or replace function cambio_de_rol_solo_por_editor() returns trigger as $$
begin
  if (new.rol <> old.rol or new.firma_como is distinct from old.firma_como)
     and current_user <> 'service_role'
     and not es_editor() then
    raise exception 'Sólo un editor puede cambiar el rol o la firma de una cuenta';
  end if;
  return new;
end;
$$ language plpgsql set search_path = public;

create trigger autores_rol_solo_por_editor
  before update on autores
  for each row execute function cambio_de_rol_solo_por_editor();

-- ============================================
-- social_posts: el registro sigue a la nota
-- ============================================

-- `/admin/posteos` muestra qué salió a cada red y qué falló. Un redactor no
-- tiene por qué ver el registro de las notas de otro, así que la lectura sigue
-- el mismo reparto. La subconsulta corre con los permisos del invocador, o sea
-- que una nota que no puede ver tampoco le deja ver su registro.
drop policy lectura_autor on social_posts;

create policy lectura_propia on social_posts for select
  using (
    es_editor()
    or exists (
      select 1 from notas
      where notas.id = social_posts.nota_id
        and notas.autor_id = firma_de_la_sesion()
    )
  );

-- ============================================
-- Verificación
-- ============================================
--
-- Quién quedó como qué:
--
--   select nombre, slug, rol, firma_como from autores order by rol, slug;
--
-- Las filas que ya existían tienen que decir `editor`. Si una cuenta técnica
-- quedó como editora y no se la quiere así:
--
--   update autores set rol = 'redactor' where slug = 'tomas-llera';
--
-- Y el reparto, mirado desde la cuenta de un redactor —no desde el SQL editor,
-- que corre con service role y bypassea RLS—: entrar al panel con esa cuenta y
-- ver que el listado de notas muestre sólo las suyas.
