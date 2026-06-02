CREATE TABLE modelo_3d (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    nome_original_arquivo VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,

    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    camera_position_x DOUBLE PRECISION,
    camera_position_y DOUBLE PRECISION,
    camera_position_z DOUBLE PRECISION,

    camera_target_x DOUBLE PRECISION,
    camera_target_y DOUBLE PRECISION,
    camera_target_z DOUBLE PRECISION,

    dt_inclusao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    dt_alteracao TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_modelo_3d_ativo
ON modelo_3d(ativo)
WHERE ativo = TRUE;

CREATE INDEX idx_modelo_3d_dt_inclusao
ON modelo_3d(dt_inclusao DESC);