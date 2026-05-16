package com.unisal.predictdt.controller;

import com.unisal.predictdt.dto.alertaContexto.AlertaContextoResponseDTO;
import com.unisal.predictdt.service.AlertaContextoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/alertas-anomalia")
@RequiredArgsConstructor
public class AlertaContextoController {

    private final AlertaContextoService alertaContextoService;

    /*
     * Retorna o contexto técnico estruturado de um alerta.
     *
     * Esse endpoint prepara os dados para o frontend e futuramente
     * para a IA generativa que irá humanizar a explicação.
     */
    @GetMapping("/{alertaId}/contexto")
    public ResponseEntity<AlertaContextoResponseDTO> buscarContexto(
            @PathVariable UUID alertaId
    ) {
        return ResponseEntity.ok(alertaContextoService.montarContexto(alertaId));
    }
}