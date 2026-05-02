package com.unisal.predictdt.dto.topico_mqtt;

import java.time.LocalDateTime;
import java.util.UUID;

public record TopicoMqttResponseDTO(
        UUID id,
        String descricao,
        Boolean ativo,
        LocalDateTime dtInclusao
) {}