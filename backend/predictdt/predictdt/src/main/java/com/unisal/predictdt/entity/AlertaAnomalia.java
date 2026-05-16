package com.unisal.predictdt.entity;

import com.unisal.predictdt.entity.enums.SeveridadeAlerta;
import com.unisal.predictdt.entity.enums.StatusAlerta;
import com.unisal.predictdt.entity.enums.TipoAnomalia;
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
@Table(name = "alerta_anomalia")
public class AlertaAnomalia {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sensor_id", nullable = false)
    private Sensor sensor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipamento_id")
    private Equipamento equipamento;

    @Column(name = "log_medida_id", nullable = false)
    private UUID logMedidaId;

    @Column(name = "log_medida_dt_medida", nullable = false)
    private OffsetDateTime logMedidaDtMedida;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sensor_baseline_id")
    private SensorBaseline sensorBaseline;

    @Column(name = "medida", nullable = false)
    private Double medida;

    @Column(name = "media_referencia")
    private Double mediaReferencia;

    @Column(name = "desvio_padrao_referencia")
    private Double desvioPadraoReferencia;

    @Column(name = "limite_min_referencia")
    private Double limiteMinReferencia;

    @Column(name = "limite_max_referencia")
    private Double limiteMaxReferencia;

    @Column(name = "score_desvio")
    private Double scoreDesvio;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_anomalia", nullable = false)
    private TipoAnomalia tipoAnomalia;

    @Enumerated(EnumType.STRING)
    @Column(name = "severidade", nullable = false)
    private SeveridadeAlerta severidade;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_alerta", nullable = false)
    private StatusAlerta statusAlerta;

    @Column(name = "descricao", columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "dt_ocorrencia", nullable = false)
    private OffsetDateTime dtOcorrencia;

    @Column(name = "dt_reconhecimento")
    private OffsetDateTime dtReconhecimento;

    @Column(name = "dt_resolucao")
    private OffsetDateTime dtResolucao;

    @Column(name = "dt_inclusao", nullable = false)
    private OffsetDateTime dtInclusao;

    @Column(name = "dt_alteracao", nullable = false)
    private OffsetDateTime dtAlteracao;

    @PrePersist
    public void prePersist() {
        OffsetDateTime agora = OffsetDateTime.now();

        if (this.statusAlerta == null) {
            this.statusAlerta = StatusAlerta.ABERTO;
        }

        if (this.dtOcorrencia == null) {
            this.dtOcorrencia = agora;
        }

        if (this.dtInclusao == null) {
            this.dtInclusao = agora;
        }

        if (this.dtAlteracao == null) {
            this.dtAlteracao = agora;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.dtAlteracao = OffsetDateTime.now();
    }
}