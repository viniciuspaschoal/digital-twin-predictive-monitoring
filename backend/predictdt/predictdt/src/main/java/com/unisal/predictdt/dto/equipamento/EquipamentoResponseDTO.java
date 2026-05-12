package com.unisal.predictdt.dto.equipamento;

import java.time.LocalDateTime;
import java.util.UUID;

public record EquipamentoResponseDTO(
        UUID id,
        String descricao,
        Boolean ativo,

        /*
         * Contexto operacional do equipamento.
         *
         * Esses campos permitem que o frontend saiba qual tipo técnico
         * está associado ao equipamento, como BOMBA, MOTOR, TORNO etc.
         */
        UUID tipoEquipamentoId,
        String tipoEquipamentoDescricao,

        LocalDateTime dtInclusao
) {
}