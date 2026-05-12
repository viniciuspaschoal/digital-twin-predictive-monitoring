package com.unisal.predictdt.dto.grandezaMedida;

import java.util.UUID;

public record GrandezaMedidaResponseDTO(
        UUID id,
        String descricao,
        String unidadePadrao,
        Boolean ativo
) {
}