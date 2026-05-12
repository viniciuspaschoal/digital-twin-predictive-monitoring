ALTER TABLE equipamento
ADD COLUMN tipo_equipamento_id UUID;

ALTER TABLE equipamento
ADD CONSTRAINT fk_equipamento_tipo_equipamento
FOREIGN KEY (tipo_equipamento_id)
REFERENCES tipo_equipamento (id);

CREATE INDEX idx_equipamento_tipo_equipamento
ON equipamento(tipo_equipamento_id);