-- 0008_rls.sql
-- RLS es la línea de defensa real, no el middleware. La anon key viaja en el
-- bundle por diseño; lo que impide escribir o leer borradores es esto.

alter table temporadas       enable row level security;
alter table equipos          enable row level security;
alter table autores          enable row level security;
alter table jugadoras        enable row level security;
alter table plantel          enable row level security;
alter table partidos         enable row level security;
alter table formaciones      enable row level security;
alter table eventos          enable row level security;
alter table tabla_posiciones enable row level security;
alter table notas            enable row level security;
alter table social_posts     enable row level security;

-- ============================================
-- Helper
-- ============================================

-- SECURITY DEFINER a propósito: si consultara `autores` con los permisos del
-- invocador, la política de escritura sobre `autores` se llamaría a sí misma.
create or replace function es_autor() returns boolean as $$
  select exists (select 1 from autores where id = auth.uid());
$$ language sql stable security definer set search_path = public;

-- ============================================
-- Lectura pública de catálogos y datos deportivos
-- ============================================

create policy lectura_publica on temporadas       for select using (true);
create policy lectura_publica on equipos          for select using (true);
create policy lectura_publica on autores          for select using (true);
create policy lectura_publica on jugadoras        for select using (true);
create policy lectura_publica on plantel          for select using (true);
create policy lectura_publica on partidos         for select using (true);
create policy lectura_publica on formaciones      for select using (true);
create policy lectura_publica on eventos          for select using (true);
create policy lectura_publica on tabla_posiciones for select using (true);

-- ============================================
-- Notas: sólo las publicadas son públicas
-- ============================================

create policy lectura_publicadas on notas for select
  using (estado = 'publicada' and publicada_en <= now());

create policy lectura_autor on notas for select
  using (es_autor());

-- ============================================
-- Escritura: sólo autores
-- ============================================

create policy escritura_autor on temporadas       for all using (es_autor()) with check (es_autor());
create policy escritura_autor on equipos          for all using (es_autor()) with check (es_autor());
create policy escritura_autor on autores          for all using (es_autor()) with check (es_autor());
create policy escritura_autor on jugadoras        for all using (es_autor()) with check (es_autor());
create policy escritura_autor on plantel          for all using (es_autor()) with check (es_autor());
create policy escritura_autor on partidos         for all using (es_autor()) with check (es_autor());
create policy escritura_autor on formaciones      for all using (es_autor()) with check (es_autor());
create policy escritura_autor on eventos          for all using (es_autor()) with check (es_autor());
create policy escritura_autor on tabla_posiciones for all using (es_autor()) with check (es_autor());
create policy escritura_autor on notas            for all using (es_autor()) with check (es_autor());

-- ============================================
-- social_posts: no se expone al público
-- ============================================

-- La escritura la hace Inngest con service role, que bypassea RLS.
create policy lectura_autor on social_posts for select using (es_autor());
