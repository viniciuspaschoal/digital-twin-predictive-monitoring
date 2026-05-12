package com.unisal.predictdt.analysis.detection;

import com.unisal.predictdt.entity.AlertaAnomalia;
import com.unisal.predictdt.entity.LogMedida;
import com.unisal.predictdt.entity.SensorBaseline;
import com.unisal.predictdt.entity.enums.SeveridadeAlerta;
import com.unisal.predictdt.entity.enums.TipoAnomalia;
import com.unisal.predictdt.entity.enums.TipoJanelaBaseline;
import com.unisal.predictdt.event.NovaMedidaEvent;
import com.unisal.predictdt.repository.AlertaAnomaliaRepository;
import com.unisal.predictdt.repository.LogMedidaRepository;
import com.unisal.predictdt.repository.SensorBaselineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnomalyDetectionService {

    private final LogMedidaRepository logMedidaRepository;
    private final SensorBaselineRepository sensorBaselineRepository;
    private final AlertaAnomaliaRepository alertaAnomaliaRepository;

    /*
     * Escuta o evento publicado após uma nova medição ser salva.
     *
     * @TransactionalEventListener com phase = AFTER_COMMIT garante que a análise
     * só será executada depois que a transação do salvamento da medição for confirmada.
     *
     * @Async faz com que a análise rode em background, sem bloquear a resposta
     * do endpoint POST /log-medida.
     */

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void analisarNovaMedida(NovaMedidaEvent event){
        log.info(
                "Iniciando análise de anomalia para medição {} em {}",
                event.id(),
                event.dtMedida()
        );

        LogMedida logMedida = logMedidaRepository.findById(event.toLogMedidaId())
                .orElseThrow(() -> new RuntimeException(
                        "Medição não encontrada para análise de anomalia: " + event.id()
                ));

        SensorBaseline baselineAtivo = sensorBaselineRepository
                .findBySensor_IdAndTipoJanelaAndAtivoTrue(
                        logMedida.getSensor().getId(),
                        TipoJanelaBaseline.D7
                ).orElse(null);

        /*
         * Neste primeiro momento, se ainda não existir baseline ativo,
         * apenas registramos no log e não geramos alerta.
         *
         * Futuramente, pode gerar um alerta do tipo SEM_BASELINE se fizer
         * sentido para o dashboard.
         */
        if (baselineAtivo == null){
            log.warn(
                    "Não existe baseline ativo D7 para o sensor {}. Medição não analisada.",
                    logMedida.getSensor().getId()
            );

            return;
        }

        Double medida = logMedida.getMedida();

        boolean abaixoDoPadrao = medida < baselineAtivo.getLimiteMin();
        boolean acimaDoPadrao = medida > baselineAtivo.getLimiteMax();

        if (!abaixoDoPadrao && !acimaDoPadrao){
            log.info(
                    "Medição {} do sensor {} está dentro do baseline D7. Valor: {}",
                    logMedida.getId().getId(),
                    logMedida.getSensor().getId(),
                    medida
            );

            return;
        }

        TipoAnomalia tipoAnomalia = acimaDoPadrao
                ? TipoAnomalia.ACIMA_DO_PADRAO
                : TipoAnomalia.ABAIXO_DO_PADRAO;

        Double scoreDesvio = calcularScoreDesvio(medida, baselineAtivo);
        SeveridadeAlerta severidade = classificarSeveridade(scoreDesvio);

        AlertaAnomalia alerta = montarAlerta(
                logMedida,
                baselineAtivo,
                tipoAnomalia,
                severidade,
                scoreDesvio
        );

        alertaAnomaliaRepository.save(alerta);

        log.warn(
                "Alerta de anomalia gerado. Sensor: {}, medida: {}, limite mínimo: {}, limite máximo: {}, severidade: {}",
                logMedida.getSensor().getId(),
                medida,
                baselineAtivo.getLimiteMin(),
                baselineAtivo.getLimiteMax(),
                severidade
        );
    }

    /*
     * Calcula o quanto a medição se afastou da média do baseline.
     *
     * Fórmula:
     * score = |medida - média| / desvio padrão
     *
     * Quando o desvio padrão é zero, não é possível dividir.
     * Nesse caso, usamos uma regra simples:
     * - se a medida for igual à média, score 0;
     * - se for diferente, score alto para representar desvio relevante.
     */
    private Double calcularScoreDesvio(Double medida, SensorBaseline baseline) {
        double desvioPadrao = baseline.getDesvioPadrao();

        if (desvioPadrao == 0) {
            return medida.equals(baseline.getMedia()) ? 0.0 : 999.0;
        }

        return Math.abs(medida - baseline.getMedia()) / desvioPadrao;
    }

    /*
     * Classifica a severidade do alerta com base no score de desvio.
     *
     * Quanto maior o score, mais distante a medição está do comportamento normal.
     */
    private SeveridadeAlerta classificarSeveridade(Double scoreDesvio) {
        if (scoreDesvio >= 8) {
            return SeveridadeAlerta.CRITICA;
        }

        if (scoreDesvio >= 5) {
            return SeveridadeAlerta.ALTA;
        }

        if (scoreDesvio >= 3) {
            return SeveridadeAlerta.MEDIA;
        }

        return SeveridadeAlerta.BAIXA;
    }

    /*
     * Monta a entidade AlertaAnomalia com uma fotografia do contexto usado
     * na decisão.
     *
     * Mesmo que o baseline mude no futuro, o alerta continua guardando:
     * - medida real;
     * - média usada na comparação;
     * - desvio padrão usado;
     * - limites usados;
     * - score calculado;
     * - baseline de referência.
     */
    private AlertaAnomalia montarAlerta(
            LogMedida logMedida,
            SensorBaseline baseline,
            TipoAnomalia tipoAnomalia,
            SeveridadeAlerta severidade,
            Double scoreDesvio
    ) {
        AlertaAnomalia alerta = new AlertaAnomalia();

        alerta.setSensor(logMedida.getSensor());

        /*
         * Neste primeiro momento, o alerta fica associado apenas ao sensor.
         * Depois podemos expandir para gerar alertas por equipamento vinculado
         * via sensor_equipamento.
         */
        alerta.setEquipamento(null);

        alerta.setLogMedidaId(logMedida.getId().getId());
        alerta.setLogMedidaDtMedida(logMedida.getId().getDtMedida());

        alerta.setSensorBaseline(baseline);

        alerta.setMedida(logMedida.getMedida());

        alerta.setMediaReferencia(baseline.getMedia());
        alerta.setDesvioPadraoReferencia(baseline.getDesvioPadrao());
        alerta.setLimiteMinReferencia(baseline.getLimiteMin());
        alerta.setLimiteMaxReferencia(baseline.getLimiteMax());

        alerta.setScoreDesvio(scoreDesvio);

        alerta.setTipoAnomalia(tipoAnomalia);
        alerta.setSeveridade(severidade);

        alerta.setDtOcorrencia(logMedida.getId().getDtMedida());

        alerta.setDescricao(montarDescricao(logMedida, baseline, tipoAnomalia, severidade, scoreDesvio));

        return alerta;
    }

    private String montarDescricao(
            LogMedida logMedida,
            SensorBaseline baseline,
            TipoAnomalia tipoAnomalia,
            SeveridadeAlerta severidade,
            Double scoreDesvio
    ) {
        return "Anomalia detectada no sensor "
                + logMedida.getSensor().getDescricao()
                + ". Tipo: "
                + tipoAnomalia
                + ". Medida recebida: "
                + logMedida.getMedida()
                + ". Média de referência: "
                + baseline.getMedia()
                + ". Limites esperados: "
                + baseline.getLimiteMin()
                + " até "
                + baseline.getLimiteMax()
                + ". Score de desvio: "
                + scoreDesvio
                + ". Severidade: "
                + severidade
                + ".";

    }
}
