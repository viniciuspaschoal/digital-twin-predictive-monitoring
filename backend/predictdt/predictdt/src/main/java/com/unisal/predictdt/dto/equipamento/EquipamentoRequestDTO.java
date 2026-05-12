package com.unisal.predictdt.dto.equipamento;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record EquipamentoRequestDTO(

        @NotBlank(message = "O campo descrição deve estar preenchido")
        @Size(max = 100, message = "A descrição deve ter no máximo 100 caracteres")
        String descricao,

        Boolean ativo,

        /*
         * Tipo operacional do equipamento.
         *
         * Exemplo:
         * - BOMBA
         * - MOTOR
         * - TORNO
         * - COMPRESSOR
         *
         * Este campo é opcional para manter compatibilidade com cadastros antigos.
         * Quando informado, permite que o sistema entenda o contexto técnico
         * do equipamento para enriquecer alertas e explicações da IA.
         */
        UUID tipoEquipamentoId
) {
}