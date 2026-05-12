package com.unisal.predictdt.dto.alertaExplicacao;

import java.util.List;
import java.util.UUID;

public record AlertaExplicacaoResponseDTO(
        UUID alertaId,
        String titulo,
        String resumo,
        List<String> possiveisCausas,
        String riscoOperacional,
        String recomendacaoInicial,
        String observacao
) {
}