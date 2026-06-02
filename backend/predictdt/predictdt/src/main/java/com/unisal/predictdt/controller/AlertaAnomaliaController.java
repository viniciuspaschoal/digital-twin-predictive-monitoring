package com.unisal.predictdt.controller;

import com.unisal.predictdt.dto.alertaAnomalia.AlertaAnomaliaResponseDTO;
import com.unisal.predictdt.entity.enums.StatusAlerta;
import com.unisal.predictdt.service.AlertaAnomaliaService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
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

    @GetMapping("/paginado")
    public ResponseEntity<Page<AlertaAnomaliaResponseDTO>> listarTodosPaginado(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(alertaAnomaliaService.listarTodosPaginado(page, size));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<AlertaAnomaliaResponseDTO>> buscarPorStatus(
            @PathVariable StatusAlerta status
    ) {
        return ResponseEntity.ok(alertaAnomaliaService.buscarPorStatus(status));
    }

    @GetMapping("/status/{status}/paginado")
    public ResponseEntity<Page<AlertaAnomaliaResponseDTO>> buscarPorStatusPaginado(
            @PathVariable StatusAlerta status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(alertaAnomaliaService.buscarPorStatusPaginado(status, page, size));
    }

    @GetMapping("/sensor/{sensorId}")
    public ResponseEntity<List<AlertaAnomaliaResponseDTO>> buscarPorSensor(
            @PathVariable UUID sensorId
    ) {
        return ResponseEntity.ok(alertaAnomaliaService.buscarPorSensor(sensorId));
    }

    @GetMapping("/sensor/{sensorId}/paginado")
    public ResponseEntity<Page<AlertaAnomaliaResponseDTO>> buscarPorSensorPaginado(
            @PathVariable UUID sensorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(alertaAnomaliaService.buscarPorSensorPaginado(sensorId, page, size));
    }

    @GetMapping("/equipamento/{equipamentoId}")
    public ResponseEntity<List<AlertaAnomaliaResponseDTO>> buscarPorEquipamento(
            @PathVariable UUID equipamentoId
    ) {
        return ResponseEntity.ok(alertaAnomaliaService.buscarPorEquipamento(equipamentoId));
    }

    @GetMapping("/equipamento/{equipamentoId}/paginado")
    public ResponseEntity<Page<AlertaAnomaliaResponseDTO>> buscarPorEquipamentoPaginado(
            @PathVariable UUID equipamentoId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(alertaAnomaliaService.buscarPorEquipamentoPaginado(equipamentoId, page, size));
    }

    @PatchMapping("/{id}/reconhecer")
    public ResponseEntity<AlertaAnomaliaResponseDTO> reconhecer(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(alertaAnomaliaService.reconhecer(id));
    }

    @PatchMapping("/{id}/resolver")
    public ResponseEntity<AlertaAnomaliaResponseDTO> resolver(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(alertaAnomaliaService.resolver(id));
    }

    @PatchMapping("/{id}/ignorar")
    public ResponseEntity<AlertaAnomaliaResponseDTO> ignorar(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(alertaAnomaliaService.ignorar(id));
    }

    @PatchMapping("/resolver-abertos")
    public ResponseEntity<String> resolverTodosAbertos() {
        int total = alertaAnomaliaService.resolverTodosAbertos();

        return ResponseEntity.ok(total + " alerta(s) aberto(s) resolvido(s) com sucesso");
    }
}