package com.unisal.predictdt.analysis.baseline;

import com.unisal.predictdt.analysis.baseline.projection.BaselineCalculoProjection;
import com.unisal.predictdt.entity.Sensor;
import com.unisal.predictdt.entity.SensorBaseline;
import com.unisal.predictdt.entity.enums.MetodoBaseline;
import com.unisal.predictdt.entity.enums.StatusBaseline;
import com.unisal.predictdt.entity.enums.TipoJanelaBaseline;
import com.unisal.predictdt.repository.LogMedidaRepository;
import com.unisal.predictdt.repository.SensorBaselineRepository;
import com.unisal.predictdt.repository.SensorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BaselineService {

    /*
     * Fator usado para calcular a faixa considerada normal.
     *
     * Exemplo:
     * limite mínimo = média - (2 * desvio padrão)
     * limite máximo = média + (2 * desvio padrão)
     *
     * Quanto maior o fator, mais tolerante o sistema fica.
     * Quanto menor o fator, mais sensível ele fica para detectar variações.
     */
    private static final double FATOR_DESVIO = 2.0;

    /*
     * Quantidade mínima de leituras exigidas para calcular um baseline.
     *
     * Em desenvolvimento, o valor está baixo para facilitar testes.
     * Em produção, esse valor deve ser maior para evitar gerar padrões
     * com pouca amostragem e baixa confiabilidade estatística.
     */
    private static final int MINIMO_AMOSTRAS = 2;

    private final LogMedidaRepository logMedidaRepository;
    private final SensorRepository sensorRepository;
    private final SensorBaselineRepository sensorBaselineRepository;

    /*
     * Executa o cálculo automático do baseline D7.
     *
     * initialDelay = 10000:
     * aguarda 10 segundos após a aplicação iniciar antes da primeira execução.
     *
     * fixedDelay = 3600000:
     * executa novamente 1 hora após a finalização da execução anterior.
     *
     * A anotação @Transactional garante que as alterações feitas no baseline
     * sejam persistidas de forma consistente. Se ocorrer erro durante o processo,
     * a transação é revertida.
     */
    @Scheduled(initialDelay = 10000, fixedDelay = 3600000)
    @Transactional
    public void recalcularBaselineD7() {
        log.info("Iniciando cálculo da baseline D7");

        /*
         * Define a janela de análise.
         *
         * Neste primeiro momento, o baseline principal é calculado com base
         * nas medições dos últimos 7 dias.
         */
        OffsetDateTime janelaFim = OffsetDateTime.now();
        OffsetDateTime janelaInicio = janelaFim.minusDays(7);

        /*
         * Executa a query estatística na tabela log_medida.
         *
         * A query agrupa as leituras por sensor e calcula:
         * - média;
         * - desvio padrão;
         * - menor valor observado;
         * - maior valor observado;
         * - quantidade de amostras.
         */
        List<BaselineCalculoProjection> calculos =
                logMedidaRepository.calcularBaselinePorJanela(
                        janelaInicio,
                        janelaFim,
                        MINIMO_AMOSTRAS
                );

        log.info("Foram encontrados {} sensores com dados suficientes para baseline", calculos.size());

        /*
         * Para cada sensor com dados suficientes, o sistema cria um novo baseline
         * candidato e decide se ele pode virar o baseline ativo.
         */
        for (BaselineCalculoProjection calculo : calculos) {
            processarBaselineDoSensor(calculo, janelaInicio, janelaFim);
        }

        log.info("Cálculo de baseline D7 finalizado");
    }

    /*
     * Processa o baseline de um sensor específico.
     *
     * Primeiro localiza o sensor no banco, depois monta um baseline candidato.
     * Se já existir um baseline ativo para esse sensor e janela D7, o novo
     * candidato é validado contra o padrão anterior.
     *
     * Se ainda não existir baseline ativo, o sistema considera esse como
     * o primeiro padrão aprendido do sensor.
     */
    private void processarBaselineDoSensor(
            BaselineCalculoProjection calculo,
            OffsetDateTime janelaInicio,
            OffsetDateTime janelaFim
    ) {
        Sensor sensor = sensorRepository.findById(calculo.getSensorId())
                .orElseThrow(() -> new RuntimeException(
                        "Sensor não encontrado para cálculo de baseline: " + calculo.getSensorId()
                ));

        SensorBaseline novoBaseline = montarBaselineCandidato(sensor, calculo, janelaInicio, janelaFim);

        sensorBaselineRepository.findBySensor_IdAndTipoJanelaAndAtivoTrue(
                sensor.getId(),
                TipoJanelaBaseline.D7
        ).ifPresentOrElse(
                baselineAtivo -> validarContraBaselineAtivo(novoBaseline, baselineAtivo),
                () -> ativarPrimeiroBaseline(novoBaseline)
        );
    }

    /*
     * Monta um baseline candidato a partir dos cálculos estatísticos retornados
     * pela query da log_medida.
     *
     * Neste ponto, o baseline ainda não é considerado confiável.
     * Ele nasce como CANDIDATO e ativo = false.
     *
     * A promoção para ATIVO acontece apenas depois da validação.
     */
    private SensorBaseline montarBaselineCandidato(
            Sensor sensor,
            BaselineCalculoProjection calculo,
            OffsetDateTime janelaInicio,
            OffsetDateTime janelaFim
    ) {
        double media = calculo.getMedia();
        double desvioPadrao = calculo.getDesvioPadrao() == null ? 0.0 : calculo.getDesvioPadrao();

        double limiteMin = media - (FATOR_DESVIO * desvioPadrao);
        double limiteMax = media + (FATOR_DESVIO * desvioPadrao);

        SensorBaseline baseline = new SensorBaseline();

        baseline.setSensor(sensor);
        baseline.setMedia(media);
        baseline.setDesvioPadrao(desvioPadrao);
        baseline.setLimiteMin(limiteMin);
        baseline.setLimiteMax(limiteMax);

        baseline.setValorMinimoObservado(calculo.getValorMinimoObservado());
        baseline.setValorMaximoObservado(calculo.getValorMaximoObservado());

        baseline.setFatorDesvio(FATOR_DESVIO);

        baseline.setJanelaInicio(janelaInicio);
        baseline.setJanelaFim(janelaFim);
        baseline.setTipoJanela(TipoJanelaBaseline.D7);

        baseline.setQtdAmostras(Math.toIntExact(calculo.getQtdAmostras()));

        baseline.setMetodo(MetodoBaseline.MEDIA_DESVIO_PADRAO);
        baseline.setStatus(StatusBaseline.CANDIDATO);
        baseline.setAtivo(false);

        baseline.setMotivoStatus("Baseline calculado a partir das medições dos últimos 7 dias.");

        return baseline;
    }

    /*
     * Valida um novo baseline comparando sua média com o baseline ativo anterior.
     *
     * Essa regra evita que o sistema aprenda automaticamente um comportamento ruim.
     *
     * Exemplo:
     * Se o motor passou uma semana operando com vibração anormal, a média nova
     * pode ficar muito alta. Nesse caso, o sistema não deve transformar essa
     * nova média em padrão normal.
     */
    private void validarContraBaselineAtivo(
            SensorBaseline novoBaseline,
            SensorBaseline baselineAtivo
    ) {
        boolean mediaDentroDoPadraoAtual =
                novoBaseline.getMedia() >= baselineAtivo.getLimiteMin()
                        && novoBaseline.getMedia() <= baselineAtivo.getLimiteMax();

        if (mediaDentroDoPadraoAtual) {
            /*
             * Primeiro desativa o baseline antigo.
             *
             * O saveAndFlush é importante aqui porque existe uma constraint no banco
             * permitindo apenas um baseline ativo por sensor e tipo de janela.
             *
             * Sem o flush, o Hibernate pode tentar inserir o novo baseline ativo
             * antes de enviar o UPDATE que desativa o baseline anterior.
             */
            baselineAtivo.setAtivo(false);
            baselineAtivo.setStatus(StatusBaseline.HISTORICO);
            baselineAtivo.setMotivoStatus("Substituído por um novo baseline compatível com o padrão anterior.");

            sensorBaselineRepository.saveAndFlush(baselineAtivo);

            /*
             * Depois que o banco já sabe que o baseline anterior não está mais ativo,
             * o novo baseline pode ser promovido para ATIVO com segurança.
             */
            novoBaseline.setAtivo(true);
            novoBaseline.setStatus(StatusBaseline.ATIVO);
            novoBaseline.setMotivoStatus("Baseline aprovado e promovido para ativo.");

            sensorBaselineRepository.save(novoBaseline);

            log.info(
                    "Novo baseline D7 ATIVO para sensor {}. Média: {}",
                    novoBaseline.getSensor().getId(),
                    novoBaseline.getMedia()
            );
        } else {
            /*
             * Quando a média nova foge dos limites do baseline anterior,
             * o sistema marca o resultado como SUSPEITO.
             *
             * Isso impede que um período possivelmente anormal seja aprendido
             * como novo comportamento normal do sensor.
             */
            novoBaseline.setAtivo(false);
            novoBaseline.setStatus(StatusBaseline.SUSPEITO);
            novoBaseline.setMotivoStatus(
                    "Média do novo baseline ficou fora dos limites do baseline ativo anterior. " +
                            "Não foi promovido para evitar aprender possível falha como comportamento normal."
            );

            sensorBaselineRepository.save(novoBaseline);

            log.warn(
                    "Baseline D7 SUSPEITO para sensor {}. Média nova: {}, limite anterior: {} até {}",
                    novoBaseline.getSensor().getId(),
                    novoBaseline.getMedia(),
                    baselineAtivo.getLimiteMin(),
                    baselineAtivo.getLimiteMax()
            );
        }
    }

    /*
     * Ativa o primeiro baseline de um sensor.
     *
     * Essa situação acontece quando ainda não existe nenhum baseline ativo
     * para o sensor e para a janela D7.
     *
     * Como não há padrão anterior para comparar, o primeiro baseline calculado
     * é promovido para ATIVO e passa a representar o comportamento inicial
     * aprendido pelo sistema.
     */
    private void ativarPrimeiroBaseline(SensorBaseline novoBaseline) {
        novoBaseline.setAtivo(true);
        novoBaseline.setStatus(StatusBaseline.ATIVO);
        novoBaseline.setMotivoStatus("Primeiro baseline ativo criado para o sensor.");

        sensorBaselineRepository.save(novoBaseline);

        log.info(
                "Primeiro baseline D7 ATIVO criado para sensor {}. Média: {}",
                novoBaseline.getSensor().getId(),
                novoBaseline.getMedia()
        );
    }
}