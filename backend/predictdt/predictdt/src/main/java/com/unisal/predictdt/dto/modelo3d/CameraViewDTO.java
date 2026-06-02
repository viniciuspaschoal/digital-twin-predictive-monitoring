package com.unisal.predictdt.dto.modelo3d;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CameraViewDTO(

        /*
         * Posição da câmera no ambiente 3D.
         *
         * Exemplo:
         * [4.2, 2.5, 6.8]
         */
        @NotNull(message = "A posição da câmera deve ser informada")
        @Size(min = 3, max = 3, message = "A posição da câmera deve possuir exatamente 3 valores")
        List<Double> position,

        /*
         * Ponto para onde a câmera está olhando.
         *
         * Exemplo:
         * [0, 0, 0]
         */
        @NotNull(message = "O target da câmera deve ser informado")
        @Size(min = 3, max = 3, message = "O target da câmera deve possuir exatamente 3 valores")
        List<Double> target
) {
}