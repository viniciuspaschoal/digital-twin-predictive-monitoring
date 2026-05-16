CREATE TABLE grandeza_medida (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    descricao VARCHAR(100) NOT NULL UNIQUE,
    unidade_padrao VARCHAR(30),

    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    dt_inclusao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    dt_alteracao TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO grandeza_medida (descricao, unidade_padrao)
VALUES
    ('CORRENTE', 'A'),
    ('TENSAO', 'V'),
    ('TEMPERATURA', '°C'),
    ('VIBRACAO', 'mm/s'),
    ('PRESSAO', 'bar'),
    ('VAZAO', 'L/min'),
    ('RPM', 'rpm'),
    ('UMIDADE', '%'),
    ('ESTADO_DIGITAL', NULL);