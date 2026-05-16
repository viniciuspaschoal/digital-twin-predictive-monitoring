package com.unisal.predictdt.mapper;

import com.unisal.predictdt.dto.alertaExplicacao.AlertaExplicacaoResponseDTO;
import com.unisal.predictdt.entity.AlertaAnomalia;
import com.unisal.predictdt.entity.AlertaAnomaliaExplicacao;

import java.util.Arrays;
import java.util.List;

public class AlertaAnomaliaExplicacaoMapper {

    /*
     * Converte a explicação salva no banco para o DTO usado pelo frontend.
     *
     * A tabela salva possiveisCausas como texto simples.
     * O DTO retorna possiveisCausas como List<String>.
     */

    public static AlertaExplicacaoResponseDTO toResponse(AlertaAnomaliaExplicacao entity){
        if (entity == null) {
            return null;
        }

        return new AlertaExplicacaoResponseDTO(
                entity.getAlertaAnomalia().getId(),
                entity.getTitulo(),
                entity.getResumo(),
                converterTextoParaLista(entity.getPossiveisCausas()),
                entity.getRiscoOperacional(),
                entity.getRecomendacaoInicial(),
                entity.getExplicacaoIa(),
                entity.getObservacao()
        );
    }

    /*
     * Converte o DTO gerado pelo service para uma Entity que será salva no banco.
     *
     * Aqui ligamos a explicação persistida ao alerta original.
     */
    public static AlertaAnomaliaExplicacao toEntity(
            AlertaAnomalia alerta,
            AlertaExplicacaoResponseDTO dto,
            String origem
    ) {
        if (alerta == null || dto == null) {
            return null;
        }

        AlertaAnomaliaExplicacao entity = new AlertaAnomaliaExplicacao();

        entity.setAlertaAnomalia(alerta);
        entity.setTitulo(dto.titulo());
        entity.setResumo(dto.resumo());
        entity.setPossiveisCausas(converterListaParaTexto(dto.possiveisCausas()));
        entity.setRiscoOperacional(dto.riscoOperacional());
        entity.setRecomendacaoInicial(dto.recomendacaoInicial());
        entity.setExplicacaoIa(dto.explicacaoIa());
        entity.setObservacao(dto.observacao());
        entity.setOrigem(origem);

        return entity;
    }


    private static List<String> converterTextoParaLista(String texto){
        if (texto == null || texto.isBlank()){
            return List.of();
        }

        return Arrays.stream(texto.split("\\R")).map(String::trim).filter(item -> !item.isBlank()).toList();
    }

    /*
     * Converte List<String> para texto simples.
     *
     * Cada item vira uma linha no banco.
     */
    private static String converterListaParaTexto(List<String> itens){
        if (itens == null || itens.isEmpty()) {
            return "";
        }

        return String.join("\n", itens);
    }


}
