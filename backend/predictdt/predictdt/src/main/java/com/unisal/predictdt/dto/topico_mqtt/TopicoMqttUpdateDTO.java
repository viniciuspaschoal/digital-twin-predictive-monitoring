package com.unisal.predictdt.dto.topico_mqtt;

import jakarta.validation.constraints.Size;

public record TopicoMqttUpdateDTO(
        @Size(max = 100, message = "A descrição deve ter no máximo 100 caracteres")
        String descricao,
        Boolean ativo
) {
}
