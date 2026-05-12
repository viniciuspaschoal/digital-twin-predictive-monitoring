package com.unisal.predictdt.dto.alertaAnomalia;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AlertaAnomaliaResponseDTO(
        UUID id,

        UUID sensorId,
        String descricaoSensor,

        UUID equipamentoId,
        String descricaoEquipamento,

        Double medida,

        Double mediaReferencia,
        Double desvioPadraoReferencia,
        Double limiteMinReferencia,
        Double limiteMaxReferencia,
        Double scoreDesvio,

        String tipoAnomalia,
        String severidade,
        String statusAlerta,

        String descricao,

        OffsetDateTime dtOcorrencia,
        OffsetDateTime dtReconhecimento,
        OffsetDateTime dtResolucao
) {
}