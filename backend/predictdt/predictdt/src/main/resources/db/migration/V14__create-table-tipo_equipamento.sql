CREATE TABLE tipo_equipamento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    descricao VARCHAR(100) NOT NULL UNIQUE,

    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    dt_inclusao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    dt_alteracao TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO tipo_equipamento (descricao)
VALUES
    ('BOMBA'),
    ('MOTOR'),
    ('MOTOBOMBA'),
    ('COMPRESSOR'),
    ('TORNO'),
    ('ESTEIRA'),
    ('PAINEL_ELETRICO'),
    ('GENERIC0');