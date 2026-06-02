package com.unisal.predictdt.mapper;

import com.unisal.predictdt.dto.modelo3d.CameraViewDTO;
import com.unisal.predictdt.dto.modelo3d.Modelo3DResponseDTO;
import com.unisal.predictdt.entity.Modelo3D;
import com.unisal.predictdt.entity.Modelo3DEquipamentoVinculo;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

public class Modelo3DMapper {

    /*
     * Converte a entity Modelo3D para o DTO retornado ao frontend.
     *
     * Também monta:
     * - URL para download/carregamento do arquivo GLB;
     * - configuração de câmera;
     * - mapa objectName -> equipamentoId.
     */
    public static Modelo3DResponseDTO toResponse(Modelo3D entity) {
        if (entity == null) {
            return null;
        }

        return new Modelo3DResponseDTO(
                entity.getId(),
                entity.getNomeOriginalArquivo(),
                montarUrlArquivo(entity.getId()),
                montarCameraView(entity),
                montarEquipmentMap(entity.getVinculos()),
                entity.getAtivo(),
                entity.getDtInclusao(),
                entity.getDtAlteracao()
        );
    }

    /*
     * Monta a URL que o frontend usará para carregar o arquivo GLB.
     *
     * Exemplo:
     * /modelos-3d/{modeloId}/arquivo
     */
    private static String montarUrlArquivo(UUID modeloId) {
        return "/modelos-3d/" + modeloId + "/arquivo";
    }

    /*
     * Monta o DTO da câmera somente se todos os valores estiverem preenchidos.
     *
     * Se o usuário ainda não salvou a câmera, retorna null.
     */
    private static CameraViewDTO montarCameraView(Modelo3D entity) {
        boolean cameraIncompleta =
                entity.getCameraPositionX() == null ||
                        entity.getCameraPositionY() == null ||
                        entity.getCameraPositionZ() == null ||
                        entity.getCameraTargetX() == null ||
                        entity.getCameraTargetY() == null ||
                        entity.getCameraTargetZ() == null;

        if (cameraIncompleta) {
            return null;
        }

        return new CameraViewDTO(
                List.of(
                        entity.getCameraPositionX(),
                        entity.getCameraPositionY(),
                        entity.getCameraPositionZ()
                ),
                List.of(
                        entity.getCameraTargetX(),
                        entity.getCameraTargetY(),
                        entity.getCameraTargetZ()
                )
        );
    }

    /*
     * Monta o mapa de vínculos esperado pelo frontend.
     *
     * Exemplo:
     * {
     *   "EQP_BOMBA_01": "uuid-do-equipamento"
     * }
     */
    private static Map<String, UUID> montarEquipmentMap(List<Modelo3DEquipamentoVinculo> vinculos) {
        if (vinculos == null || vinculos.isEmpty()) {
            return Map.of();
        }

        return vinculos.stream()
                .collect(Collectors.toMap(
                        Modelo3DEquipamentoVinculo::getObjectName,
                        vinculo -> vinculo.getEquipamento().getId()
                ));
    }
}