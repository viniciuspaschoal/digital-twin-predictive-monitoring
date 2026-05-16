ALTER TABLE sensor
ADD COLUMN grandeza_medida_id UUID;

ALTER TABLE sensor
ADD CONSTRAINT fk_sensor_grandeza_medida
FOREIGN KEY (grandeza_medida_id)
REFERENCES grandeza_medida (id);

CREATE INDEX idx_sensor_grandeza_medida
ON sensor(grandeza_medida_id);