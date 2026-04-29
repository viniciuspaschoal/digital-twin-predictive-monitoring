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