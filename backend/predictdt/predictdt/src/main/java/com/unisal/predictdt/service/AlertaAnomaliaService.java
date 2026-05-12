package com.unisal.predictdt.service;

import com.unisal.predictdt.dto.alertaAnomalia.AlertaAnomaliaResponseDTO;
import com.unisal.predictdt.entity.enums.StatusAlerta;
import com.unisal.predictdt.mapper.AlertaAnomaliaMapper;
import com.unisal.predictdt.repository.AlertaAnomaliaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AlertaAnomaliaService {

    private final AlertaAnomaliaRepository alertaAnomaliaRepository;

    @Transactional(readOnly = true)
    public List<AlertaAnomaliaResponseDTO> listarTodos() {
        return alertaAnomaliaRepository
                .findAll(Sort.by(Sort.Direction.DESC, "dtOcorrencia"))
                .stream()
                .map(AlertaAnomaliaMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AlertaAnomaliaResponseDTO> buscarPorStatus(StatusAlerta status) {
        return alertaAnomaliaRepository
                .findByStatusAlertaOrderByDtOcorrenciaDesc(status)
                .stream()
                .map(AlertaAnomaliaMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AlertaAnomaliaResponseDTO> buscarPorSensor(UUID sensorId) {
        return alertaAnomaliaRepository
                .findBySensor_IdOrderByDtOcorrenciaDesc(sensorId)
                .stream()
                .map(AlertaAnomaliaMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AlertaAnomaliaResponseDTO> buscarPorEquipamento(UUID equipamentoId) {
        return alertaAnomaliaRepository
                .findByEquipamento_IdOrderByDtOcorrenciaDesc(equipamentoId)
                .stream()
                .map(AlertaAnomaliaMapper::toResponse)
                .toList();
    }
}