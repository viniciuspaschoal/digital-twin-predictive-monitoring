package com.unisal.predictdt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
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
@Table(name = "modelo_3d_equipamento_vinculo")
public class Modelo3DEquipamentoVinculo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    /*
     * Modelo 3D ao qual este vínculo pertence.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modelo_3d_id", nullable = false)
    private Modelo3D modelo3D;

    /*
     * Nome original do objeto/grupo no GLB.
     *
     * Exemplo:
     * EQP_BOMBA_01
     */
    @Column(name = "object_name", nullable = false, length = 255)
    private String objectName;

    /*
     * Nome normalizado para comparação e constraint única.
     *
     * Exemplo:
     * eqp_bomba_01, EQP_BOMBA_01 e " EQP_BOMBA_01 "
     * devem ser tratados como o mesmo objeto.
     */
    @Column(name = "object_name_normalized", nullable = false, length = 255)
    private String objectNameNormalized;

    /*
     * Equipamento real do sistema vinculado ao objeto 3D.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipamento_id", nullable = false)
    private Equipamento equipamento;

    @Column(name = "dt_inclusao", nullable = false)
    private OffsetDateTime dtInclusao;

    @Column(name = "dt_alteracao", nullable = false)
    private OffsetDateTime dtAlteracao;

    @PrePersist
    public void prePersist() {
        OffsetDateTime agora = OffsetDateTime.now();

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