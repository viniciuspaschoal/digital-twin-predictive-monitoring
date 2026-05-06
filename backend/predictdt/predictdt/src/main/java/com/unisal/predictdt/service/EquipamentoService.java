package com.unisal.predictdt.service;

import com.unisal.predictdt.dto.equipamento.EquipamentoRequestDTO;
import com.unisal.predictdt.dto.equipamento.EquipamentoResponseDTO;
import com.unisal.predictdt.dto.equipamento.EquipamentoUpdateDTO;
import com.unisal.predictdt.entity.Equipamento;
import com.unisal.predictdt.exception.BusinessException;
import com.unisal.predictdt.mapper.EquipamentoMapper;
import com.unisal.predictdt.repository.EquipamentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EquipamentoService {

    private final EquipamentoRepository repository;

    // Cadastrando Equipamento
    public EquipamentoResponseDTO criarEquipamento(EquipamentoRequestDTO dto) {
        String descricao = limparDescricao(dto.descricao());
        validarDescricao(descricao);

        // Valida duplicidade
        if (repository.findByDescricao(descricao).isPresent()) {
            throw new BusinessException("Descrição já cadastrada");
        }

        Equipamento entity = EquipamentoMapper.toEntity(dto);
        entity.setDescricao(descricao);

        // Se inativo, registra data de bloqueio
        if (dto.ativo() != null && !dto.ativo()) {
            entity.setDtBloqueio(LocalDateTime.now());
        }

        Equipamento saved = repository.save(entity);
        return EquipamentoMapper.toResponse(saved);
    }

    // Buscando tudo da tabela Equipamento
    public Page<EquipamentoResponseDTO> getEquipamentos(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Equipamento> result = repository.findAll(pageable);

        if (result.isEmpty()) {
            throw new BusinessException(HttpStatus.NO_CONTENT, "Nenhum equipamento cadastrado");
        }

        return result.map(EquipamentoMapper::toResponse);
    }

    // Buscando Equipamento por ID
    public EquipamentoResponseDTO getEquipamentoByID(UUID id) {
        Equipamento entity = buscarEquipamentoPorId(id);
        return EquipamentoMapper.toResponse(entity);
    }

    // Altera equipamento por ID
    public EquipamentoResponseDTO putEquipamentoByID(UUID id, EquipamentoUpdateDTO dto) {
        Equipamento entity = buscarEquipamentoPorId(id);
        LocalDateTime now = LocalDateTime.now();

        // Se nada mudou, retorna sem processar
        if ((dto.descricao() == null || dto.descricao().equals(entity.getDescricao())) &&
                (dto.ativo() == null || dto.ativo().equals(entity.getAtivo()))) {
            return EquipamentoMapper.toResponse(entity);
        }

        // Atualiza descrição se fornecida e diferente da atual
        if (dto.descricao() != null && !dto.descricao().equals(entity.getDescricao())) {
            String descricao = limparDescricao(dto.descricao());
            validarDescricao(descricao);

            if (repository.findByDescricao(descricao).isPresent()) {
                throw new BusinessException("Descrição já cadastrada");
            }

            entity.setDescricao(descricao);
        }

        // Atualiza status e registra/remove data de bloqueio
        if (dto.ativo() != null && !dto.ativo().equals(entity.getAtivo())) {
            entity.setAtivo(dto.ativo());
            entity.setDtBloqueio(!dto.ativo() ? now : null);
        }

        // Registra data de alteração
        entity.setDtAlteracao(now);

        Equipamento saved = repository.save(entity);
        return EquipamentoMapper.toResponse(saved);
    }

    // Deleta Equipamento por ID
    public void deletarEquipamento(UUID id) {
        Equipamento entity = buscarEquipamentoPorId(id);
        repository.delete(entity);
    }

    private Equipamento buscarEquipamentoPorId(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Equipamento não encontrado"));
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