package com.unisal.predictdt.dto.logMedida;

import java.time.OffsetDateTime;
import java.util.UUID;

public record LogMedidaResponseDTO(
        OffsetDateTime dtMedida,
        UUID id,
        Double medida,
        String descricaoSensor
) {}
