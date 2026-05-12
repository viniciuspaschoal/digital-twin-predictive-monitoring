package com.unisal.predictdt.service;

import com.unisal.predictdt.dto.tipoEquipamento.TipoEquipamentoResponseDTO;
import com.unisal.predictdt.mapper.TipoEquipamentoMapper;
import com.unisal.predictdt.repository.TipoEquipamentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TipoEquipamentoService {

    private final TipoEquipamentoRepository tipoEquipamentoRepository;

    /**
     * Lista os tipos de equipamento ativos cadastrados no sistema.
     *
     * Esse método será usado pelo frontend para carregar o dropdown
     * no cadastro de equipamentos.
     *
     * Exemplos de tipos:
     * - BOMBA
     * - MOTOR
     * - TORNO
     * - COMPRESSOR
     */
    @Transactional(readOnly = true)
    public List<TipoEquipamentoResponseDTO> listarAtivos() {
        return tipoEquipamentoRepository.findAll()
                .stream()
                .filter(tipo -> Boolean.TRUE.equals(tipo.getAtivo()))
                .map(TipoEquipamentoMapper::toResponse)
                .toList();
    }
}