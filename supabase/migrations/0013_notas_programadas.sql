-- 0013_notas_programadas.sql
-- Dejar una nota lista y que salga sola a la hora que se le diga.
--
-- Pedido de Charlie. El estado 'programada' entra en la 0012; esto es la fecha
-- y las reglas que la acompanan.

alter table notas add column if not exists publicar_en timestamptz;

comment on column notas.publicar_en is
  'Cuando tiene que salir una nota programada. Lo lee el cron de Inngest.';

-- Una programada sin fecha no se publica nunca y queda invisible: ni la ve el
-- lector, porque el sitio filtra por estado, ni la encuentra el cron. Es el
-- mismo criterio que `publicada_tiene_fecha`, que ya existe en esta tabla.
alter table notas drop constraint if exists programada_tiene_fecha;
alter table notas add constraint programada_tiene_fecha check (
  estado <> 'programada' or publicar_en is not null
);

-- El indice del cron: busca las que ya vencieron, nada mas. Parcial porque las
-- programadas son un punado al lado del archivo entero, y asi el indice no
-- crece con las 70 notas de la migracion de WordPress ni con las que vengan.
create index if not exists notas_programadas_idx
  on notas (publicar_en)
  where estado = 'programada';
