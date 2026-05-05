package com.unisal.predictdt.mapper;

import com.unisal.predictdt.dto.equipamento.EquipamentoRequestDTO;
import com.unisal.predictdt.dto.equipamento.EquipamentoResponseDTO;
import com.unisal.predictdt.entity.Equipamento;

public class EquipamentoMapper {

    public static Equipamento toEntity(EquipamentoRequestDTO dto){
        Equipamento entity = new Equipamento();
        entity.setDescricao(dto.descricao());
        entity.setAtivo(dto.ativo() != null ? dto.ativo() : true);
        return entity;
    }

    public static EquipamentoResponseDTO toResponse(Equipamento entity){
        return new EquipamentoResponseDTO(
                entity.getId(),
                entity.getDescricao(),
                entity.getAtivo(),
                entity.getDtInclusao()
        );
    }
}
