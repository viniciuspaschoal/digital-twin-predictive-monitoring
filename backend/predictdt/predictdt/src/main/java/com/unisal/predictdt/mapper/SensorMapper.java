package com.unisal.predictdt.mapper;

import com.unisal.predictdt.dto.sensor.SensorRequestDTO;
import com.unisal.predictdt.dto.sensor.SensorResponseDTO;
import com.unisal.predictdt.entity.GrandezaMedida;
import com.unisal.predictdt.entity.Sensor;
import com.unisal.predictdt.entity.TopicoMqtt;
import org.springframework.stereotype.Component;

@Component
public class SensorMapper {

    /**
     * Converte DTO de entrada para a Entity que será salva no banco.
     *
     * O mapper não acessa repository nem busca dados no banco.
     * Ele apenas recebe os objetos já validados pelo service e monta a entity.
     */
    public static Sensor toEntity(
            SensorRequestDTO dto,
            TopicoMqtt topicoMqtt,
            GrandezaMedida grandezaMedida
    ) {
        if (dto == null) return null;

        Sensor sensor = new Sensor();

        /*
         * Descrição livre do sensor.
         *
         * Exemplo:
         * "Sensor pressão saída", "Sensor corrente motor",
         * "Sensor vibração eixo" etc.
         */
        sensor.setDescricao(dto.descricao());

        /*
         * Unidade efetiva usada pelo sensor.
         *
         * Essa unidade é digitada pelo usuário porque a mesma grandeza
         * pode ser medida em unidades diferentes, como bar/psi para pressão
         * ou L/min/m³/h para vazão.
         */
        sensor.setUnidadeMedida(dto.unidadeMedida());

        /*
         * Tópico auxiliar usado para compor o tópico MQTT completo.
         */
        sensor.setTopicoAuxiliar(dto.topicoAuxiliar());

        /*
         * Tópico MQTT base ao qual o sensor pertence.
         */
        sensor.setTopico(topicoMqtt);

        /*
         * Grandeza física monitorada pelo sensor.
         *
         * Esse campo dá significado técnico para a medição:
         * corrente, pressão, temperatura, vibração, vazão etc.
         */
        sensor.setGrandezaMedida(grandezaMedida);

        /*
         * Todo sensor nasce ativo por padrão.
         */
        sensor.setAtivo(true);

        return sensor;
    }

    /**
     * Converte a Entity do banco para o DTO de saída.
     *
     * O DTO entrega dados prontos para o frontend, incluindo o tópico completo
     * e o contexto técnico da grandeza monitorada.
     */
    public static SensorResponseDTO toResponse(Sensor sensor) {
        if (sensor == null) return null;

        String prefixo = (sensor.getTopico() != null) ? sensor.getTopico().getDescricao() : "";
        String sufixo = (sensor.getTopicoAuxiliar() != null) ? sensor.getTopicoAuxiliar() : "";
        String topicoCompleto = prefixo + "/" + sufixo;

        return new SensorResponseDTO(
                sensor.getId(),
                sensor.getDescricao(),
                sensor.getUnidadeMedida(),
                sensor.getAtivo(),
                topicoCompleto,

                sensor.getGrandezaMedida() != null
                        ? sensor.getGrandezaMedida().getId()
                        : null,

                sensor.getGrandezaMedida() != null
                        ? sensor.getGrandezaMedida().getDescricao()
                        : null,

                sensor.getGrandezaMedida() != null
                        ? sensor.getGrandezaMedida().getUnidadePadrao()
                        : null,

                sensor.getDtInclusao(),
                sensor.getDtBloqueio()
        );
    }
}