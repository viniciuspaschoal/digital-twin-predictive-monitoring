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

        /*
         * Texto humanizado gerado pela IA generativa.
         *
         * Quando a API externa falhar, este campo recebe uma explicação local
         * baseada nas regras internas do sistema.
         */
        String explicacaoIa,

        String observacao
) {
}