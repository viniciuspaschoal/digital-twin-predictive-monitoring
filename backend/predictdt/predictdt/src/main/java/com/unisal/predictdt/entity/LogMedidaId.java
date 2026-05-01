package com.unisal.predictdt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.UUID;

@Embeddable
@Getter
@Setter
@EqualsAndHashCode
public class LogMedidaId implements Serializable {

    @Column(name = "dt_medida")
    private OffsetDateTime dtMedida;

    @Column(name = "sensor_id")
    private UUID sensorId;
}