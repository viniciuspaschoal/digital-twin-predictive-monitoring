package com.unisal.predictdt.controller;

import com.unisal.predictdt.dto.sensor_equipamento.SensorEquipamentoRequestDTO;
import com.unisal.predictdt.dto.sensor_equipamento.SensorEquipamentoResponseDTO;
import com.unisal.predictdt.service.SensorEquipamentoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/sensor-equipamento")
@RequiredArgsConstructor
public class SensorEquipamentoController {

    private final SensorEquipamentoService service;

    // Vinculando sensor a equipamento
    @PostMapping
    public ResponseEntity<SensorEquipamentoResponseDTO> vincular(@RequestBody @Valid SensorEquipamentoRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.vincularSensorEquipamento(dto));
    }

    // Buscando tudo da tabela Sensor Equipamento
    @GetMapping
    public ResponseEntity<Page<SensorEquipamentoResponseDTO>> getSensorEquipamento(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(service.getAllSensorEquipamento(page, size));
    }

    // Busca vinculo pelo ID
    @GetMapping("/{id}")
    public ResponseEntity<SensorEquipamentoResponseDTO> getSensorEquipamentoByID(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getSensorEquipamentoByID(id));
    }

    // Delete vínculo
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletarVinculo(@PathVariable UUID id) {
        service.deletarVinculo(id);
        return ResponseEntity.ok("Vínculo deletado com sucesso");
    }
}
