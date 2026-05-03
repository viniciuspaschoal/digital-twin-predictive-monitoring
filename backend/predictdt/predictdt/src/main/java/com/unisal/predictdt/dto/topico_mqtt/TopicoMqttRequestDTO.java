package com.unisal.predictdt.dto.topico_mqtt;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TopicoMqttRequestDTO(
        @NotBlank(message = "O campo descrição deve estar preenchido")
        @Size(max = 100, message = "A descrição deve ter no máximo 100 caracteres")
        String descricao,
        Boolean ativo
) {
}