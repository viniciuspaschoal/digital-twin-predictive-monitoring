package com.unisal.predictdt.service;

import com.unisal.predictdt.dto.equipamento.EquipamentoRequestDTO;
import com.unisal.predictdt.dto.equipamento.EquipamentoResponseDTO;
import com.unisal.predictdt.dto.equipamento.EquipamentoUpdateDTO;
import com.unisal.predictdt.entity.Equipamento;
import com.unisal.predictdt.entity.TipoEquipamento;
import com.unisal.predictdt.exception.BusinessException;
import com.unisal.predictdt.mapper.EquipamentoMapper;
import com.unisal.predictdt.repository.EquipamentoRepository;
import com.unisal.predictdt.repository.TipoEquipamentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EquipamentoService {

    private final EquipamentoRepository repository;
    private final TipoEquipamentoRepository tipoEquipamentoRepository;

    /*
     * Cadastra um novo equipamento.
     *
     * O equipamento pode ser associado a um TipoEquipamento, como BOMBA,
     * MOTOR, TORNO ou COMPRESSOR. Essa associação dá contexto técnico
     * para os alertas e para a IA generativa.
     */
    @Transactional
    public EquipamentoResponseDTO criarEquipamento(EquipamentoRequestDTO dto) {
        String descricao = limparDescricao(dto.descricao());
        validarDescricao(descricao);

        if (repository.findByDescricao(descricao).isPresent()) {
            throw new BusinessException("Descrição já cadastrada");
        }

        TipoEquipamento tipoEquipamento = buscarTipoEquipamentoOpcional(dto.tipoEquipamentoId());

        Equipamento entity = EquipamentoMapper.toEntity(dto, tipoEquipamento);
        entity.setDescricao(descricao);

        if (dto.ativo() != null && !dto.ativo()) {
            entity.setDtBloqueio(LocalDateTime.now());
        }

        Equipamento saved = repository.save(entity);
        return EquipamentoMapper.toResponse(saved);
    }

    /*
     * Lista equipamentos com paginação.
     *
     * A transação readOnly mantém o contexto de persistência aberto durante
     * o mapeamento para DTO, permitindo acessar o tipoEquipamento associado.
     */
    @Transactional(readOnly = true)
    public Page<EquipamentoResponseDTO> getEquipamentos(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Equipamento> result = repository.findAll(pageable);

        if (result.isEmpty()) {
            throw new BusinessException(HttpStatus.NO_CONTENT, "Nenhum equipamento cadastrado");
        }

        return result.map(EquipamentoMapper::toResponse);
    }

    /*
     * Busca equipamento por ID.
     */
    @Transactional(readOnly = true)
    public EquipamentoResponseDTO getEquipamentoByID(UUID id) {
        Equipamento entity = buscarEquipamentoPorId(id);
        return EquipamentoMapper.toResponse(entity);
    }

    /*
     * Atualiza dados básicos do equipamento.
     *
     * Nesta etapa, o update mantém o comportamento já existente:
     * atualização de descrição e status.
     */
    @Transactional
    public EquipamentoResponseDTO putEquipamentoByID(UUID id, EquipamentoUpdateDTO dto) {
        Equipamento entity = buscarEquipamentoPorId(id);
        LocalDateTime now = LocalDateTime.now();

        if ((dto.descricao() == null || dto.descricao().equals(entity.getDescricao())) &&
                (dto.ativo() == null || dto.ativo().equals(entity.getAtivo()))) {
            return EquipamentoMapper.toResponse(entity);
        }

        if (dto.descricao() != null && !dto.descricao().equals(entity.getDescricao())) {
            String descricao = limparDescricao(dto.descricao());
            validarDescricao(descricao);

            if (repository.findByDescricao(descricao).isPresent()) {
                throw new BusinessException("Descrição já cadastrada");
            }

            entity.setDescricao(descricao);
        }

        if (dto.ativo() != null && !dto.ativo().equals(entity.getAtivo())) {
            entity.setAtivo(dto.ativo());
            entity.setDtBloqueio(!dto.ativo() ? now : null);
        }

        entity.setDtAlteracao(now);

        Equipamento saved = repository.save(entity);
        return EquipamentoMapper.toResponse(saved);
    }

    /*
     * Remove equipamento do banco.
     */
    @Transactional
    public void deletarEquipamento(UUID id) {
        Equipamento entity = buscarEquipamentoPorId(id);
        repository.delete(entity);
    }

    private Equipamento buscarEquipamentoPorId(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Equipamento não encontrado"));
    }

    private TipoEquipamento buscarTipoEquipamentoOpcional(UUID tipoEquipamentoId) {
        if (tipoEquipamentoId == null) {
            return null;
        }

        return tipoEquipamentoRepository.findById(tipoEquipamentoId)
                .orElseThrow(() -> new BusinessException(
                        HttpStatus.NOT_FOUND,
                        "Tipo de equipamento não encontrado"
                ));
    }

    private String limparDescricao(String descricao) {
        return descricao.toLowerCase().trim();
    }

    private void validarDescricao(String descricao) {
        if (!descricao.matches("[a-zA-Z0-9À-ÿ\\-_\\s]+")) {
            throw new BusinessException("A descrição contém caracteres especiais não permitidos. São permitidos apenas: - e _");
        }
    }
}