ALTER TABLE sensor_equipamento
ADD COLUMN tipo_relacao VARCHAR(50) NOT NULL DEFAULT 'DIRETO';

ALTER TABLE sensor_equipamento
ADD CONSTRAINT ck_sensor_equipamento_tipo_relacao
CHECK (
    tipo_relacao IN (
        'DIRETO',
        'AMBIENTE',
        'ENTRADA',
        'SAIDA',
        'REFERENCIA',
        'AUXILIAR'
    )
);

CREATE INDEX idx_sensor_equipamento_tipo_relacao
ON sensor_equipamento(tipo_relacao);