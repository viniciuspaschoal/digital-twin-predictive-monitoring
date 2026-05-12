package com.unisal.predictdt.controller;

import com.unisal.predictdt.dto.tipoEquipamento.TipoEquipamentoResponseDTO;
import com.unisal.predictdt.service.TipoEquipamentoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tipos-equipamento")
@RequiredArgsConstructor
public class TipoEquipamentoController {

    private final TipoEquipamentoService tipoEquipamentoService;

    /**
     * Retorna os tipos de equipamento ativos.
     *
     * Esse endpoint é usado pelo frontend para preencher o dropdown
     * no cadastro de equipamentos.
     */
    @GetMapping
    public ResponseEntity<List<TipoEquipamentoResponseDTO>> listarAtivos() {
        return ResponseEntity.ok(tipoEquipamentoService.listarAtivos());
    }
}