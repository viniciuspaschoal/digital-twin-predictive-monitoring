CREATE TABLE alerta_anomalia_explicacao (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    alerta_anomalia_id UUID NOT NULL,

    titulo TEXT,
    resumo TEXT,
    possiveis_causas TEXT,
    risco_operacional TEXT,
    recomendacao_inicial TEXT,
    explicacao_ia TEXT NOT NULL,
    observacao TEXT,

    origem VARCHAR(30) NOT NULL DEFAULT 'LOCAL',

    dt_geracao TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_alerta_anomalia_explicacao_alerta
        FOREIGN KEY (alerta_anomalia_id)
        REFERENCES alerta_anomalia (id),

    CONSTRAINT ck_alerta_anomalia_explicacao_origem
        CHECK (origem IN ('GEMINI', 'LOCAL'))
);

CREATE UNIQUE INDEX uq_alerta_anomalia_explicacao_alerta
ON alerta_anomalia_explicacao(alerta_anomalia_id);

CREATE INDEX idx_alerta_anomalia_explicacao_origem
ON alerta_anomalia_explicacao(origem);

CREATE INDEX idx_alerta_anomalia_explicacao_dt_geracao
ON alerta_anomalia_explicacao(dt_geracao DESC);