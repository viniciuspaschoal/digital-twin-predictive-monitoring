package com.unisal.predictdt.service;

import com.unisal.predictdt.dto.alertaContexto.AlertaContextoResponseDTO;
import com.unisal.predictdt.dto.alertaExplicacao.AlertaExplicacaoResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AiExplanationService {

    private final AlertaContextoService alertaContextoService;
    private final GeminiClientService geminiClientService;

    /*
     * Gera uma explicação humanizada para um alerta.
     *
     * A detecção da anomalia já foi feita antes pelo sistema estatístico.
     * Aqui apenas transformamos os dados estruturados em uma explicação
     * mais clara para o usuário final.
     */
    public AlertaExplicacaoResponseDTO gerarExplicacao(UUID alertaId) {
        AlertaContextoResponseDTO contexto = alertaContextoService.montarContexto(alertaId);

        String titulo = montarTitulo(contexto);
        String resumo = montarResumo(contexto);
        List<String> possiveisCausas = montarPossiveisCausas(contexto);
        String riscoOperacional = montarRiscoOperacional(contexto);
        String recomendacaoInicial = montarRecomendacaoInicial(contexto);

        String explicacaoIa;
        String observacao;

        try {
            String prompt = montarPromptGemini(
                    contexto,
                    titulo,
                    resumo,
                    possiveisCausas,
                    riscoOperacional,
                    recomendacaoInicial
            );

            explicacaoIa = geminiClientService.gerarTexto(prompt);
            observacao = "Explicação gerada pela API Gemini com base no contexto estruturado do alerta.";
        } catch (Exception ex) {
            explicacaoIa = resumo + " " + riscoOperacional + " " + recomendacaoInicial;
            observacao = "Gemini indisponível ou não configurado. Explicação local gerada a partir do baseline estatístico e contexto operacional.";
        }

        return new AlertaExplicacaoResponseDTO(
                contexto.alertaId(),
                titulo,
                resumo,
                possiveisCausas,
                riscoOperacional,
                recomendacaoInicial,
                explicacaoIa,
                observacao
        );
    }

    private String montarPromptGemini(
            AlertaContextoResponseDTO contexto,
            String titulo,
            String resumo,
            List<String> possiveisCausas,
            String riscoOperacional,
            String recomendacaoInicial
    ) {
        return """
                Você é um assistente técnico de manutenção industrial.
                
                Explique o alerta abaixo para um operador de forma objetiva, profissional e fácil de entender.
                
                Regras:
                - Não diga que o equipamento certamente vai quebrar.
                - Não invente dados que não foram informados.
                - Use termos como "pode indicar", "pode estar relacionado" e "recomenda-se verificar".
                - A resposta deve ter no máximo 120 palavras.
                - Finalize a resposta com uma recomendação objetiva.
                - Não use markdown.
                
                Dados do alerta:
                Título: %s
                
                Sensor:
                - Descrição: %s
                - Grandeza: %s
                - Unidade medida: %s
                - Unidade padrão: %s
                
                Equipamentos afetados:
                %s
                
                Anomalia:
                - Tipo: %s
                - Severidade: %s
                - Status: %s
                - Medida recebida: %s
                - Média referência: %s
                - Limite mínimo: %s
                - Limite máximo: %s
                - Score de desvio: %s
                
                Resumo técnico calculado pelo sistema:
                %s
                
                Possíveis causas levantadas pelo backend:
                %s
                
                Risco operacional calculado:
                %s
                
                Recomendação inicial:
                %s
                """.formatted(
                titulo,

                contexto.sensor().descricao(),
                contexto.sensor().grandeza(),
                contexto.sensor().unidadeMedida(),
                contexto.sensor().unidadePadrao(),

                montarTextoEquipamentos(contexto),

                contexto.anomalia().tipoAnomalia(),
                contexto.anomalia().severidade(),
                contexto.anomalia().statusAlerta(),
                contexto.anomalia().medida(),
                contexto.anomalia().mediaReferencia(),
                contexto.anomalia().limiteMinReferencia(),
                contexto.anomalia().limiteMaxReferencia(),
                contexto.anomalia().scoreDesvio(),

                resumo,
                possiveisCausas,
                riscoOperacional,
                recomendacaoInicial
        );
    }

    private String montarTextoEquipamentos(AlertaContextoResponseDTO contexto) {
        if (contexto.equipamentosAfetados() == null || contexto.equipamentosAfetados().isEmpty()) {
            return "- Nenhum equipamento vinculado encontrado.";
        }

        StringBuilder builder = new StringBuilder();

        for (AlertaContextoResponseDTO.EquipamentoContextoDTO equipamento : contexto.equipamentosAfetados()) {
            builder.append("- Descrição: ")
                    .append(equipamento.descricao())
                    .append(", Tipo: ")
                    .append(equipamento.tipoEquipamento())
                    .append(", Relação: ")
                    .append(equipamento.tipoRelacao())
                    .append("\n");
        }

        return builder.toString();
    }

    private String montarTitulo(AlertaContextoResponseDTO contexto) {
        String grandeza = valorOuGenerico(contexto.sensor().grandeza(), "medição");
        String severidade = valorOuGenerico(contexto.anomalia().severidade(), "N/A");

        return "Anomalia de " + grandeza.toLowerCase() + " detectada - Severidade " + severidade;
    }

    private String montarResumo(AlertaContextoResponseDTO contexto) {
        String sensor = valorOuGenerico(contexto.sensor().descricao(), "sensor monitorado");
        String grandeza = valorOuGenerico(contexto.sensor().grandeza(), "grandeza monitorada");
        String unidade = valorOuGenerico(contexto.sensor().unidadeMedida(), "");
        String tipoAnomalia = valorOuGenerico(contexto.anomalia().tipoAnomalia(), "FORA_DO_PADRAO");

        return "O sensor \"" + sensor + "\" apresentou uma anomalia do tipo "
                + tipoAnomalia
                + " na grandeza "
                + grandeza
                + ". A medida recebida foi "
                + contexto.anomalia().medida()
                + (unidade.isBlank() ? "" : " " + unidade)
                + ", enquanto o intervalo esperado estava entre "
                + contexto.anomalia().limiteMinReferencia()
                + " e "
                + contexto.anomalia().limiteMaxReferencia()
                + ".";
    }

    private List<String> montarPossiveisCausas(AlertaContextoResponseDTO contexto) {
        List<String> causas = new ArrayList<>();

        String grandeza = contexto.sensor().grandeza();
        String tipoEquipamento = contexto.equipamentosAfetados().isEmpty()
                ? null
                : contexto.equipamentosAfetados().get(0).tipoEquipamento();

        causas.add("Mudança operacional fora do comportamento histórico aprendido.");
        causas.add("Leitura anormal do sensor ou condição momentânea de processo.");

        if ("CORRENTE".equalsIgnoreCase(grandeza)) {
            causas.add("Possível aumento de carga, esforço mecânico elevado ou sobrecarga elétrica.");
        }

        if ("TEMPERATURA".equalsIgnoreCase(grandeza)) {
            causas.add("Possível aquecimento anormal, atrito elevado, falha de refrigeração ou operação acima do esperado.");
        }

        if ("VIBRACAO".equalsIgnoreCase(grandeza)) {
            causas.add("Possível desalinhamento, folga mecânica, desgaste de rolamento ou desbalanceamento.");
        }

        if ("PRESSAO".equalsIgnoreCase(grandeza)) {
            causas.add("Possível restrição, obstrução, válvula parcialmente fechada ou alteração na condição hidráulica/pneumática.");
        }

        if ("VAZAO".equalsIgnoreCase(grandeza)) {
            causas.add("Possível alteração de regime, restrição na linha, variação de pressão ou condição operacional inesperada.");
        }

        if ("BOMBA".equalsIgnoreCase(tipoEquipamento)) {
            causas.add("Em sistemas de bombeamento, a anomalia pode estar relacionada a condição de linha, vazão, pressão ou esforço do conjunto.");
        }

        if ("MOTOR".equalsIgnoreCase(tipoEquipamento)) {
            causas.add("Em motores, a anomalia pode estar relacionada a sobrecarga, aquecimento, atrito ou variação de alimentação.");
        }

        if ("TORNO".equalsIgnoreCase(tipoEquipamento)) {
            causas.add("Em tornos, a anomalia pode estar relacionada a esforço de corte, vibração, fixação da peça ou desgaste de ferramenta.");
        }

        return causas;
    }

    private String montarRiscoOperacional(AlertaContextoResponseDTO contexto) {
        String severidade = contexto.anomalia().severidade();

        if ("CRITICA".equalsIgnoreCase(severidade)) {
            return "A condição apresenta risco crítico. Se persistir, pode indicar operação severamente fora do padrão e exigir intervenção imediata.";
        }

        if ("ALTA".equalsIgnoreCase(severidade)) {
            return "A condição apresenta risco alto. Se continuar ocorrendo, pode evoluir para falha operacional ou parada do equipamento.";
        }

        if ("MEDIA".equalsIgnoreCase(severidade)) {
            return "A condição apresenta risco moderado. Recomenda-se acompanhar a evolução das próximas leituras.";
        }

        return "A condição apresenta baixo risco inicial, mas deve ser monitorada caso se repita.";
    }

    private String montarRecomendacaoInicial(AlertaContextoResponseDTO contexto) {
        String equipamento = contexto.equipamentosAfetados().isEmpty()
                ? "equipamento associado"
                : contexto.equipamentosAfetados().get(0).descricao();

        return "Verifique o " + equipamento
                + ", confira a condição operacional atual, valide a leitura do sensor e acompanhe se o valor retorna ao intervalo esperado.";
    }

    private String valorOuGenerico(String valor, String generico) {
        return valor == null || valor.isBlank() ? generico : valor;
    }
}