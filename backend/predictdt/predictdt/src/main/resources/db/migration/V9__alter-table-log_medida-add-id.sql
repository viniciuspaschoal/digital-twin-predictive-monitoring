ALTER TABLE log_medida
ADD COLUMN id UUID;

UPDATE log_medida
SET id = gen_random_uuid()
WHERE id IS NULL;

ALTER TABLE log_medida
ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE log_medida
ALTER COLUMN id SET NOT NULL;

ALTER TABLE log_medida
ADD CONSTRAINT pk_log_medida PRIMARY KEY (id, dt_medida);