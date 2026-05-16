package com.unisal.predictdt.mapper;

import com.unisal.predictdt.dto.alertaAnomalia.AlertaAnomaliaResponseDTO;
import com.unisal.predictdt.entity.AlertaAnomalia;

public class AlertaAnomaliaMapper {

    public static AlertaAnomaliaResponseDTO toResponse(AlertaAnomalia entity) {
        if (entity == null) {
            return null;
        }

        return new AlertaAnomaliaResponseDTO(
                entity.getId(),

                entity.getSensor() != null ? entity.getSensor().getId() : null,
                entity.getSensor() != null ? entity.getSensor().getDescricao() : null,

                entity.getEquipamento() != null ? entity.getEquipamento().getId() : null,
                entity.getEquipamento() != null ? entity.getEquipamento().getDescricao() : null,

                entity.getMedida(),

                entity.getMediaReferencia(),
                entity.getDesvioPadraoReferencia(),
                entity.getLimiteMinReferencia(),
                entity.getLimiteMaxReferencia(),
                entity.getScoreDesvio(),

                entity.getTipoAnomalia() != null ? entity.getTipoAnomalia().name() : null,
                entity.getSeveridade() != null ? entity.getSeveridade().name() : null,
                entity.getStatusAlerta() != null ? entity.getStatusAlerta().name() : null,

                entity.getDescricao(),

                entity.getDtOcorrencia(),
                entity.getDtReconhecimento(),
                entity.getDtResolucao()
        );
    }
}