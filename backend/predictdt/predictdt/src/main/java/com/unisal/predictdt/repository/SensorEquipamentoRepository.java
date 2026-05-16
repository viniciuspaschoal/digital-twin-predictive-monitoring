package com.unisal.predictdt.repository;

import com.unisal.predictdt.entity.SensorEquipamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SensorEquipamentoRepository extends JpaRepository<SensorEquipamento, UUID> {
    boolean existsBySensorIdAndEquipamentoId(UUID sensorId, UUID equipamentoId);

    List<SensorEquipamento> findBySensor_Id(UUID sensorId);
}