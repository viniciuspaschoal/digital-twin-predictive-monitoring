CREATE TABLE alerta_anomalia (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    sensor_id UUID NOT NULL,
    equipamento_id UUID,

    log_medida_id UUID NOT NULL,
    log_medida_dt_medida TIMESTAMPTZ NOT NULL,

    sensor_baseline_id UUID,

    medida DOUBLE PRECISION NOT NULL,

    media_referencia DOUBLE PRECISION,
    desvio_padrao_referencia DOUBLE PRECISION,
    limite_min_referencia DOUBLE PRECISION,
    limite_max_referencia DOUBLE PRECISION,

    score_desvio DOUBLE PRECISION,

    tipo_anomalia VARCHAR(50) NOT NULL,
    severidade VARCHAR(30) NOT NULL,

    status_alerta VARCHAR(30) NOT NULL DEFAULT 'ABERTO',

    descricao TEXT,

    dt_ocorrencia TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    dt_reconhecimento TIMESTAMPTZ,
    dt_resolucao TIMESTAMPTZ,
    dt_inclusao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    dt_alteracao TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_alerta_anomalia_sensor FOREIGN KEY (sensor_id)
        REFERENCES sensor (id),

    CONSTRAINT fk_alerta_anomalia_equipamento FOREIGN KEY (equipamento_id)
        REFERENCES equipamento (id),

    CONSTRAINT fk_alerta_anomalia_baseline FOREIGN KEY (sensor_baseline_id)
        REFERENCES sensor_baseline (id),

    CONSTRAINT ck_alerta_anomalia_tipo
        CHECK (
            tipo_anomalia IN (
                'ACIMA_DO_PADRAO',
                'ABAIXO_DO_PADRAO',
                'DESVIO_EXTREMO',
                'TENDENCIA_ALTA',
                'TENDENCIA_BAIXA',
                'OSCILACAO',
                'SEM_BASELINE'
            )
        ),

    CONSTRAINT ck_alerta_anomalia_severidade
        CHECK (
            severidade IN (
                'BAIXA',
                'MEDIA',
                'ALTA',
                'CRITICA'
            )
        ),

    CONSTRAINT ck_alerta_anomalia_status
        CHECK (
            status_alerta IN (
                'ABERTO',
                'RECONHECIDO',
                'RESOLVIDO',
                'IGNORADO'
            )
        ),

    CONSTRAINT ck_alerta_anomalia_score_desvio
        CHECK (score_desvio IS NULL OR score_desvio >= 0),

    CONSTRAINT ck_alerta_anomalia_periodo_status
        CHECK (
            dt_resolucao IS NULL
            OR dt_resolucao >= dt_ocorrencia
        )
);

CREATE INDEX idx_alerta_anomalia_sensor_data
ON alerta_anomalia(sensor_id, dt_ocorrencia DESC);

CREATE INDEX idx_alerta_anomalia_equipamento_data
ON alerta_anomalia(equipamento_id, dt_ocorrencia DESC);

CREATE INDEX idx_alerta_anomalia_severidade
ON alerta_anomalia(severidade);

CREATE INDEX idx_alerta_anomalia_status
ON alerta_anomalia(status_alerta);

CREATE INDEX idx_alerta_anomalia_baseline
ON alerta_anomalia(sensor_baseline_id);

CREATE INDEX idx_alerta_anomalia_log_medida
ON alerta_anomalia(log_medida_id, log_medida_dt_medida);