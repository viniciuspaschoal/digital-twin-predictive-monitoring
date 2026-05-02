package com.unisal.predictdt.mapper;

import com.unisal.predictdt.dto.topico_mqtt.TopicoMqttRequestDTO;
import com.unisal.predictdt.dto.topico_mqtt.TopicoMqttResponseDTO;
import com.unisal.predictdt.entity.TopicoMqtt;

public class TopicoMqttMapper {

    public static TopicoMqtt toEntity(TopicoMqttRequestDTO dto) {
        TopicoMqtt entity = new TopicoMqtt();
        entity.setDescricao(dto.descricao());
        entity.setAtivo(dto.ativo() != null ? dto.ativo() : true);
        return entity;
    }

    public static TopicoMqttResponseDTO toResponse (TopicoMqtt entity) {
        return new TopicoMqttResponseDTO(
                entity.getId(),
                entity.getDescricao(),
                entity.getAtivo(),
                entity.getDtInclusao()
        );
    }
}
