package com.unisal.predictdt.service;

import com.unisal.predictdt.dto.grandezaMedida.GrandezaMedidaResponseDTO;
import com.unisal.predictdt.mapper.GrandezaMedidaMapper;
import com.unisal.predictdt.repository.GrandezaMedidaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GrandezaMedidaService {

    private final GrandezaMedidaRepository grandezaMedidaRepository;

    /*
     * Lista as grandezas ativas cadastradas no sistema.
     *
     * Esse endpoint será consumido pelo frontend para montar o dropdown
     * no cadastro de sensores.
     */
    @Transactional(readOnly = true)
    public List<GrandezaMedidaResponseDTO> listarAtivas() {
        return grandezaMedidaRepository.findAll()
                .stream()
                .filter(grandeza -> Boolean.TRUE.equals(grandeza.getAtivo()))
                .map(GrandezaMedidaMapper::toResponse)
                .toList();
    }
}