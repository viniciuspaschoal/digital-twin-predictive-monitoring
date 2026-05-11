package com.unisal.predictdt.mapper;

import com.unisal.predictdt.dto.logMedida.LogMedidaRequestDTO;
import com.unisal.predictdt.dto.logMedida.LogMedidaResponseDTO;
import com.unisal.predictdt.entity.LogMedida;
import com.unisal.predictdt.entity.LogMedidaId;
import com.unisal.predictdt.entity.Sensor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.UUID;

@Slf4j
@Component
public class LogMedidaMapper {

    public static LogMedida toEntity(LogMedidaRequestDTO dto, Sensor sensor) {
        if (dto == null) return null;

        LogMedida log = new LogMedida();

        LogMedidaId id = new LogMedidaId();
        id.setId(UUID.randomUUID());
        id.setDtMedida(OffsetDateTime.now());

        log.setId(id);
        log.setSensor(sensor);
        log.setMedida(dto.medida());

        return log;
    }

    public static LogMedidaResponseDTO toResponse(LogMedida entity) {
        if (entity == null) return null;

        return new LogMedidaResponseDTO(
                entity.getId().getDtMedida(),
                entity.getId().getId(),
                entity.getMedida(),
                entity.getSensor().getDescricao()
        );
    }
}