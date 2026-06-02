package com.unisal.predictdt.service;

import com.unisal.predictdt.dto.alertaAnomalia.AlertaAnomaliaResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AlertaWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    /*
     * Envia um alerta novo para todos os frontends conectados.
     *
     * O frontend deve escutar o tópico:
     * /topic/alertas
     */

    public void notificarNovoAlerta(AlertaAnomaliaResponseDTO alerta) {
        messagingTemplate.convertAndSend("/topic/alertas", alerta);
    }
}
