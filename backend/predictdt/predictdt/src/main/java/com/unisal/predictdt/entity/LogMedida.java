package com.unisal.predictdt.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

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
    @JoinColumn(name = "sensor_id", nullable = false)
    private Sensor sensor;

    @Column(name = "medida", nullable = false)
    private Double medida;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = new LogMedidaId();
        }

        if (this.id.getId() == null) {
            this.id.setId(UUID.randomUUID());
        }

        if (this.id.getDtMedida() == null) {
            this.id.setDtMedida(OffsetDateTime.now());
        }
    }


}