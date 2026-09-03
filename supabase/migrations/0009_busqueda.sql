-- 0009_busqueda.sql
-- Búsqueda full-text en español. El volumen no justifica un servicio externo.
-- El título pesa más que la bajada (setweight A vs B).

alter table notas add column busqueda tsvector
  generated always as (
    setweight(to_tsvector('spanish', coalesce(titulo, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(bajada, '')), 'B')
  ) stored;

create index notas_busqueda_idx on notas using gin (busqueda);

-- Búsqueda con ranking. SECURITY INVOKER para que RLS siga filtrando los
-- borradores según quién consulte.
create or replace function buscar_notas(termino text, limite int default 20)
returns table (
  id           uuid,
  titulo       text,
  slug         text,
  bajada       text,
  categoria    categoria_t,
  publicada_en timestamptz,
  rank         real
) as $$
  select
    n.id, n.titulo, n.slug, n.bajada, n.categoria, n.publicada_en,
    ts_rank(n.busqueda, websearch_to_tsquery('spanish', termino)) as rank
  from notas n
  where n.busqueda @@ websearch_to_tsquery('spanish', termino)
  order by rank desc, n.publicada_en desc
  limit limite;
$$ language sql stable;
