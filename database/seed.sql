INSERT INTO topico_mqtt (descricao)
VALUES ('unisal/projeto');

INSERT INTO equipamento (descricao)
VALUES ('bomba_01');

INSERT INTO sensor (descricao, unidade_medida, topico_id, topico_auxiliar)
VALUES ('dht11_temperatura', 'ºC', (SELECT id FROM topico_mqtt WHERE descricao = 'unisal/projeto'), '/bomba_01/telemetria/clima_interno');

INSERT INTO sensor (descricao, unidade_medida, topico_id, topico_auxiliar)
VALUES ('dht11_umidade', '%', (SELECT id FROM topico_mqtt WHERE descricao = 'unisal/projeto'), '/bomba_01/telemetria/clima_interno');

INSERT INTO sensor (descricao, unidade_medida, topico_id, topico_auxiliar)
VALUES ('waterflux_vazao', 'L/s', (SELECT id FROM topico_mqtt WHERE descricao = 'unisal/projeto'), '/bomba_01/telemetria/vazao');

INSERT INTO sensor_equipamento (sensor_id, equipamento_id)
VALUES ((SELECT id FROM sensor WHERE descricao = 'dht11_temperatura'), (SELECT id FROM equipamento WHERE descricao = 'bomba_01'));

INSERT INTO sensor_equipamento (sensor_id, equipamento_id)
VALUES ((SELECT id FROM sensor WHERE descricao = 'dht11_umidade'), (SELECT id FROM equipamento WHERE descricao = 'bomba_01'));

INSERT INTO sensor_equipamento (sensor_id, equipamento_id)
VALUES ((SELECT id FROM sensor WHERE descricao = 'waterflux_vazao'), (SELECT id FROM equipamento WHERE descricao = 'bomba_01'));