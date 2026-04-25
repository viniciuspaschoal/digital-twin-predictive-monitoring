SELECT create_hypertable('log_medida'::regclass, 'dt_medida'::name);

CREATE INDEX ON log_medida (sensor_id, dt_medida DESC);

ALTER TABLE log_medida SET (
    timescaledb.compress,
    timescaledb.compress_orderby   = 'dt_medida DESC',
    timescaledb.compress_segmentby = 'sensor_id'
);

SELECT add_compression_policy('log_medida'::regclass, INTERVAL '7 days');

-- SELECT add_retention_policy('log_medida'::regclass, INTERVAL '1 year'); (Definir período para retenção)