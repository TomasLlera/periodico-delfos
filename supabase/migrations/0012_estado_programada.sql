-- 0012_estado_programada.sql
-- El valor nuevo del enum de estado, solo.
--
-- VA EN SU PROPIA MIGRACION Y NO JUNTO A LA COLUMNA, y no es prolijidad:
-- Postgres no deja usar un valor de enum recien agregado en la misma
-- transaccion que lo agrego. El CHECK de la 0013 nombra 'programada', asi que
-- si las dos cosas fueran un solo archivo la migracion falla con
--
--     unsafe use of new value "programada" of enum type estado_nota_t
--
-- Partido en dos, el valor queda commiteado antes de que nadie lo use.
--
-- `if not exists` para que correr las migraciones dos veces no rompa.

alter type estado_nota_t add value if not exists 'programada';
