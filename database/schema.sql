CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS timescaledb;

ALTER DATABASE digital_twin SET timezone TO 'America/Sao_Paulo';

CREATE TABLE topico_mqtt (
    id           UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    descricao    VARCHAR(100) NOT NULL,
    ativo        BOOLEAN      NOT NULL DEFAULT TRUE,
    dt_inclusao  TIMESTAMP    NOT NULL DEFAULT NOW(),
    dt_bloqueio  TIMESTAMP,
    dt_alteracao TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE equipamento (
    id           UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    descricao    VARCHAR(100) NOT NULL,
    ativo        BOOLEAN      NOT NULL DEFAULT TRUE,
    dt_inclusao  TIMESTAMP    NOT NULL DEFAULT NOW(),
    dt_bloqueio  TIMESTAMP,
    dt_alteracao TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE sensor (
    id              UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    descricao       VARCHAR(100) NOT NULL,
    unidade_medida  VARCHAR(30),
    ativo           BOOLEAN      NOT NULL DEFAULT TRUE,
    topico_id       UUID,
    topico_auxiliar VARCHAR(100),
    dt_inclusao     TIMESTAMP    NOT NULL DEFAULT NOW(),
    dt_bloqueio     TIMESTAMP,
    dt_alteracao    TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_topico_sensor FOREIGN KEY (topico_id)
        REFERENCES topico_mqtt (id)
);

CREATE TABLE sensor_equipamento (
    id             UUID      DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_id      UUID      NOT NULL,
    equipamento_id UUID      NOT NULL,
    dt_inclusao    TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_sensor FOREIGN KEY (sensor_id)
        REFERENCES sensor (id),
    CONSTRAINT fk_equipamento FOREIGN KEY (equipamento_id)
        REFERENCES equipamento (id)
);

CREATE TABLE log_medida (
    dt_medida TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    sensor_id UUID             NOT NULL,
    medida    DOUBLE PRECISION NOT NULL,
    CONSTRAINT fk_sensor_log FOREIGN KEY (sensor_id)
        REFERENCES sensor (id)
);