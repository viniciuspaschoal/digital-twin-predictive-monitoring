ALTER TABLE log_medida SET (
    timescaledb.compress,
    timescaledb.compress_orderby   = 'dt_medida DESC',
    timescaledb.compress_segmentby = 'sensor_id'
);

SELECT add_compression_policy('log_medida'::regclass, INTERVAL '7 days');