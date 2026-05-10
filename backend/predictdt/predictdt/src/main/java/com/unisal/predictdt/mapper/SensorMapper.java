package com.unisal.predictdt.mapper;

import com.unisal.predictdt.dto.sensor.SensorRequestDTO;
import com.unisal.predictdt.dto.sensor.SensorResponseDTO;
import com.unisal.predictdt.entity.Sensor;
import com.unisal.predictdt.entity.TopicoMqtt;
import org.springframework.stereotype.Component;

@Component
public class SensorMapper {
    /**
     * Converte DTO de entrada para a Entity que será salva no banco.
     */

    public static Sensor toEntity(SensorRequestDTO dto, TopicoMqtt topicoMqtt){
        if (dto == null) return null;

        Sensor sensor = new Sensor();
        sensor.setDescricao(dto.descricao());
        sensor.setUnidadeMedida(dto.unidadeMedida());
        sensor.setTopicoAuxiliar(dto.topicoAuxiliar());
        sensor.setTopico(topicoMqtt); // Vincula o objeto completo do tópico

        // Campos padrão de inicialização
        sensor.setAtivo(true);

        return sensor;
    }

    /**
     * Converte a Entity do banco para o DTO de saída (o que o sistema verá).
     */
    public static SensorResponseDTO toResponse(Sensor sensor){
        if (sensor == null) return null;

        // Lógica de concatenação dos tópicos
        String prefixo = (sensor.getTopico() != null) ? sensor.getTopico().getDescricao() : "";
        String sufixo = (sensor.getTopicoAuxiliar() != null) ? sensor.getTopicoAuxiliar() : "";
        String topicoCompleto = prefixo + "/" + sufixo;

        return new SensorResponseDTO(
                sensor.getId(),
                sensor.getDescricao(),
                sensor.getUnidadeMedida(),
                sensor.getAtivo(),
                topicoCompleto,
                sensor.getDtInclusao(),
                sensor.getDtBloqueio()
        );
    }
}
