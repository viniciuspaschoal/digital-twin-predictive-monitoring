package com.unisal.predictdt.dto.sensor_equipamento;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SensorEquipamentoRequestDTO(
        @NotNull(message = "O campo ID Sensor deve estar preenchido")
        UUID idSensor,
        @NotNull(message = "O campo ID Equipamento deve estar preenchido")
        UUID idEquipamento
) {
}