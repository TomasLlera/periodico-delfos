-- 0010_storage_media.sql
-- El bucket de imágenes y sus políticas.
--
-- Hasta ahora el bucket `media` lo creaba `scripts/migrate-wp.ts` con la
-- service role, que bypassea todo: existía por efecto secundario de la
-- migración y sin una sola política. Eso alcanzaba mientras el único que subía
-- imágenes era un script; deja de alcanzar cuando el editor del admin sube la
-- portada de una nota, porque ahí quien sube es Charlie con su sesión y RLS
-- decide.
--
-- Es idempotente: se puede correr sobre un proyecto donde el script ya creó el
-- bucket.

-- ============================================
-- El bucket
-- ============================================
--
-- Público de lectura, y no es un descuido: Instagram exige una `image_url`
-- HTTPS accesible sin credenciales para postear (regla no negociable 6), y el
-- transformador de imágenes de Supabase sirve desde acá. Lo que se protege es
-- la escritura.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- ============================================
-- Políticas
-- ============================================
--
-- Mismo criterio que las tablas en `0008_rls.sql`: lee cualquiera, escribe el
-- autor. `es_autor()` ya existe y chequea que `auth.uid()` tenga fila en
-- `autores`, así que un usuario de Auth sin fila no sube nada.

drop policy if exists media_lectura_publica on storage.objects;
create policy media_lectura_publica on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists media_escritura_autor on storage.objects;
create policy media_escritura_autor on storage.objects
  for insert with check (bucket_id = 'media' and es_autor());

-- Reemplazar una imagen es `update`, y borrarla al descartar una nota es
-- `delete`. Sin estas dos, el editor puede subir pero no corregir.
drop policy if exists media_actualizacion_autor on storage.objects;
create policy media_actualizacion_autor on storage.objects
  for update using (bucket_id = 'media' and es_autor())
  with check (bucket_id = 'media' and es_autor());

drop policy if exists media_borrado_autor on storage.objects;
create policy media_borrado_autor on storage.objects
  for delete using (bucket_id = 'media' and es_autor());

-- ============================================
-- Verificación
-- ============================================
--
--   select name, public from storage.buckets where id = 'media';
--   select policyname from pg_policies
--    where schemaname = 'storage' and tablename = 'objects'
--      and policyname like 'media_%';
--
-- Esperado: una fila `media | true`, y las cuatro políticas.
