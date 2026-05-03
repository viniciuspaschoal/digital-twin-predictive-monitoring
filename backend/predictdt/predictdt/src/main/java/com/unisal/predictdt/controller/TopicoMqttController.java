package com.unisal.predictdt.controller;

import com.unisal.predictdt.dto.topico_mqtt.TopicoMqttRequestDTO;
import com.unisal.predictdt.dto.topico_mqtt.TopicoMqttResponseDTO;
import com.unisal.predictdt.dto.topico_mqtt.TopicoMqttUpdateDTO;
import com.unisal.predictdt.service.TopicoMqttService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/topico-mqtt")
@RequiredArgsConstructor
public class TopicoMqttController {

    private final TopicoMqttService service;

    // Cadastrando TopicoMqtt
    @PostMapping
    public ResponseEntity<TopicoMqttResponseDTO> criar(@RequestBody @Valid TopicoMqttRequestDTO dto) {
        TopicoMqttResponseDTO response = service.criarTopicoMqtt(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Buscando tudo da tabela TopicoMqtt
    @GetMapping
    public ResponseEntity<Page<TopicoMqttResponseDTO>> getTopicosMqtt(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<TopicoMqttResponseDTO> response = service.getTopicosMqtt(page, size);
        return ResponseEntity.ok(response);
    }

    // Buscando TopicoMqtt por ID
    @GetMapping("/{id}")
    public ResponseEntity<TopicoMqttResponseDTO> getTopicoMqttById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getTopicoMqttById(id));
    }

    // Altera TopicoMqtt por ID
    @PutMapping("/{id}")
    public ResponseEntity<TopicoMqttResponseDTO> putTopicoMqtt(
            @PathVariable UUID id,
            @RequestBody @Valid TopicoMqttUpdateDTO dto) {
        return ResponseEntity.ok(service.putTopicoMqtt(id, dto));
    }

    // Delete TopicoMqtt
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletarTopicoMqtt(@PathVariable UUID id) {
        service.deletarTopicoMqtt(id);
        return ResponseEntity.ok("Tópico MQTT deletado com sucesso");
    }
}