package com.unisal.predictdt.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "topico_mqtt")
public class TopicoMqtt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false)
    private UUID id;

    @Column(name = "descricao", nullable = false, length = 100)
    private String descricao;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo;

    @Generated(event = EventType.INSERT)
    @Column(name = "dt_inclusao", nullable = false, insertable = false, updatable = false)
    private LocalDateTime dtInclusao;

    @Column(name = "dt_bloqueio")
    private LocalDateTime dtBloqueio;

    @Column(name = "dt_alteracao", nullable = false, insertable = false)
    private LocalDateTime dtAlteracao;
}
