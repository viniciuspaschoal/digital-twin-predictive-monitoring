package com.unisal.predictdt.service;

import com.unisal.predictdt.dto.sensor.SensorRequestDTO;
import com.unisal.predictdt.dto.sensor.SensorResponseDTO;
import com.unisal.predictdt.dto.sensor.SensorUpdateDTO;
import com.unisal.predictdt.entity.Sensor;
import com.unisal.predictdt.entity.TopicoMqtt;
import com.unisal.predictdt.exception.BusinessException;
import com.unisal.predictdt.mapper.SensorMapper;
import com.unisal.predictdt.repository.SensorRepository;
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
public class SensoresService {

    private final SensorRepository sensorRepository;
    private final TopicoMqttRepository topicoMqttRepository;

    // Cadastrando Sensor
    public SensorResponseDTO criarSensor(SensorRequestDTO dto) {
        String descricao = limparDescricao(dto.descricao());
        validarDescricao(descricao);

        // Busca o tópico base usando o ID que veio no DTO
        TopicoMqtt topico = topicoMqttRepository.findById(dto.topicoId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Tópico base não encontrado"));

        // Converte DTO + Tópico em Entity
        Sensor entity = SensorMapper.toEntity(dto, topico);
        entity.setDescricao(descricao);
        entity.setAtivo(true); // Garante que nasce ativo

        //Salva
        Sensor saved = sensorRepository.save(entity);

        // Converte de volta para Response (Aqui o nome deve ser toResponse)
        return SensorMapper.toResponse(saved);
    }

    // 2. Listar Sensores com Paginação
    public Page<SensorResponseDTO> getSensores(int page, int size){
        Pageable pageable = PageRequest.of(page, size);
        Page<Sensor> result = sensorRepository.findAll(pageable);

        if (result.isEmpty()) {
            throw new BusinessException(HttpStatus.NO_CONTENT, "Nenhum sensor cadastrado");
        }

        return result.map(SensorMapper::toResponse);
    }

    // 3. Buscar Sensor por ID
    public SensorResponseDTO getSensorById(UUID id){
        Sensor entity = buscarSensorPorId(id);

        return SensorMapper.toResponse(entity);
    }

    // 4. Atualizar
    public SensorResponseDTO putSensorByID(UUID id, SensorUpdateDTO dto) {
        Sensor entity = buscarSensorPorId(id); // Usa aquele método auxiliar que já temos
        LocalDateTime now = LocalDateTime.now();

        // 1. Atualiza descrição se fornecida e limpa
        if (dto.descricao() != null && !dto.descricao().equals(entity.getDescricao())) {
            String descricao = limparDescricao(dto.descricao());
            validarDescricao(descricao);
            entity.setDescricao(descricao);
        }

        // 2. Atualiza unidade de medida
        if (dto.unidadeMedida() != null) {
            entity.setUnidadeMedida(dto.unidadeMedida());
        }

        // 3. Atualiza tópico auxiliar
        if (dto.topicoAuxiliar() != null) {
            entity.setTopicoAuxiliar(dto.topicoAuxiliar());
        }

        // 4. Atualiza status e gerencia data de bloqueio (Igual ao equipamento!)
        if (dto.ativo() != null && !dto.ativo().equals(entity.getAtivo())) {
            entity.setAtivo(dto.ativo());
            entity.setDtBloqueio(!dto.ativo() ? now : null);
        }

        entity.setDtAlteracao(now);
        Sensor saved = sensorRepository.save(entity);
        return SensorMapper.toResponse(saved);
    }

    // 5. Deletar Sensor
    public void deletarSensor(UUID id){
        Sensor entity = buscarSensorPorId(id);
        sensorRepository.delete(entity);
    }


    // --- MÉTODOS AUXILIARES ---

    private Sensor buscarSensorPorId(UUID id){
        return sensorRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Sensor não encontrado"));
    }

    private String limparDescricao(String descricao){
        return (descricao != null) ? descricao.toLowerCase().trim() : "";
    }

    private void validarDescricao(String descricao) {
        // Permite letras, números, espaços, hífens e underlines
        if (descricao == null || !descricao.matches("[a-zA-Z0-9À-ÿ/\\-_\\s]+")) {
            throw new BusinessException("A descrição contém caracteres especiais não permitidos.");
        }
    }
}
