package com.unisal.predictdt.service;

import com.unisal.predictdt.dto.logMedida.LogMedidaRequestDTO;
import com.unisal.predictdt.dto.logMedida.LogMedidaResponseDTO;
import com.unisal.predictdt.entity.LogMedida;
import com.unisal.predictdt.entity.Sensor;
import com.unisal.predictdt.mapper.LogMedidaMapper;
import com.unisal.predictdt.repository.LogMedidaRepository;
import com.unisal.predictdt.repository.SensorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class LogMedidaService {
    //Injetar os repositorios para poder acessar o banco
    @Autowired
    private LogMedidaRepository logMedidaRepository;

    @Autowired
    private SensorRepository sensorRepository;

    @Transactional // Isso garante que, se der erro no meio, ele não salva nada pela metade
    public LogMedidaResponseDTO salvar(LogMedidaRequestDTO dto){

        // 1. O CONFERENTE: Precisamos do objeto Sensor completo para o Mapper
        // Buscamos pelo ID que veio do Python (dto.sensorId())
        Sensor sensor = sensorRepository.findById(dto.sensorId())
                .orElseThrow(() -> new RuntimeException("Erro: Sensor com ID " + dto.sensorId() + " não existe no banco!"));

        //Chamamos o Mapper para transformar o DTO em Entity
        // Passa o pacote (dto) e o sensor que acabaamos de mandar
        LogMedida entity = LogMedidaMapper.toEntity(dto, sensor);

        //Salva a entidade no banco de dados
        LogMedida salvar = logMedidaRepository.save(entity);

        return LogMedidaMapper.toResponse(salvar);
    }

    public List<LogMedidaResponseDTO> buscarTodos() {
        // 1. O Service pede para o Repository buscar TUDO o que está na Hypertable (TimescaleDB)
        List<LogMedida> logs = logMedidaRepository.findAll();

        // 2. Usamos Stream para converter a lista de Entidades em uma lista de DTOs
        // O Mapper entra aqui novamente para garantir que a arquitetura não seja quebrada
        return logs.stream()
                .map(LogMedidaMapper::toResponse)
                .collect(Collectors.toList());
    }
}
