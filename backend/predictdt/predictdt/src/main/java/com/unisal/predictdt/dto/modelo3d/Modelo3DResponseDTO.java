package com.unisal.predictdt.dto.modelo3d;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public record Modelo3DResponseDTO(

        /*
         * ID do modelo 3D salvo no backend.
         */
        UUID id,

        /*
         * Nome original do arquivo enviado pelo usuário.
         */
        String fileName,

        /*
         * URL usada pelo frontend para carregar o arquivo GLB.
         *
         * Exemplo:
         * http://localhost:8080/modelos-3d/{id}/arquivo
         */
        String url,

        /*
         * Configuração da câmera salva para o dashboard.
         */
        CameraViewDTO cameraView,

        /*
         * Mapa de vínculos entre objetos do GLB e equipamentos reais.
         *
         * Exemplo:
         * {
         *   "EQP_BOMBA_01": "id-da-bomba-1",
         *   "EQP_BOMBA_02": "id-da-bomba-2"
         * }
         */
        Map<String, UUID> equipmentMap,

        /*
         * Indica se este é o modelo ativo do dashboard.
         */
        Boolean ativo,

        OffsetDateTime dtInclusao,
        OffsetDateTime dtAlteracao
) {
}