package com.unisal.predictdt.repository;

import com.unisal.predictdt.entity.Modelo3DEquipamentoVinculo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface Modelo3DEquipamentoVinculoRepository extends JpaRepository<Modelo3DEquipamentoVinculo, UUID> {

    /*
     * Lista todos os vínculos de um modelo 3D.
     *
     * Usado para montar o equipmentMap enviado ao frontend.
     */
    List<Modelo3DEquipamentoVinculo> findByModelo3D_Id(UUID modelo3DId);

    /*
     * Busca um vínculo específico pelo modelo e pelo nome normalizado do objeto 3D.
     *
     * Exemplo:
     * modelo_id + EQP_BOMBA_01
     */
    Optional<Modelo3DEquipamentoVinculo> findByModelo3D_IdAndObjectNameNormalized(
            UUID modelo3DId,
            String objectNameNormalized
    );

    /*
     * Remove um vínculo específico entre objeto 3D e equipamento.
     */
    void deleteByModelo3D_IdAndObjectNameNormalized(
            UUID modelo3DId,
            String objectNameNormalized
    );

    /*
     * Remove todos os vínculos de um modelo 3D.
     *
     * Útil quando o frontend envia um mapa completo e queremos substituir tudo.
     */
    void deleteByModelo3D_Id(UUID modelo3DId);

    /*
     * Verifica se um equipamento já está vinculado a algum objeto dentro do mesmo modelo.
     *
     * Podemos usar isso para impedir que o mesmo equipamento real seja vinculado
     * a dois objetos 3D diferentes, caso essa regra faça sentido.
     */
    boolean existsByModelo3D_IdAndEquipamento_Id(
            UUID modelo3DId,
            UUID equipamentoId
    );
}