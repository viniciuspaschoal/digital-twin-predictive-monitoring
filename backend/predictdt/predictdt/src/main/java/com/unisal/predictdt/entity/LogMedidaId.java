package com.unisal.predictdt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.UUID;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class LogMedidaId implements Serializable {

    private static final long serialVersionUID = 1L;

    @Column(name = "dt_medida", nullable = false)
    private OffsetDateTime dtMedida;

    @Column(name = "id", nullable = false)
    private UUID id;
}