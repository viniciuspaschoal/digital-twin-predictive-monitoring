package com.unisal.predictdt.repository;

import com.unisal.predictdt.entity.AlertaAnomaliaExplicacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AlertaAnomaliaExplicacaoRepository extends JpaRepository<AlertaAnomaliaExplicacao, UUID> {

    /*
     * Busca a explicação já gerada para um alerta específico.
     *
     * Como o banco possui uma constraint única por alerta_anomalia_id,
     * este método retorna no máximo uma explicação.
     */

    Optional<AlertaAnomaliaExplicacao> findByAlertaAnomalia_Id(UUID alertaAnomaliaId);

    /*
     * Verifica se já existe explicação persistida para o alerta.
     *
     * Útil para evitar chamadas repetidas à API Gemini.
     */
    boolean existsByAlertaAnomalia_Id(UUID alertaAnomaliaId);
}
