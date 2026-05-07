package com.unisal.predictdt.mapper;

import com.unisal.predictdt.dto.sensor_equipamento.SensorEquipamentoRequestDTO;
import com.unisal.predictdt.dto.sensor_equipamento.SensorEquipamentoResponseDTO;
import com.unisal.predictdt.entity.Equipamento;
import com.unisal.predictdt.entity.Sensor;
import com.unisal.predictdt.entity.SensorEquipamento;

public class SensorEquipamentoMapper {

    public static SensorEquipamento toEntity(SensorEquipamentoRequestDTO dto, Sensor sensor, Equipamento equipamento) {
        SensorEquipamento entity = new SensorEquipamento();
        entity.setSensor(sensor);
        entity.setEquipamento(equipamento);
        return entity;
    }

    public static SensorEquipamentoResponseDTO toResponse(SensorEquipamento entity) {
        return new SensorEquipamentoResponseDTO(
                entity.getId(),
                entity.getSensor().getId(),
                entity.getSensor().getDescricao(),
                entity.getEquipamento().getId(),
                entity.getEquipamento().getDescricao()
        );
    }
}
