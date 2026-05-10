package com.unisal.predictdt.mapper;

import com.unisal.predictdt.dto.logMedida.LogMedidaRequestDTO;
import com.unisal.predictdt.dto.logMedida.LogMedidaResponseDTO;
import com.unisal.predictdt.entity.LogMedida;
import com.unisal.predictdt.entity.LogMedidaId;
import com.unisal.predictdt.entity.Sensor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;

@Slf4j
@Component
public class LogMedidaMapper {

    public static LogMedida toEntity(LogMedidaRequestDTO dto, Sensor sensor){
        if (dto == null) return null;

        // Criar um objeto vazio do Banco (Entity)
        LogMedida log = new LogMedida();

        // Criando chave composta
        LogMedidaId id = new LogMedidaId();
        id.setSensorId(dto.sensorId()); // Pega do pacote e põe na chave
        id.setDtMedida(OffsetDateTime.now()); // Carimba a hora atual

        log.setId(id);
        log.setSensor(sensor); //O service deu o sensor, e eu só anexo
        log.setMedida(dto.medida()); //Pega o valor que veio do python

        //Devolvemos pronto para ser salvo
        return log;
    }

    public static LogMedidaResponseDTO toResponse(LogMedida entity){
        // Pegamos as peças espalhadas da Entity e montamos o pacotinho DTO
        return new LogMedidaResponseDTO(
                entity.getId().getDtMedida(), // Pega a data da chave composta
                entity.getId().getSensorId(), // Pega o ID da chave composta
                entity.getMedida(),           // Pega o valor
                entity.getSensor().getDescricao() // Pega o nome do sensor (que não estava na tabela de log!)
        );
    }
}
