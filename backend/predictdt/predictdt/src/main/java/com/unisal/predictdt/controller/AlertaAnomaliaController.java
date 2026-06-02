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

    /*
     * Marca o alerta como reconhecido.
     */
    @PatchMapping("/{id}/reconhecer")
    public ResponseEntity<AlertaAnomaliaResponseDTO> reconhecer(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(alertaAnomaliaService.reconhecer(id));
    }

    /*
     * Resolve/fecha o alerta.
     */
    @PatchMapping("/{id}/resolver")
    public ResponseEntity<AlertaAnomaliaResponseDTO> resolver(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(alertaAnomaliaService.resolver(id));
    }

    /*
     * Ignora o alerta.
     */
    @PatchMapping("/{id}/ignorar")
    public ResponseEntity<AlertaAnomaliaResponseDTO> ignorar(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(alertaAnomaliaService.ignorar(id));
    }

    /*
     * Resolve todos os alertas abertos.
     *
     * Endpoint útil para limpeza do ambiente de teste.
     */
    @PatchMapping("/resolver-abertos")
    public ResponseEntity<String> resolverTodosAbertos() {
        int total = alertaAnomaliaService.resolverTodosAbertos();

        return ResponseEntity.ok(total + " alerta(s) aberto(s) resolvido(s) com sucesso");
    }
}