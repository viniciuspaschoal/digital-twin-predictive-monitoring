package com.unisal.predictdt.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "modelo_3d")
public class Modelo3D {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    /*
     * Nome original do arquivo enviado pelo usuário.
     *
     * Esse nome é mantido apenas para exibição no frontend.
     * O arquivo salvo em disco utiliza um nome gerado pelo backend.
     */
    @Column(name = "nome_original_arquivo", nullable = false, length = 255)
    private String nomeOriginalArquivo;

    /*
     * Caminho físico onde o arquivo GLB foi salvo no servidor.
     *
     * Exemplo:
     * storage/modelos-3d/uuid.glb
     */
    @Column(name = "storage_path", nullable = false, columnDefinition = "TEXT")
    private String storagePath;

    /*
     * Tipo do arquivo.
     *
     * Para GLB normalmente:
     * model/gltf-binary
     */
    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    /*
     * Tamanho do arquivo em bytes.
     */
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    /*
     * Indica se este é o modelo 3D ativo atualmente no dashboard.
     *
     * A migration possui uma constraint para permitir apenas um modelo ativo.
     */
    @Column(name = "ativo", nullable = false)
    private Boolean ativo;

    /*
     * Posição da câmera salva pelo usuário.
     */
    @Column(name = "camera_position_x")
    private Double cameraPositionX;

    @Column(name = "camera_position_y")
    private Double cameraPositionY;

    @Column(name = "camera_position_z")
    private Double cameraPositionZ;

    /*
     * Ponto para onde a câmera está olhando.
     */
    @Column(name = "camera_target_x")
    private Double cameraTargetX;

    @Column(name = "camera_target_y")
    private Double cameraTargetY;

    @Column(name = "camera_target_z")
    private Double cameraTargetZ;

    @Column(name = "dt_inclusao", nullable = false)
    private OffsetDateTime dtInclusao;

    @Column(name = "dt_alteracao", nullable = false)
    private OffsetDateTime dtAlteracao;

    /*
     * Vínculos entre objetos do GLB e equipamentos reais.
     *
     * Exemplo:
     * EQP_BOMBA_01 -> bombalinha01
     */
    @OneToMany(
            mappedBy = "modelo3D",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    private List<Modelo3DEquipamentoVinculo> vinculos = new ArrayList<>();

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