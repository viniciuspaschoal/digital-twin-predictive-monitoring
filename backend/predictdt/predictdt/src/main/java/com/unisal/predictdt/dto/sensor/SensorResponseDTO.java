package com.unisal.predictdt.dto.sensor;

import java.time.LocalDateTime;
import java.util.UUID;

public record SensorResponseDTO(
        UUID id,
        String descricao,
        String unidadeMedida,
        Boolean ativo,
        String topicoCompleto,

        /*
         * Dados estruturados da grandeza física associada ao sensor.
         *
         * Esses campos permitem que o frontend exiba o contexto técnico
         * e que a IA saiba o significado da medição.
         */
        UUID grandezaMedidaId,
        String grandezaMedidaDescricao,
        String grandezaMedidaUnidadePadrao,

        LocalDateTime dtInclusao,
        LocalDateTime dtBloqueio
) {
}