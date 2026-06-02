CREATE TABLE modelo_3d_equipamento_vinculo (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    modelo_3d_id UUID NOT NULL,
    object_name VARCHAR(255) NOT NULL,
    object_name_normalized VARCHAR(255) NOT NULL,

    equipamento_id UUID NOT NULL,

    dt_inclusao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    dt_alteracao TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_modelo_3d_vinculo_modelo
        FOREIGN KEY (modelo_3d_id)
        REFERENCES modelo_3d(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_modelo_3d_vinculo_equipamento
        FOREIGN KEY (equipamento_id)
        REFERENCES equipamento(id),

    CONSTRAINT uq_modelo_3d_object_name
        UNIQUE (modelo_3d_id, object_name_normalized)
);

CREATE INDEX idx_modelo_3d_vinculo_modelo
ON modelo_3d_equipamento_vinculo(modelo_3d_id);

CREATE INDEX idx_modelo_3d_vinculo_equipamento
ON modelo_3d_equipamento_vinculo(equipamento_id);