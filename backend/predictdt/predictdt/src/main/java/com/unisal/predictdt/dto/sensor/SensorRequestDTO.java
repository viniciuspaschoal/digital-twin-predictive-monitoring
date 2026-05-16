package com.unisal.predictdt.dto.sensor;

import java.util.UUID;

public record SensorRequestDTO(
        String descricao,
        String unidadeMedida,
        UUID topicoId,      // Vínculo com a tabela topico_mqtt
        String topicoAuxiliar,

        /*
         * Grandeza física monitorada pelo sensor.
         *
         * Exemplo:
         * - CORRENTE
         * - PRESSAO
         * - TEMPERATURA
         * - VIBRACAO
         * - VAZAO
         * - RPM
         *
         * Esse campo vem do dropdown carregado pelo endpoint GET /grandezas-medida.
         * A unidadeMedida continua sendo digitada pelo usuário, pois a mesma grandeza
         * pode ser usada com unidades diferentes dependendo do sensor ou cliente.
         */
        UUID grandezaMedidaId
) {
}