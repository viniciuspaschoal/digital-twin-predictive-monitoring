package com.unisal.predictdt.repository;

import com.unisal.predictdt.analysis.baseline.projection.BaselineCalculoProjection;
import com.unisal.predictdt.entity.LogMedida;
import com.unisal.predictdt.entity.LogMedidaId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface LogMedidaRepository extends JpaRepository<LogMedida, LogMedidaId> {

    @Query(value = """
    SELECT
        lm.sensor_id AS sensorId,
        AVG(lm.medida) AS media,
        COALESCE(STDDEV(lm.medida), 0) AS desvioPadrao,
        MIN(lm.medida) AS valorMinimoObservado,
        MAX(lm.medida) AS valorMaximoObservado,
        COUNT(*) AS qtdAmostras
    FROM log_medida lm
    WHERE lm.dt_medida >= NOW() - CAST(:intervalo AS INTERVAL)
    GROUP BY lm.sensor_id
    HAVING COUNT(*) >= :minimoAmostras
    """, nativeQuery = true)
    List<BaselineCalculoProjection> calcularBaselinePorIntervalo(
            @Param("intervalo") String intervalo,
            @Param("minimoAmostras") Integer minimoAmostras
    );

    @Query(value = """
        SELECT
            lm.sensor_id AS "sensorId",
            AVG(lm.medida) AS "media",
            COALESCE(STDDEV(lm.medida), 0) AS "desvioPadrao",
            MIN(lm.medida) AS "valorMinimoObservado",
            MAX(lm.medida) AS "valorMaximoObservado",
            COUNT(*) AS "qtdAmostras"
        FROM log_medida lm
        WHERE lm.dt_medida >= :janelaInicio
          AND lm.dt_medida < :janelaFim
        GROUP BY lm.sensor_id
        HAVING COUNT(*) >= :minimoAmostras
        """, nativeQuery = true)
    List<BaselineCalculoProjection> calcularBaselinePorJanela(
            @Param("janelaInicio") OffsetDateTime janelaInicio,
            @Param("janelaFim") OffsetDateTime janelaFim,
            @Param("minimoAmostras") Integer minimoAmostras
    );
}
