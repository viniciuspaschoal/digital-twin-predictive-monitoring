package com.unisal.predictdt.mapper;

import com.unisal.predictdt.dto.grandezaMedida.GrandezaMedidaResponseDTO;
import com.unisal.predictdt.entity.GrandezaMedida;

public class GrandezaMedidaMapper {

    public static GrandezaMedidaResponseDTO toResponse(GrandezaMedida entity) {
        if (entity == null) {
            return null;
        }

        return new GrandezaMedidaResponseDTO(
                entity.getId(),
                entity.getDescricao(),
                entity.getUnidadePadrao(),
                entity.getAtivo()
        );
    }
}