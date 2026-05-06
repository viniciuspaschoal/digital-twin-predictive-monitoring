package com.unisal.predictdt.dto.sensor;

public record SensorUpdateDTO(
        String descricao,
        String unidadeMedida,
        String topicoAuxiliar,
        Boolean ativo
) {}
