package com.unisal.predictdt.service;

import com.unisal.predictdt.dto.sensor_equipamento.SensorEquipamentoRequestDTO;
import com.unisal.predictdt.dto.sensor_equipamento.SensorEquipamentoResponseDTO;
import com.unisal.predictdt.entity.Equipamento;
import com.unisal.predictdt.entity.Sensor;
import com.unisal.predictdt.entity.SensorEquipamento;
import com.unisal.predictdt.exception.BusinessException;
import com.unisal.predictdt.mapper.SensorEquipamentoMapper;
import com.unisal.predictdt.repository.EquipamentoRepository;
import com.unisal.predictdt.repository.SensorEquipamentoRepository;
import com.unisal.predictdt.repository.SensorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SensorEquipamentoService {

    private final SensorEquipamentoRepository sensorEquipamentoRepository;
    private final SensorRepository sensorRepository;
    private final EquipamentoRepository equipamentoRepository;

    //Vinculando sensor a equipamento
    public SensorEquipamentoResponseDTO vincularSensorEquipamento(SensorEquipamentoRequestDTO dto) {
        // Busca sensor e equipamento pelo ID
        Sensor sensor = buscarSensorById(dto.idSensor());
        Equipamento equipamento = buscarEquipamentoById(dto.idEquipamento());

        // Valida se já existe o vínculo
        if (sensorEquipamentoRepository.existsBySensorIdAndEquipamentoId(dto.idSensor(), dto.idEquipamento())) {
            throw new BusinessException("Sensor já vinculado a este equipamento");
        }

        SensorEquipamento entity = SensorEquipamentoMapper.toEntity(dto, sensor, equipamento);
        SensorEquipamento saved = sensorEquipamentoRepository.save(entity);
        return SensorEquipamentoMapper.toResponse(saved);
    }

    // Coleta todos os vínculos
    public Page<SensorEquipamentoResponseDTO> getAllSensorEquipamento(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<SensorEquipamento> result = sensorEquipamentoRepository.findAll(pageable);

        if (result.isEmpty()) {
            throw new BusinessException(HttpStatus.NO_CONTENT, "Nenhum vinculo de sensor/equipamento cadastrado");
        }

        return result.map(SensorEquipamentoMapper::toResponse);
    }

    // Coleta vínculo pelo ID
    public SensorEquipamentoResponseDTO getSensorEquipamentoByID(UUID id){
        SensorEquipamento entity = buscarVinculo(id);
        return SensorEquipamentoMapper.toResponse(entity);
    }

    // Deleta vínculo
    public void deletarVinculo(UUID id){
        SensorEquipamento entity = buscarVinculo(id);
        sensorEquipamentoRepository.delete(entity);
    }

    private SensorEquipamento buscarVinculo(UUID id){
        return sensorEquipamentoRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Vínculo Sensor/Equipamento não encontrado"));
    }

    private Sensor buscarSensorById(UUID idSensor) {
        return sensorRepository.findById(idSensor)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Sensor não encontrado"));
    }

    private Equipamento buscarEquipamentoById(UUID idEquipamento) {
        return equipamentoRepository.findById(idEquipamento)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Equipamento não encontrado"));
    }
}
