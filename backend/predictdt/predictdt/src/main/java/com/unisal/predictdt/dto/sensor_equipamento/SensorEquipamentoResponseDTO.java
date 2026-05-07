package com.unisal.predictdt.dto.sensor_equipamento;

import java.util.UUID;

public record SensorEquipamentoResponseDTO(
        UUID id,
        UUID idSensor,
        String descricaoSensor,
        UUID idEquipamento,
        String descricaoEquipamento
) {
}