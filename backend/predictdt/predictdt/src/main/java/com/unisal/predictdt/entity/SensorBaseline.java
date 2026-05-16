package com.unisal.predictdt.entity;

import com.unisal.predictdt.entity.enums.MetodoBaseline;
import com.unisal.predictdt.entity.enums.StatusBaseline;
import com.unisal.predictdt.entity.enums.TipoJanelaBaseline;
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
@Table(name = "sensor_baseline")
public class SensorBaseline {

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sensor_id", nullable = false)
    private Sensor sensor;

    @Column(name = "media", nullable = false)
    private Double media;

    @Column(name = "desvio_padrao", nullable = false)
    private Double desvioPadrao;

    @Column(name = "limite_min", nullable = false)
    private Double limiteMin;

    @Column(name = "limite_max", nullable = false)
    private Double limiteMax;

    @Column(name = "valor_minimo_observado")
    private Double valorMinimoObservado;

    @Column(name = "valor_maximo_observado")
    private Double valorMaximoObservado;

    @Column(name = "fator_desvio", nullable = false)
    private Double fatorDesvio;

    @Column(name = "janela_inicio", nullable = false)
    private OffsetDateTime janelaInicio;

    @Column(name = "janela_fim", nullable = false)
    private OffsetDateTime janelaFim;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_janela", nullable = false)
    private TipoJanelaBaseline tipoJanela;

    @Column(name = "qtd_amostras", nullable = false)
    private Integer qtdAmostras;

    @Enumerated(EnumType.STRING)
    @Column(name = "metodo", nullable = false)
    private MetodoBaseline metodo;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StatusBaseline status;

    @Column(name = "confianca")
    private Double confianca;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo;

    @Column(name = "motivo_status")
    private String motivoStatus;

    @Column(name = "dt_calculo", nullable = false)
    private OffsetDateTime dtCalculo;

    @PrePersist
    public void prePersist() {
        if (this.fatorDesvio == null) {
            this.fatorDesvio = 2.0;
        }

        if (this.metodo == null) {
            this.metodo = MetodoBaseline.MEDIA_DESVIO_PADRAO;
        }

        if (this.status == null) {
            this.status = StatusBaseline.CANDIDATO;
        }

        if (this.ativo == null) {
            this.ativo = false;
        }

        if (this.dtCalculo == null) {
            this.dtCalculo = OffsetDateTime.now();
        }
    }
}
