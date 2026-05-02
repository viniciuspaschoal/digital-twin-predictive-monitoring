package com.unisal.predictdt.service;

import com.unisal.predictdt.dto.topico_mqtt.TopicoMqttRequestDTO;
import com.unisal.predictdt.dto.topico_mqtt.TopicoMqttResponseDTO;
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

    public TopicoMqttResponseDTO criarTopicoMqtt (TopicoMqttRequestDTO dto){
        // Limpando campo descrição
        String descricao = dto.descricao().toLowerCase().trim();

        // Valida caracteres permitidos
        if (!descricao.matches("[a-zA-Z0-9À-ÿ/\\s]+")) {
            throw new BusinessException("A descrição contém caracteres especiais não permitidos");
        }

        // Valida primeiro e último caractere
        if (!Character.isLetterOrDigit(descricao.charAt(0)) ||
                !Character.isLetterOrDigit(descricao.charAt(descricao.length() - 1))) {
            throw new BusinessException("A descrição não pode começar ou terminar com caractere especial");
        }

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

    public Page<TopicoMqttResponseDTO> getTopicosMqtt (int page, int size){
        Pageable pageable = PageRequest.of(page, size);
        Page<TopicoMqtt> result = repository.findAll(pageable);

        if (result.isEmpty()) {
            throw new BusinessException(HttpStatus.NO_CONTENT, "Nenhum tópico MQTT cadastrado");
        }

        return result.map(TopicoMqttMapper::toResponse);
    }

    public TopicoMqttResponseDTO getTopicosMqttById(UUID id){
        TopicoMqtt result = repository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Tópico MQTT não encontrado"));

        return TopicoMqttMapper.toResponse(result);
    }
}
