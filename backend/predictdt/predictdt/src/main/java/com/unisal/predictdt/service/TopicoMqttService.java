package com.unisal.predictdt.service;

import com.unisal.predictdt.dto.topico_mqtt.TopicoMqttRequestDTO;
import com.unisal.predictdt.dto.topico_mqtt.TopicoMqttResponseDTO;
import com.unisal.predictdt.dto.topico_mqtt.TopicoMqttUpdateDTO;
import com.unisal.predictdt.entity.TopicoMqtt;
import com.unisal.predictdt.exception.BusinessException;
import com.unisal.predictdt.mapper.TopicoMqttMapper;
import com.unisal.predictdt.repository.TopicoMqttRepository;
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
public class TopicoMqttService {

    private final TopicoMqttRepository repository;

    // Cadastrando TopicoMqtt
    public TopicoMqttResponseDTO criarTopicoMqtt(TopicoMqttRequestDTO dto) {
        String descricao = limparDescricao(dto.descricao());
        validarDescricao(descricao);

        // Valida duplicidade
        if (repository.findByDescricao(descricao).isPresent()) {
            throw new BusinessException("Descrição já cadastrada");
        }

        TopicoMqtt entity = TopicoMqttMapper.toEntity(dto);
        entity.setDescricao(descricao);

        // Se inativo, registra data de bloqueio
        if (dto.ativo() != null && !dto.ativo()) {
            entity.setDtBloqueio(LocalDateTime.now());
        }

        TopicoMqtt saved = repository.save(entity);
        return TopicoMqttMapper.toResponse(saved);
    }

    // Buscando tudo da tabela TopicoMqtt
    public Page<TopicoMqttResponseDTO> getTopicosMqtt(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<TopicoMqtt> result = repository.findAll(pageable);

        if (result.isEmpty()) {
            throw new BusinessException(HttpStatus.NO_CONTENT, "Nenhum tópico MQTT cadastrado");
        }

        return result.map(TopicoMqttMapper::toResponse);
    }

    // Buscando TopicoMqtt por ID
    public TopicoMqttResponseDTO getTopicoMqttById(UUID id) {
        TopicoMqtt entity = buscarTopicoMqttPorId(id);
        return TopicoMqttMapper.toResponse(entity);
    }

    // Altera TopicoMqtt por ID
    public TopicoMqttResponseDTO putTopicoMqtt(UUID id, TopicoMqttUpdateDTO dto) {
        TopicoMqtt entity = buscarTopicoMqttPorId(id);
        LocalDateTime now = LocalDateTime.now();

        // Se nada mudou, retorna sem processar
        if ((dto.descricao() == null || dto.descricao().equals(entity.getDescricao())) &&
                (dto.ativo() == null || dto.ativo().equals(entity.getAtivo()))) {
            return TopicoMqttMapper.toResponse(entity);
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

        TopicoMqtt saved = repository.save(entity);
        return TopicoMqttMapper.toResponse(saved);
    }

    // Delete TopicoMqtt
    public void deletarTopicoMqtt(UUID id) {
        TopicoMqtt entity = buscarTopicoMqttPorId(id);
        repository.delete(entity);
    }

    private TopicoMqtt buscarTopicoMqttPorId(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Tópico MQTT não encontrado"));
    }

    private String limparDescricao(String descricao) {
        return descricao.toLowerCase().trim();
    }

    private void validarDescricao(String descricao) {
        if (!descricao.matches("[a-zA-Z0-9À-ÿ/\\s]+")) {
            throw new BusinessException("A descrição contém caracteres especiais não permitidos");
        }

        if (!Character.isLetterOrDigit(descricao.charAt(0)) ||
                !Character.isLetterOrDigit(descricao.charAt(descricao.length() - 1))) {
            throw new BusinessException("A descrição não pode começar ou terminar com caractere especial");
        }
    }
}