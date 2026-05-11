package com.unisal.predictdt.repository;

import com.unisal.predictdt.entity.AlertaAnomalia;
import com.unisal.predictdt.entity.enums.StatusAlerta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AlertaAnomaliaRepository extends JpaRepository<AlertaAnomalia, UUID> {

    List<AlertaAnomalia> findBySensor_IdOrderByDtOcorrenciaDesc(UUID sensorId);

    List<AlertaAnomalia> findByEquipamento_IdOrderByDtOcorrenciaDesc(UUID equipamentoId);

    List<AlertaAnomalia> findByStatusAlertaOrderByDtOcorrenciaDesc(StatusAlerta statusAlerta);
}
