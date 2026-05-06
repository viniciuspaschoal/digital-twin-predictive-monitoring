package com.unisal.predictdt.controller;

import com.unisal.predictdt.dto.equipamento.EquipamentoRequestDTO;
import com.unisal.predictdt.dto.equipamento.EquipamentoResponseDTO;
import com.unisal.predictdt.dto.equipamento.EquipamentoUpdateDTO;
import com.unisal.predictdt.service.EquipamentoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/equipamento")
@RequiredArgsConstructor
public class EquipamentoController {

    private final EquipamentoService service;

    // Cadastrando Equipamento
    @PostMapping
    public ResponseEntity<EquipamentoResponseDTO> criar(@RequestBody @Valid EquipamentoRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criarEquipamento(dto));
    }

    // Buscando tudo da tabela Equipamento
    @GetMapping
    public ResponseEntity<Page<EquipamentoResponseDTO>> getEquipamentos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(service.getEquipamentos(page, size));
    }

    // Buscando Equipamento por ID
    @GetMapping("/{id}")
    public ResponseEntity<EquipamentoResponseDTO> getEquipamentoById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getEquipamentoByID(id));
    }

    // Altera Equipamento por ID
    @PutMapping("/{id}")
    public ResponseEntity<EquipamentoResponseDTO> putEquipamento(
            @PathVariable UUID id,
            @RequestBody @Valid EquipamentoUpdateDTO dto) {
        return ResponseEntity.ok(service.putEquipamentoByID(id, dto));
    }

    // Deleta Equipamento por ID
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletarEquipamento(@PathVariable UUID id) {
        service.deletarEquipamento(id);
        return ResponseEntity.ok("Equipamento deletado com sucesso");
    }
}