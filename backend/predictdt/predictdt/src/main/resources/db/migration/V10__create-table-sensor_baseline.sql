CREATE TABLE sensor_baseline (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    sensor_id UUID NOT NULL,

    media DOUBLE PRECISION NOT NULL,
    desvio_padrao DOUBLE PRECISION NOT NULL,

    limite_min DOUBLE PRECISION NOT NULL,
    limite_max DOUBLE PRECISION NOT NULL,

    valor_minimo_observado DOUBLE PRECISION,
    valor_maximo_observado DOUBLE PRECISION,

    fator_desvio DOUBLE PRECISION NOT NULL DEFAULT 2.0,

    janela_inicio TIMESTAMPTZ NOT NULL,
    janela_fim TIMESTAMPTZ NOT NULL,

    tipo_janela VARCHAR(30) NOT NULL,

    qtd_amostras INTEGER NOT NULL,

    metodo VARCHAR(50) NOT NULL DEFAULT 'MEDIA_DESVIO_PADRAO',

    status VARCHAR(30) NOT NULL DEFAULT 'CANDIDATO',

    confianca DOUBLE PRECISION,

    ativo BOOLEAN NOT NULL DEFAULT FALSE,

    motivo_status TEXT,

    dt_calculo TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_sensor_baseline_sensor FOREIGN KEY (sensor_id)
        REFERENCES sensor (id),

    CONSTRAINT ck_sensor_baseline_desvio_padrao
        CHECK (desvio_padrao >= 0),

    CONSTRAINT ck_sensor_baseline_qtd_amostras
        CHECK (qtd_amostras >= 1),

    CONSTRAINT ck_sensor_baseline_limites
        CHECK (limite_min <= limite_max),

    CONSTRAINT ck_sensor_baseline_valores_observados
        CHECK (
            valor_minimo_observado IS NULL
            OR valor_maximo_observado IS NULL
            OR valor_minimo_observado <= valor_maximo_observado
        ),

    CONSTRAINT ck_sensor_baseline_fator_desvio
        CHECK (fator_desvio > 0),

    CONSTRAINT ck_sensor_baseline_janela
        CHECK (janela_inicio < janela_fim),

    CONSTRAINT ck_sensor_baseline_tipo_janela
        CHECK (tipo_janela IN ('24H', '7D', '30D', 'PERSONALIZADA')),

    CONSTRAINT ck_sensor_baseline_status
        CHECK (status IN ('CANDIDATO', 'ATIVO', 'SUSPEITO', 'DESCARTADO')),

    CONSTRAINT ck_sensor_baseline_confianca
        CHECK (confianca IS NULL OR (confianca >= 0 AND confianca <= 1)),

    CONSTRAINT ck_sensor_baseline_ativo_status
        CHECK (
            (ativo = TRUE AND status = 'ATIVO')
            OR
            (ativo = FALSE AND status <> 'ATIVO')
        )
);

CREATE INDEX idx_sensor_baseline_sensor_status
ON sensor_baseline(sensor_id, status);

CREATE INDEX idx_sensor_baseline_sensor_tipo_janela
ON sensor_baseline(sensor_id, tipo_janela);

CREATE INDEX idx_sensor_baseline_sensor_dt_calculo
ON sensor_baseline(sensor_id, dt_calculo DESC);

CREATE INDEX idx_sensor_baseline_ativo_lookup
ON sensor_baseline(sensor_id, tipo_janela)
WHERE ativo = TRUE;

CREATE UNIQUE INDEX uq_sensor_baseline_ativo_por_sensor_tipo_janela
ON sensor_baseline(sensor_id, tipo_janela)
WHERE ativo = TRUE;