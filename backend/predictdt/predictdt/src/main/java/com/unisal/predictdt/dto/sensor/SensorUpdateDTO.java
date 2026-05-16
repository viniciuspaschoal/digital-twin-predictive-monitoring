package com.unisal.predictdt.dto.sensor;

import java.util.UUID;

public record SensorUpdateDTO(
        String descricao,
        String unidadeMedida,
        String topicoAuxiliar,
        Boolean ativo,

        /*
         * Permite alterar a grandeza física associada ao sensor.
         *
         * Exemplo:
         * trocar um sensor genérico para PRESSAO, CORRENTE,
         * TEMPERATURA, VIBRACAO etc.
         */
        UUID grandezaMedidaId
) {
}