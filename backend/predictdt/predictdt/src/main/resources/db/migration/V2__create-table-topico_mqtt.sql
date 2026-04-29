CREATE TABLE topico_mqtt (
    id           UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    descricao    VARCHAR(100) NOT NULL,
    ativo        BOOLEAN      NOT NULL DEFAULT TRUE,
    dt_inclusao  TIMESTAMP    NOT NULL DEFAULT NOW(),
    dt_bloqueio  TIMESTAMP,
    dt_alteracao TIMESTAMP    NOT NULL DEFAULT NOW()
);