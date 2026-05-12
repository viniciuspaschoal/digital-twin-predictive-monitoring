package com.unisal.predictdt.controller;

import com.unisal.predictdt.dto.alertaAnomalia.AlertaAnomaliaResponseDTO;
import com.unisal.predictdt.entity.enums.StatusAlerta;
import com.unisal.predictdt.service.AlertaAnomaliaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/alertas-anomalia")
@RequiredArgsConstructor
public class AlertaAnomaliaController {

    private final AlertaAnomaliaService alertaAnomaliaService;

    @GetMapping
    public ResponseEntity<List<AlertaAnomaliaResponseDTO>> listarTodos() {
        return ResponseEntity.ok(alertaAnomaliaService.listarTodos());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<AlertaAnomaliaResponseDTO>> buscarPorStatus(
            @PathVariable StatusAlerta status
    ) {
        return ResponseEntity.ok(alertaAnomaliaService.buscarPorStatus(status));
    }

    @GetMapping("/sensor/{sensorId}")
    public ResponseEntity<List<AlertaAnomaliaResponseDTO>> buscarPorSensor(
            @PathVariable UUID sensorId
    ) {
        return ResponseEntity.ok(alertaAnomaliaService.buscarPorSensor(sensorId));
    }

    @GetMapping("/equipamento/{equipamentoId}")
    public ResponseEntity<List<AlertaAnomaliaResponseDTO>> buscarPorEquipamento(
            @PathVariable UUID equipamentoId
    ) {
        return ResponseEntity.ok(alertaAnomaliaService.buscarPorEquipamento(equipamentoId));
    }
}