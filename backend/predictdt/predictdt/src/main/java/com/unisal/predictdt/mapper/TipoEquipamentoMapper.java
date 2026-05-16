package com.unisal.predictdt.mapper;

import com.unisal.predictdt.dto.tipoEquipamento.TipoEquipamentoResponseDTO;
import com.unisal.predictdt.entity.TipoEquipamento;

public class TipoEquipamentoMapper {

    /**
     * Converte a entity TipoEquipamento em DTO de resposta.
     *
     * O DTO é usado pelo frontend para montar listas de seleção,
     * como o dropdown no cadastro de equipamentos.
     */
    public static TipoEquipamentoResponseDTO toResponse(TipoEquipamento entity) {
        if (entity == null) {
            return null;
        }

        return new TipoEquipamentoResponseDTO(
                entity.getId(),
                entity.getDescricao(),
                entity.getAtivo()
        );
    }
}