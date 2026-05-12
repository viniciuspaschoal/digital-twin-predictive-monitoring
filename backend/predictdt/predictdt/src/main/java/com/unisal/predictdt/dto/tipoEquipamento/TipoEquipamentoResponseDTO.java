package com.unisal.predictdt.dto.tipoEquipamento;

import java.util.UUID;

public record TipoEquipamentoResponseDTO(
        UUID id,
        String descricao,
        Boolean ativo
) {
}