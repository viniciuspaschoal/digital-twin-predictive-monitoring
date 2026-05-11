ALTER TABLE sensor_baseline
DROP CONSTRAINT ck_sensor_baseline_status;

ALTER TABLE sensor_baseline
ADD CONSTRAINT ck_sensor_baseline_status
CHECK (
    status IN (
        'CANDIDATO',
        'ATIVO',
        'SUSPEITO',
        'DESCARTADO',
        'HISTORICO'
    )
);