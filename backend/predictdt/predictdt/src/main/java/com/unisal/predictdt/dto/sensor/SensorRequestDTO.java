package com.unisal.predictdt.dto.sensor;

import java.util.UUID;

public record SensorRequestDTO(
        String descricao,
        String unidadeMedida,
        UUID topicoId,      // Vinculo com a tabela topico_mqtt
        String topicoAuxiliar
) {}
