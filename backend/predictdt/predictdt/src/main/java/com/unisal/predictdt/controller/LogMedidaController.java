package com.unisal.predictdt.controller;

import com.unisal.predictdt.dto.logMedida.LogMedidaRequestDTO;
import com.unisal.predictdt.dto.logMedida.LogMedidaResponseDTO;
import com.unisal.predictdt.service.LogMedidaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/log-medida")
@RequiredArgsConstructor
public class LogMedidaController {

    private final LogMedidaService logMedidaService;

    //Postando os dados
    @PostMapping
    public ResponseEntity<LogMedidaResponseDTO> postValores(@RequestBody @Valid LogMedidaRequestDTO dto){
        // Chamamos o service que coordena o Mapper e o Repository
        LogMedidaResponseDTO response = logMedidaService.salvar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Endpoint para o Frontend buscar o histórico de medidas.
     * Futuramente usaremos queries customizadas para otimizar a série temporal[cite: 1].
     */
    @GetMapping
    public ResponseEntity<List<LogMedidaResponseDTO>> listarTodos() {
        return ResponseEntity.ok(logMedidaService.buscarTodos());
    }
}
