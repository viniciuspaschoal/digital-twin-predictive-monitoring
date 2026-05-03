package com.unisal.predictdt.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "log_medida")
public class LogMedida {

    @EmbeddedId
    private LogMedidaId id;

    @ManyToOne
    @JoinColumn(name = "sensor_id", nullable = false, insertable = false, updatable = false)
    private Sensor sensor;

    @Column(name = "medida", nullable = false)
    private Double medida;
}