package com.unisal.predictdt.service;

import com.unisal.predictdt.dto.modelo3d.CameraViewDTO;
import com.unisal.predictdt.dto.modelo3d.Modelo3DEquipmentMapRequestDTO;
import com.unisal.predictdt.dto.modelo3d.Modelo3DEquipamentoVinculoRequestDTO;
import com.unisal.predictdt.dto.modelo3d.Modelo3DResponseDTO;
import com.unisal.predictdt.entity.Equipamento;
import com.unisal.predictdt.entity.Modelo3D;
import com.unisal.predictdt.entity.Modelo3DEquipamentoVinculo;
import com.unisal.predictdt.exception.BusinessException;
import com.unisal.predictdt.mapper.Modelo3DMapper;
import com.unisal.predictdt.repository.EquipamentoRepository;
import com.unisal.predictdt.repository.Modelo3DEquipamentoVinculoRepository;
import com.unisal.predictdt.repository.Modelo3DRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class Modelo3DService {

    private final Modelo3DRepository modelo3DRepository;
    private final Modelo3DEquipamentoVinculoRepository vinculoRepository;
    private final EquipamentoRepository equipamentoRepository;
    private final Modelo3DStorageService storageService;

    /*
     * Importa um novo modelo 3D para o dashboard.
     *
     * Regra atual:
     * - existe no máximo um modelo 3D ativo;
     * - ao importar um novo arquivo, o modelo ativo anterior é desativado;
     * - o novo modelo passa a ser o modelo ativo do dashboard.
     */
    @Transactional
    public Modelo3DResponseDTO importarModelo(MultipartFile file) {
        Modelo3DStorageService.ArquivoModelo3DSalvo arquivoSalvo =
                storageService.salvarArquivo(file);

        desativarModeloAtivoAtual();

        Modelo3D modelo = new Modelo3D();
        modelo.setNomeOriginalArquivo(arquivoSalvo.nomeOriginalArquivo());
        modelo.setStoragePath(arquivoSalvo.storagePath());
        modelo.setContentType(arquivoSalvo.contentType());
        modelo.setFileSize(arquivoSalvo.fileSize());
        modelo.setAtivo(true);

        Modelo3D salvo = modelo3DRepository.save(modelo);

        return Modelo3DMapper.toResponse(salvo);
    }

    /*
     * Busca o modelo 3D ativo do dashboard.
     *
     * Esse endpoint será usado pelo frontend ao abrir o dashboard,
     * substituindo o localStorage como fonte oficial.
     */
    @Transactional(readOnly = true)
    public Modelo3DResponseDTO buscarModeloAtivo() {
        Modelo3D modelo = modelo3DRepository.findByAtivoTrue()
                .orElseThrow(() -> new BusinessException(
                        HttpStatus.NOT_FOUND,
                        "Nenhum modelo 3D ativo encontrado"
                ));

        return Modelo3DMapper.toResponse(modelo);
    }

    /*
     * Carrega o arquivo físico do modelo 3D para o controller devolver ao frontend.
     */
    @Transactional(readOnly = true)
    public ArquivoModelo3DResource carregarArquivo(UUID modeloId) {
        Modelo3D modelo = buscarModeloPorId(modeloId);

        Resource resource = storageService.carregarArquivo(modelo.getStoragePath());

        return new ArquivoModelo3DResource(
                resource,
                modelo.getContentType(),
                modelo.getNomeOriginalArquivo()
        );
    }

    /*
     * Salva a visualização da câmera do dashboard.
     *
     * O frontend envia:
     * - position: [x, y, z]
     * - target: [x, y, z]
     */
    @Transactional
    public CameraViewDTO salvarCameraView(UUID modeloId, CameraViewDTO dto) {
        validarCameraView(dto);

        Modelo3D modelo = buscarModeloPorId(modeloId);

        modelo.setCameraPositionX(dto.position().get(0));
        modelo.setCameraPositionY(dto.position().get(1));
        modelo.setCameraPositionZ(dto.position().get(2));

        modelo.setCameraTargetX(dto.target().get(0));
        modelo.setCameraTargetY(dto.target().get(1));
        modelo.setCameraTargetZ(dto.target().get(2));

        modelo3DRepository.save(modelo);

        return dto;
    }

    /*
     * Retorna o mapa objectName -> equipamentoId.
     *
     * Exemplo:
     * {
     *   "EQP_BOMBA_01": "uuid-da-bomba"
     * }
     */
    @Transactional(readOnly = true)
    public Map<String, UUID> buscarEquipmentMap(UUID modeloId) {
        buscarModeloPorId(modeloId);

        return vinculoRepository.findByModelo3D_Id(modeloId)
                .stream()
                .collect(Collectors.toMap(
                        Modelo3DEquipamentoVinculo::getObjectName,
                        vinculo -> vinculo.getEquipamento().getId()
                ));
    }

    /*
     * Substitui o mapa completo de vínculos do modelo.
     *
     * Esse método é útil quando o frontend envia o mapa inteiro atualizado.
     */
    @Transactional
    public Map<String, UUID> substituirEquipmentMap(
            UUID modeloId,
            Modelo3DEquipmentMapRequestDTO dto
    ) {
        Modelo3D modelo = buscarModeloPorId(modeloId);

        if (dto.equipmentMap() == null) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "O mapa de vínculos deve ser informado"
            );
        }

        vinculoRepository.deleteByModelo3D_Id(modeloId);

        List<Modelo3DEquipamentoVinculo> novosVinculos = dto.equipmentMap()
                .entrySet()
                .stream()
                .map(entry -> criarVinculo(
                        modelo,
                        entry.getKey(),
                        entry.getValue()
                ))
                .toList();

        vinculoRepository.saveAll(novosVinculos);

        return buscarEquipmentMap(modeloId);
    }

    /*
     * Cria ou atualiza um vínculo individual entre objeto 3D e equipamento real.
     *
     * Exemplo:
     * EQP_BOMBA_01 -> bombalinha01
     */
    @Transactional
    public Map<String, UUID> vincularEquipamento(
            UUID modeloId,
            String objectName,
            Modelo3DEquipamentoVinculoRequestDTO dto
    ) {
        Modelo3D modelo = buscarModeloPorId(modeloId);

        if (dto.equipamentoId() == null) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "O equipamento deve ser informado"
            );
        }

        String objectNameLimpo = validarObjectName(objectName);
        String objectNameNormalizado = normalizarObjectName(objectNameLimpo);

        Equipamento equipamento = buscarEquipamentoPorId(dto.equipamentoId());

        Modelo3DEquipamentoVinculo vinculo = vinculoRepository
                .findByModelo3D_IdAndObjectNameNormalized(
                        modeloId,
                        objectNameNormalizado
                )
                .orElseGet(Modelo3DEquipamentoVinculo::new);

        vinculo.setModelo3D(modelo);
        vinculo.setObjectName(objectNameLimpo);
        vinculo.setObjectNameNormalized(objectNameNormalizado);
        vinculo.setEquipamento(equipamento);

        vinculoRepository.save(vinculo);

        return buscarEquipmentMap(modeloId);
    }

    /*
     * Remove o vínculo entre um objeto 3D e um equipamento real.
     *
     * Não remove o equipamento.
     * Não remove o modelo 3D.
     */
    @Transactional
    public Map<String, UUID> removerVinculo(UUID modeloId, String objectName) {
        buscarModeloPorId(modeloId);

        String objectNameLimpo = validarObjectName(objectName);
        String objectNameNormalizado = normalizarObjectName(objectNameLimpo);

        vinculoRepository.deleteByModelo3D_IdAndObjectNameNormalized(
                modeloId,
                objectNameNormalizado
        );

        return buscarEquipmentMap(modeloId);
    }

    /*
     * Desativa um modelo 3D.
     *
     * O arquivo físico não é removido neste momento.
     * A desativação apenas remove o modelo da posição de ativo no dashboard.
     */
    @Transactional
    public void desativarModelo(UUID modeloId) {
        Modelo3D modelo = buscarModeloPorId(modeloId);
        modelo.setAtivo(false);
        modelo3DRepository.save(modelo);
    }

    private void desativarModeloAtivoAtual() {
        modelo3DRepository.findByAtivoTrue()
                .ifPresent(modeloAtivo -> {
                    modeloAtivo.setAtivo(false);

                    /*
                     * saveAndFlush força o update antes da inserção do novo modelo ativo.
                     *
                     * Isso evita conflito com a constraint que permite apenas
                     * um modelo ativo por vez.
                     */
                    modelo3DRepository.saveAndFlush(modeloAtivo);
                });
    }

    private Modelo3D buscarModeloPorId(UUID modeloId) {
        return modelo3DRepository.findById(modeloId)
                .orElseThrow(() -> new BusinessException(
                        HttpStatus.NOT_FOUND,
                        "Modelo 3D não encontrado"
                ));
    }

    private Equipamento buscarEquipamentoPorId(UUID equipamentoId) {
        return equipamentoRepository.findById(equipamentoId)
                .orElseThrow(() -> new BusinessException(
                        HttpStatus.NOT_FOUND,
                        "Equipamento não encontrado"
                ));
    }

    private Modelo3DEquipamentoVinculo criarVinculo(
            Modelo3D modelo,
            String objectName,
            UUID equipamentoId
    ) {
        String objectNameLimpo = validarObjectName(objectName);
        String objectNameNormalizado = normalizarObjectName(objectNameLimpo);

        Equipamento equipamento = buscarEquipamentoPorId(equipamentoId);

        Modelo3DEquipamentoVinculo vinculo = new Modelo3DEquipamentoVinculo();
        vinculo.setModelo3D(modelo);
        vinculo.setObjectName(objectNameLimpo);
        vinculo.setObjectNameNormalized(objectNameNormalizado);
        vinculo.setEquipamento(equipamento);

        return vinculo;
    }

    private void validarCameraView(CameraViewDTO dto) {
        if (dto == null) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "A configuração da câmera deve ser informada"
            );
        }

        if (dto.position() == null || dto.position().size() != 3) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "A posição da câmera deve possuir exatamente 3 valores"
            );
        }

        if (dto.target() == null || dto.target().size() != 3) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "O target da câmera deve possuir exatamente 3 valores"
            );
        }
    }

    private String validarObjectName(String objectName) {
        if (objectName == null || objectName.isBlank()) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "O nome do objeto 3D deve ser informado"
            );
        }

        String objectNameLimpo = objectName.trim();

        if (!objectNameLimpo.toUpperCase(Locale.ROOT).startsWith("EQP_")) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "Somente objetos 3D iniciados com EQP_ podem ser vinculados a equipamentos"
            );
        }

        return objectNameLimpo;
    }

    private String normalizarObjectName(String objectName) {
        return objectName.trim().toUpperCase(Locale.ROOT);
    }

    /*
     * Record usado pelo controller para retornar o arquivo físico com seus metadados.
     */
    public record ArquivoModelo3DResource(
            Resource resource,
            String contentType,
            String fileName
    ) {
    }
}