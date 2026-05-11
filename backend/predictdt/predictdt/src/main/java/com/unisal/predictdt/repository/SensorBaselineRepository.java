package com.unisal.predictdt.repository;

import com.unisal.predictdt.entity.SensorBaseline;
import com.unisal.predictdt.entity.enums.TipoJanelaBaseline;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SensorBaselineRepository extends JpaRepository<SensorBaseline, UUID> {

    Optional<SensorBaseline> findBySensorIdAndTipoJanelaAndAtivoTrue(
            UUID sensorId,
            TipoJanelaBaseline tipoJanela
    );
}
