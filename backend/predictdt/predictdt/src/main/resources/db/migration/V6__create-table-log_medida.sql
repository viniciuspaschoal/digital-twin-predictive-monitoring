CREATE TABLE log_medida (
    dt_medida TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    sensor_id UUID             NOT NULL,
    medida    DOUBLE PRECISION NOT NULL,
    CONSTRAINT fk_sensor_log FOREIGN KEY (sensor_id)
        REFERENCES sensor (id)
);