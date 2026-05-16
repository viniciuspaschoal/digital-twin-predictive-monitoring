package com.unisal.predictdt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
@Table(name = "tipo_equipamento")
public class TipoEquipamento {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "descricao", nullable = false, unique = true, length = 100)
    private String descricao;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo;

    @Column(name = "dt_inclusao", nullable = false)
    private OffsetDateTime dtInclusao;

    @Column(name = "dt_alteracao", nullable = false)
    private OffsetDateTime dtAlteracao;

    @PrePersist
    public void prePersist() {
        OffsetDateTime agora = OffsetDateTime.now();

        if (this.ativo == null) {
            this.ativo = true;
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