package com.unisal.predictdt.dto.alertaContexto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record AlertaContextoResponseDTO(
        UUID alertaId,
        SensorContextoDTO sensor,
        List<EquipamentoContextoDTO> equipamentosAfetados,
        AnomaliaContextoDTO anomalia
) {

    public record SensorContextoDTO(
            UUID id,
            String descricao,
            String grandeza,
            String unidadeMedida,
            String unidadePadrao
    ) {
    }

    public record EquipamentoContextoDTO(
            UUID id,
            String descricao,
            String tipoEquipamento,
            String tipoRelacao
    ) {
    }

    public record AnomaliaContextoDTO(
            String tipoAnomalia,
            String severidade,
            String statusAlerta,

            Double medida,
            Double mediaReferencia,
            Double desvioPadraoReferencia,
            Double limiteMinReferencia,
            Double limiteMaxReferencia,
            Double scoreDesvio,

            String descricao,
            OffsetDateTime dtOcorrencia
    ) {
    }
}