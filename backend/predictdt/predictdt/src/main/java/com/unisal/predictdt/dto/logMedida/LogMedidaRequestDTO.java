package com.unisal.predictdt.dto.logMedida;


import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record LogMedidaRequestDTO(
        @NotNull UUID sensorId,
        @NotNull Double medida
) {}
