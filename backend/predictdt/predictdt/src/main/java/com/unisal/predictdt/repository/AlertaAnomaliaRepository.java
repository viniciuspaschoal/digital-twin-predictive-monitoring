package com.unisal.predictdt.repository;

import com.unisal.predictdt.entity.AlertaAnomalia;
import com.unisal.predictdt.entity.enums.StatusAlerta;
import com.unisal.predictdt.entity.enums.TipoAnomalia;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AlertaAnomaliaRepository extends JpaRepository<AlertaAnomalia, UUID> {

    List<AlertaAnomalia> findBySensor_IdOrderByDtOcorrenciaDesc(UUID sensorId);

    List<AlertaAnomalia> findByEquipamento_IdOrderByDtOcorrenciaDesc(UUID equipamentoId);

    List<AlertaAnomalia> findByStatusAlertaOrderByDtOcorrenciaDesc(StatusAlerta statusAlerta);

    Page<AlertaAnomalia> findByStatusAlertaOrderByDtOcorrenciaDesc(
            StatusAlerta statusAlerta,
            Pageable pageable
    );

    Page<AlertaAnomalia> findBySensor_IdOrderByDtOcorrenciaDesc(
            UUID sensorId,
            Pageable pageable
    );

    Page<AlertaAnomalia> findByEquipamento_IdOrderByDtOcorrenciaDesc(
            UUID equipamentoId,
            Pageable pageable
    );

    /*
     * Busca o alerta ativo mais recente para o mesmo sensor e tipo de anomalia.
     *
     * Usado para evitar geração de alertas duplicados enquanto um alerta
     * equivalente ainda está aberto ou reconhecido.
     */
    Optional<AlertaAnomalia> findFirstBySensor_IdAndTipoAnomaliaAndStatusAlertaInOrderByDtOcorrenciaDesc(
            UUID sensorId,
            TipoAnomalia tipoAnomalia,
            Collection<StatusAlerta> statusAlertas
    );
}