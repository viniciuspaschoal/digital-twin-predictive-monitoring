package com.unisal.predictdt.domain.topico_mqtt;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
    @GeneratedValue
    @Column(name = "id", updatable = false)
    private UUID id;

    @Column(name = "descricao", nullable = false, length = 100)
    private String descricao;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo;

    @Column(name = "dt_inclusao", nullable = false)
    private LocalDateTime dtInclusao;

    @Column(name = "dt_bloqueio")
    private LocalDateTime dtBloqueio;

    @Column(name = "dt_alteracao", nullable = false)
    private LocalDateTime dtAlteracao;
}
