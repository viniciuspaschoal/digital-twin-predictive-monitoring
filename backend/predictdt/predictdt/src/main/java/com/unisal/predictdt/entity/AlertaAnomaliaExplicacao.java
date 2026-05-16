package com.unisal.predictdt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
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
@Table(name = "alerta_anomalia_explicacao")
public class AlertaAnomaliaExplicacao {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    /*
     * Alerta que originou esta explicação.
     *
     * A tabela possui restrição única para alerta_anomalia_id,
     * garantindo no máximo uma explicação persistida por alerta.
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alerta_anomalia_id", nullable = false)
    private AlertaAnomalia alertaAnomalia;

    /*
     * Título resumido da explicação.
     *
     * Exemplo:
     * "Anomalia de corrente detectada - Severidade ALTA"
     */
    @Column(name = "titulo", columnDefinition = "TEXT")
    private String titulo;

    /*
     * Resumo técnico gerado pelo backend antes da humanização.
     */
    @Column(name = "resumo", columnDefinition = "TEXT")
    private String resumo;

    /*
     * Possíveis causas em formato textual.
     *
     * Neste momento será salvo como texto simples, por exemplo:
     * "- Possível sobrecarga elétrica\n- Esforço mecânico elevado"
     *
     * Futuramente pode evoluir para JSONB, se necessário.
     */
    @Column(name = "possiveis_causas", columnDefinition = "TEXT")
    private String possiveisCausas;

    /*
     * Interpretação do risco operacional calculado.
     */
    @Column(name = "risco_operacional", columnDefinition = "TEXT")
    private String riscoOperacional;

    /*
     * Recomendação inicial para o operador/manutenção.
     */
    @Column(name = "recomendacao_inicial", columnDefinition = "TEXT")
    private String recomendacaoInicial;

    /*
     * Texto humanizado gerado pela IA generativa ou pelo fallback local.
     */
    @Column(name = "explicacao_ia", nullable = false, columnDefinition = "TEXT")
    private String explicacaoIa;

    /*
     * Observação sobre a origem da explicação ou fallback utilizado.
     */
    @Column(name = "observacao", columnDefinition = "TEXT")
    private String observacao;

    /*
     * Origem da explicação.
     *
     * Valores aceitos pelo banco:
     * - GEMINI
     * - LOCAL
     */
    @Column(name = "origem", nullable = false, length = 30)
    private String origem;

    @Column(name = "dt_geracao", nullable = false)
    private OffsetDateTime dtGeracao;

    @PrePersist
    public void prePersist() {
        if (this.origem == null || this.origem.isBlank()) {
            this.origem = "LOCAL";
        }

        if (this.dtGeracao == null) {
            this.dtGeracao = OffsetDateTime.now();
        }
    }
}