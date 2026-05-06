package com.unisal.predictdt.dto.sensor;

import java.time.LocalDateTime;
import java.util.UUID;

public record SensorResponseDTO(
        UUID id,
        String descricao,
        String unidadeMedida,
        Boolean ativo,
        String topicoCompleto, // Vamos montar isso no Mapper (Prefixo + Auxiliar)
        LocalDateTime dtInclusao,
        LocalDateTime dtBloqueio
) {}
