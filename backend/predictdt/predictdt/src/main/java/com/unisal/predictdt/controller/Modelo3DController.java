package com.unisal.predictdt.controller;

import com.unisal.predictdt.dto.modelo3d.CameraViewDTO;
import com.unisal.predictdt.dto.modelo3d.Modelo3DEquipmentMapRequestDTO;
import com.unisal.predictdt.dto.modelo3d.Modelo3DEquipamentoVinculoRequestDTO;
import com.unisal.predictdt.dto.modelo3d.Modelo3DResponseDTO;
import com.unisal.predictdt.service.Modelo3DService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/modelos-3d")
@RequiredArgsConstructor
public class Modelo3DController {

    private final Modelo3DService modelo3DService;

    /*
     * Importa um novo modelo 3D para o dashboard.
     *
     * Espera multipart/form-data com o campo:
     * file
     *
     * Exemplo:
     * POST /modelos-3d
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Modelo3DResponseDTO> importarModelo(
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(modelo3DService.importarModelo(file));
    }

    /*
     * Busca o modelo 3D ativo do dashboard.
     *
     * O frontend usa este endpoint ao abrir o dashboard para recuperar:
     * - URL do GLB;
     * - posição da câmera;
     * - target da câmera;
     * - mapa de vínculos entre objetos 3D e equipamentos.
     */
    @GetMapping("/ativo")
    public ResponseEntity<Modelo3DResponseDTO> buscarModeloAtivo() {
        return ResponseEntity.ok(modelo3DService.buscarModeloAtivo());
    }

    /*
     * Retorna o arquivo físico GLB/GLTF salvo no storage local.
     *
     * O frontend usa a URL retornada pelo DTO:
     * /modelos-3d/{id}/arquivo
     */
    @GetMapping("/{id}/arquivo")
    public ResponseEntity<Resource> carregarArquivo(
            @PathVariable UUID id
    ) {
        Modelo3DService.ArquivoModelo3DResource arquivo =
                modelo3DService.carregarArquivo(id);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(arquivo.contentType()))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition
                                .inline()
                                .filename(arquivo.fileName(), StandardCharsets.UTF_8)
                                .build()
                                .toString()
                )
                .body(arquivo.resource());
    }

    /*
     * Salva a visualização da câmera do dashboard.
     *
     * Payload:
     * {
     *   "position": [4.2, 2.5, 6.8],
     *   "target": [0, 0, 0]
     * }
     */
    @PutMapping("/{id}/camera-view")
    public ResponseEntity<CameraViewDTO> salvarCameraView(
            @PathVariable UUID id,
            @RequestBody @Valid CameraViewDTO dto
    ) {
        return ResponseEntity.ok(modelo3DService.salvarCameraView(id, dto));
    }

    /*
     * Busca o mapa de vínculos do modelo.
     *
     * Resposta:
     * {
     *   "EQP_BOMBA_01": "uuid-do-equipamento",
     *   "EQP_BOMBA_02": "uuid-do-equipamento"
     * }
     */
    @GetMapping("/{id}/equipment-map")
    public ResponseEntity<Map<String, UUID>> buscarEquipmentMap(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(modelo3DService.buscarEquipmentMap(id));
    }

    /*
     * Substitui todos os vínculos do modelo de uma vez.
     *
     * Payload:
     * {
     *   "equipmentMap": {
     *     "EQP_BOMBA_01": "uuid-do-equipamento",
     *     "EQP_BOMBA_02": "uuid-do-equipamento"
     *   }
     * }
     */
    @PutMapping("/{id}/equipment-map")
    public ResponseEntity<Map<String, UUID>> substituirEquipmentMap(
            @PathVariable UUID id,
            @RequestBody @Valid Modelo3DEquipmentMapRequestDTO dto
    ) {
        return ResponseEntity.ok(modelo3DService.substituirEquipmentMap(id, dto));
    }

    /*
     * Cria ou atualiza um vínculo individual.
     *
     * Exemplo:
     * PUT /modelos-3d/{modeloId}/equipment-map/EQP_BOMBA_01
     *
     * Payload:
     * {
     *   "equipamentoId": "uuid-do-equipamento"
     * }
     */
    @PutMapping("/{id}/equipment-map/{objectName}")
    public ResponseEntity<Map<String, UUID>> vincularEquipamento(
            @PathVariable UUID id,
            @PathVariable String objectName,
            @RequestBody @Valid Modelo3DEquipamentoVinculoRequestDTO dto
    ) {
        return ResponseEntity.ok(
                modelo3DService.vincularEquipamento(id, objectName, dto)
        );
    }

    /*
     * Remove o vínculo entre um objeto 3D e um equipamento real.
     *
     * Não remove o equipamento.
     * Não remove o modelo 3D.
     */
    @DeleteMapping("/{id}/equipment-map/{objectName}")
    public ResponseEntity<Map<String, UUID>> removerVinculo(
            @PathVariable UUID id,
            @PathVariable String objectName
    ) {
        return ResponseEntity.ok(modelo3DService.removerVinculo(id, objectName));
    }

    /*
     * Desativa o modelo 3D.
     *
     * O arquivo físico não é removido nesta versão.
     */
    @PatchMapping("/{id}/desativar")
    public ResponseEntity<Void> desativarModelo(
            @PathVariable UUID id
    ) {
        modelo3DService.desativarModelo(id);
        return ResponseEntity.noContent().build();
    }
}