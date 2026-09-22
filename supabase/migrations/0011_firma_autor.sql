-- 0011_firma_autor.sql — quién firma lo que escribe una cuenta.
--
-- El panel exige fila en `autores` para entrar (`es_autor()`, `0008_rls.sql`),
-- así que toda cuenta con acceso es un autor a los ojos de la base. Pero no
-- toda cuenta con acceso es alguien que escribe en el medio: está la del
-- operador técnico, que entra a arreglar cosas y a probar, y está la de
-- `scripts/usuario-e2e.ts`. Sus notas no pueden salir con su nombre, porque ese
-- nombre no es una firma del diario.
--
-- `firma_como` apunta a la cuenta que va a quedar firmando. Null es el caso
-- normal —quien escribe firma lo suyo— y la cuenta técnica apunta al titular.
-- `src/actions/notas.ts` resuelve `autor_id = firma_como ?? id` al crear.
--
-- Se prefiere esto a una lista de cuentas técnicas en el código porque el dato
-- vive donde vive el autor, y porque el día que haya una segunda periodista
-- entra con `firma_como` en null y firma lo suyo sin tocar una línea.
--
-- Es una sola indirección y a propósito: la resolución no sigue cadenas. Si A
-- apunta a B y B apunta a C, lo de A queda firmado por B. El CHECK sólo
-- descarta el caso degenerado de apuntarse a sí mismo; encadenar requiere dos
-- updates deliberados y no vale un trigger.

alter table autores
  add column firma_como uuid references autores(id) on delete set null;

alter table autores
  add constraint firma_como_no_es_uno_mismo
  check (firma_como is null or firma_como <> id);

comment on column autores.firma_como is
  'Cuenta que queda firmando lo que escribe ésta. Null: firma lo suyo.';

-- ============================================
-- Verificación
-- ============================================
--
--   select nombre, slug, firma_como from autores order by slug;
--
-- Las cuentas que no son del medio tienen que quedar apuntando al titular.
-- Eso no lo hace esta migración ni el seed: los UUID salen de Auth y son
-- distintos en cada instalación. Va a mano, una vez por cuenta:
--
--   update autores set firma_como = (select id from autores where slug = 'charlie-redondo')
--    where slug = 'tomas-llera';
