package com.unisal.predictdt.controller;

import com.unisal.predictdt.dto.topico_mqtt.TopicoMqttRequestDTO;
import com.unisal.predictdt.dto.topico_mqtt.TopicoMqttResponseDTO;
import com.unisal.predictdt.service.TopicoMqttService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}