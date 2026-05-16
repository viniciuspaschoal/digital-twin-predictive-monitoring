package com.unisal.predictdt.analysis.baseline.projection;

import java.util.UUID;

public interface BaselineCalculoProjection {

    UUID getSensorId();

    Double getMedia();

    Double getDesvioPadrao();

    Double getValorMinimoObservado();

    Double getValorMaximoObservado();

    Integer getQtdAmostras();
}