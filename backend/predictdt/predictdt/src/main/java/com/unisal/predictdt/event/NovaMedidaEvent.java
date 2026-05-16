package com.unisal.predictdt.event;


import com.unisal.predictdt.entity.LogMedidaId;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Evento interno publicado após uma nova medição ser salva em log_medida.
 *
 * Esse evento não executa análise por conta própria.
 * Ele apenas transporta a identificação da medição recém-persistida para que
 * outro componente, como o AnomalyDetectionService, possa processá-la em background.
 *
 * A medição é identificada por chave composta:
 * - id
 * - dtMedida
 *
 * Essa estrutura segue a chave primária da tabela log_medida no TimescaleDB.
 */
public record NovaMedidaEvent (
        UUID id,
        OffsetDateTime dtMedida
){
    /**
     * Construtor de conveniência para criar o evento a partir da chave composta da medição.
     */
    public NovaMedidaEvent(LogMedidaId logMedidaId) {
        this(
                logMedidaId.getId(),
                logMedidaId.getDtMedida()
        );
    }

    /**
     * Reconstrói o LogMedidaId a partir dos dados transportados pelo evento.
     *
     * Isso será usado depois pelo serviço de detecção para buscar a medição salva
     * diretamente no repository.
     */
    public LogMedidaId toLogMedidaId() {
        LogMedidaId logMedidaId = new LogMedidaId();
        logMedidaId.setId(this.id);
        logMedidaId.setDtMedida(this.dtMedida);
        return logMedidaId;
    }
}
