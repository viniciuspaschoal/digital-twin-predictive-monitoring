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