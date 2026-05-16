package com.unisal.predictdt.controller;

import com.unisal.predictdt.dto.grandezaMedida.GrandezaMedidaResponseDTO;
import com.unisal.predictdt.service.GrandezaMedidaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/grandezas-medida")
@RequiredArgsConstructor
public class GrandezaMedidaController {

    private final GrandezaMedidaService grandezaMedidaService;

    /*
     * Retorna as grandezas ativas para uso em dropdowns do frontend.
     */
    @GetMapping
    public ResponseEntity<List<GrandezaMedidaResponseDTO>> listarAtivas() {
        return ResponseEntity.ok(grandezaMedidaService.listarAtivas());
    }
}