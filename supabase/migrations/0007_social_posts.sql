-- 0007_social_posts.sql
-- Registro de cada intento de posteo por red. El UNIQUE (nota_id, platform) es
-- lo que hace idempotente el fan-out: reintentar nunca duplica.

create type social_platform as enum ('facebook','instagram','x');
create type social_status   as enum ('pending','processing','success','failed');

create table social_posts (
  id                uuid primary key default gen_random_uuid(),
  nota_id           uuid not null references notas(id) on delete cascade,
  nota_slug         text not null,
  platform          social_platform not null,
  status            social_status not null default 'pending',
  external_post_id  text,
  external_url      text,
  error_message     text,
  attempts          int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  unique (nota_id, platform)
);

create index social_posts_status_idx on social_posts (status, updated_at desc);
create index social_posts_nota_idx   on social_posts (nota_id);

create trigger social_posts_updated_at
  before update on social_posts
  for each row execute function set_updated_at();
