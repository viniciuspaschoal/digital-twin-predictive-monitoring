package com.unisal.predictdt.service;

import com.unisal.predictdt.dto.alertaAnomalia.AlertaAnomaliaResponseDTO;
import com.unisal.predictdt.entity.AlertaAnomalia;
import com.unisal.predictdt.entity.enums.StatusAlerta;
import com.unisal.predictdt.exception.BusinessException;
import com.unisal.predictdt.mapper.AlertaAnomaliaMapper;
import com.unisal.predictdt.repository.AlertaAnomaliaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
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

    @Transactional(readOnly = true)
    public Page<AlertaAnomaliaResponseDTO> listarTodosPaginado(int page, int size) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "dtOcorrencia")
        );

        return alertaAnomaliaRepository
                .findAll(pageable)
                .map(AlertaAnomaliaMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<AlertaAnomaliaResponseDTO> buscarPorStatusPaginado(
            StatusAlerta status,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(page, size);

        return alertaAnomaliaRepository
                .findByStatusAlertaOrderByDtOcorrenciaDesc(status, pageable)
                .map(AlertaAnomaliaMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<AlertaAnomaliaResponseDTO> buscarPorSensorPaginado(
            UUID sensorId,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(page, size);

        return alertaAnomaliaRepository
                .findBySensor_IdOrderByDtOcorrenciaDesc(sensorId, pageable)
                .map(AlertaAnomaliaMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<AlertaAnomaliaResponseDTO> buscarPorEquipamentoPaginado(
            UUID equipamentoId,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(page, size);

        return alertaAnomaliaRepository
                .findByEquipamento_IdOrderByDtOcorrenciaDesc(equipamentoId, pageable)
                .map(AlertaAnomaliaMapper::toResponse);
    }

    @Transactional
    public AlertaAnomaliaResponseDTO reconhecer(UUID id) {
        AlertaAnomalia alerta = buscarAlertaPorId(id);

        if (alerta.getStatusAlerta() == StatusAlerta.RESOLVIDO) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "Não é possível reconhecer um alerta já resolvido"
            );
        }

        if (alerta.getStatusAlerta() == StatusAlerta.IGNORADO) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "Não é possível reconhecer um alerta ignorado"
            );
        }

        alerta.setStatusAlerta(StatusAlerta.RECONHECIDO);
        alerta.setDtReconhecimento(OffsetDateTime.now());

        AlertaAnomalia salvo = alertaAnomaliaRepository.save(alerta);
        return AlertaAnomaliaMapper.toResponse(salvo);
    }

    @Transactional
    public AlertaAnomaliaResponseDTO resolver(UUID id) {
        AlertaAnomalia alerta = buscarAlertaPorId(id);

        if (alerta.getStatusAlerta() == StatusAlerta.RESOLVIDO) {
            return AlertaAnomaliaMapper.toResponse(alerta);
        }

        OffsetDateTime agora = OffsetDateTime.now();

        if (alerta.getDtReconhecimento() == null) {
            alerta.setDtReconhecimento(agora);
        }

        alerta.setStatusAlerta(StatusAlerta.RESOLVIDO);
        alerta.setDtResolucao(agora);

        AlertaAnomalia salvo = alertaAnomaliaRepository.save(alerta);
        return AlertaAnomaliaMapper.toResponse(salvo);
    }

    @Transactional
    public AlertaAnomaliaResponseDTO ignorar(UUID id) {
        AlertaAnomalia alerta = buscarAlertaPorId(id);

        if (alerta.getStatusAlerta() == StatusAlerta.RESOLVIDO) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "Não é possível ignorar um alerta já resolvido"
            );
        }

        alerta.setStatusAlerta(StatusAlerta.IGNORADO);

        AlertaAnomalia salvo = alertaAnomaliaRepository.save(alerta);
        return AlertaAnomaliaMapper.toResponse(salvo);
    }

    @Transactional
    public int resolverTodosAbertos() {
        List<AlertaAnomalia> alertasAbertos =
                alertaAnomaliaRepository.findByStatusAlertaOrderByDtOcorrenciaDesc(StatusAlerta.ABERTO);

        OffsetDateTime agora = OffsetDateTime.now();

        alertasAbertos.forEach(alerta -> {
            alerta.setStatusAlerta(StatusAlerta.RESOLVIDO);

            if (alerta.getDtReconhecimento() == null) {
                alerta.setDtReconhecimento(agora);
            }

            alerta.setDtResolucao(agora);
        });

        alertaAnomaliaRepository.saveAll(alertasAbertos);

        return alertasAbertos.size();
    }

    private AlertaAnomalia buscarAlertaPorId(UUID id) {
        return alertaAnomaliaRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        HttpStatus.NOT_FOUND,
                        "Alerta de anomalia não encontrado"
                ));
    }
}