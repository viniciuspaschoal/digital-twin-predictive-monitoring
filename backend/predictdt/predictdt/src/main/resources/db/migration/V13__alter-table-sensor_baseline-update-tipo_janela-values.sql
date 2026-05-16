ALTER TABLE sensor_baseline
DROP CONSTRAINT ck_sensor_baseline_tipo_janela;

ALTER TABLE sensor_baseline
ADD CONSTRAINT ck_sensor_baseline_tipo_janela
CHECK (tipo_janela IN ('H24', 'D7', 'D30', 'PERSONALIZADA'));