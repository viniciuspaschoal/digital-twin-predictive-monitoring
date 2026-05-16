package com.unisal.predictdt.controller;

import com.unisal.predictdt.dto.alertaExplicacao.AlertaExplicacaoResponseDTO;
import com.unisal.predictdt.service.AiExplanationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/alertas-anomalia")
@RequiredArgsConstructor
public class AlertaExplicacaoController {

    private final AiExplanationService aiExplanationService;

    /*
     * Retorna uma explicação humanizada para o alerta.
     *
     * Hoje a explicação é gerada localmente a partir do contexto estruturado.
     * Futuramente este endpoint poderá usar uma API de IA generativa para
     * melhorar a linguagem e adaptar a explicação ao tipo de equipamento.
     */
    @GetMapping("/{alertaId}/explicacao")
    public ResponseEntity<AlertaExplicacaoResponseDTO> gerarExplicacao(
            @PathVariable UUID alertaId
    ) {
        return ResponseEntity.ok(aiExplanationService.gerarExplicacao(alertaId));
    }
}