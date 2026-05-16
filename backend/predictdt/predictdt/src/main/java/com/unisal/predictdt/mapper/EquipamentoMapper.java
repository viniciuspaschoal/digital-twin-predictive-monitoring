package com.unisal.predictdt.mapper;

import com.unisal.predictdt.dto.equipamento.EquipamentoRequestDTO;
import com.unisal.predictdt.dto.equipamento.EquipamentoResponseDTO;
import com.unisal.predictdt.entity.Equipamento;
import com.unisal.predictdt.entity.TipoEquipamento;

public class EquipamentoMapper {

    public static Equipamento toEntity(
            EquipamentoRequestDTO dto,
            TipoEquipamento tipoEquipamento
    ) {
        Equipamento entity = new Equipamento();

        /*
         * Descrição livre do equipamento.
         *
         * Esse campo continua sendo usado para identificação humana,
         * como "Bomba Linha 01", "Motor Principal" ou "Torno CNC 02".
         */
        entity.setDescricao(dto.descricao());

        /*
         * Status inicial do equipamento.
         *
         * Quando o cliente não informa o status, o equipamento nasce ativo.
         */
        entity.setAtivo(dto.ativo() != null ? dto.ativo() : true);

        /*
         * Tipo operacional estruturado.
         *
         * Diferente da descrição, este campo permite que o sistema entenda
         * tecnicamente qual é a natureza do equipamento monitorado.
         */
        entity.setTipoEquipamento(tipoEquipamento);

        return entity;
    }

    public static EquipamentoResponseDTO toResponse(Equipamento entity) {
        return new EquipamentoResponseDTO(
                entity.getId(),
                entity.getDescricao(),
                entity.getAtivo(),

                entity.getTipoEquipamento() != null
                        ? entity.getTipoEquipamento().getId()
                        : null,

                entity.getTipoEquipamento() != null
                        ? entity.getTipoEquipamento().getDescricao()
                        : null,

                entity.getDtInclusao()
        );
    }
}