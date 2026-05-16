package com.unisal.predictdt.service;

import com.unisal.predictdt.dto.alertaContexto.AlertaContextoResponseDTO;
import com.unisal.predictdt.entity.AlertaAnomalia;
import com.unisal.predictdt.entity.Sensor;
import com.unisal.predictdt.entity.SensorEquipamento;
import com.unisal.predictdt.exception.BusinessException;
import com.unisal.predictdt.repository.AlertaAnomaliaRepository;
import com.unisal.predictdt.repository.SensorEquipamentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AlertaContextoService {

    private final AlertaAnomaliaRepository alertaAnomaliaRepository;
    private final SensorEquipamentoRepository sensorEquipamentoRepository;

    /*
     * Monta o contexto técnico de um alerta de anomalia.
     *
     * Este método não chama IA generativa.
     * Ele apenas organiza os dados de forma estruturada para que o frontend
     * ou um futuro serviço de IA consiga interpretar o alerta com contexto.
     */
    @Transactional(readOnly = true)
    public AlertaContextoResponseDTO montarContexto(UUID alertaId) {
        AlertaAnomalia alerta = alertaAnomaliaRepository.findById(alertaId)
                .orElseThrow(() -> new BusinessException(
                        HttpStatus.NOT_FOUND,
                        "Alerta de anomalia não encontrado"
                ));

        Sensor sensor = alerta.getSensor();

        /*
         * Busca todos os equipamentos relacionados ao sensor que gerou o alerta.
         *
         * Isso é necessário porque um sensor pode influenciar mais de um equipamento,
         * como um sensor de temperatura ambiente posicionado entre duas bombas.
         */
        List<SensorEquipamento> vinculos = sensorEquipamentoRepository.findBySensor_Id(sensor.getId());

        AlertaContextoResponseDTO.SensorContextoDTO sensorDTO = montarSensorContexto(sensor);

        List<AlertaContextoResponseDTO.EquipamentoContextoDTO> equipamentosDTO =
                vinculos.stream()
                        .map(this::montarEquipamentoContexto)
                        .toList();

        AlertaContextoResponseDTO.AnomaliaContextoDTO anomaliaDTO = montarAnomaliaContexto(alerta);

        return new AlertaContextoResponseDTO(
                alerta.getId(),
                sensorDTO,
                equipamentosDTO,
                anomaliaDTO
        );
    }

    private AlertaContextoResponseDTO.SensorContextoDTO montarSensorContexto(Sensor sensor) {
        return new AlertaContextoResponseDTO.SensorContextoDTO(
                sensor.getId(),
                sensor.getDescricao(),
                sensor.getGrandezaMedida() != null
                        ? sensor.getGrandezaMedida().getDescricao()
                        : null,
                sensor.getUnidadeMedida(),
                sensor.getGrandezaMedida() != null
                        ? sensor.getGrandezaMedida().getUnidadePadrao()
                        : null
        );
    }

    private AlertaContextoResponseDTO.EquipamentoContextoDTO montarEquipamentoContexto(
            SensorEquipamento vinculo
    ) {
        return new AlertaContextoResponseDTO.EquipamentoContextoDTO(
                vinculo.getEquipamento().getId(),
                vinculo.getEquipamento().getDescricao(),
                vinculo.getEquipamento().getTipoEquipamento() != null
                        ? vinculo.getEquipamento().getTipoEquipamento().getDescricao()
                        : null,
                vinculo.getTipoRelacao() != null
                        ? vinculo.getTipoRelacao().name()
                        : null
        );
    }

    private AlertaContextoResponseDTO.AnomaliaContextoDTO montarAnomaliaContexto(
            AlertaAnomalia alerta
    ) {
        return new AlertaContextoResponseDTO.AnomaliaContextoDTO(
                alerta.getTipoAnomalia() != null
                        ? alerta.getTipoAnomalia().name()
                        : null,

                alerta.getSeveridade() != null
                        ? alerta.getSeveridade().name()
                        : null,

                alerta.getStatusAlerta() != null
                        ? alerta.getStatusAlerta().name()
                        : null,

                alerta.getMedida(),
                alerta.getMediaReferencia(),
                alerta.getDesvioPadraoReferencia(),
                alerta.getLimiteMinReferencia(),
                alerta.getLimiteMaxReferencia(),
                alerta.getScoreDesvio(),

                alerta.getDescricao(),
                alerta.getDtOcorrencia()
        );
    }
}