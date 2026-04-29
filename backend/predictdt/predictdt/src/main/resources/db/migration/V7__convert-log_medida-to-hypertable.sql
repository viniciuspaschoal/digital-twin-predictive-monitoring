SELECT create_hypertable('log_medida'::regclass, 'dt_medida'::name);

CREATE INDEX ON log_medida (sensor_id, dt_medida DESC);
