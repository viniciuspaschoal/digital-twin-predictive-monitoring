package com.unisal.predictdt.dto.modelo3d;

import jakarta.validation.constraints.NotNull;

import java.util.Map;
import java.util.UUID;

public record Modelo3DEquipmentMapRequestDTO(

        /*
         * Mapa completo de vínculos entre objetos do GLB e equipamentos reais.
         *
         * Exemplo:
         * {
         *   "EQP_BOMBA_01": "id-da-bomba-1",
         *   "EQP_BOMBA_02": "id-da-bomba-2"
         * }
         */
        @NotNull(message = "O mapa de vínculos deve ser informado")
        Map<String, UUID> equipmentMap
) {
}