package com.unisal.predictdt.dto.modelo3d;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record Modelo3DEquipamentoVinculoRequestDTO(

        /*
         * ID do equipamento real que será vinculado ao objeto 3D.
         */
        @NotNull(message = "O equipamento deve ser informado")
        UUID equipamentoId
) {
}