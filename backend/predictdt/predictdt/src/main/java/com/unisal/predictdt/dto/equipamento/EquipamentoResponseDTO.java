package com.unisal.predictdt.dto.equipamento;

import java.time.LocalDateTime;
import java.util.UUID;

public record EquipamentoResponseDTO (
        UUID id,
        String descricao,
        Boolean ativo,
        LocalDateTime dtInclusao
){
}
