package com.unisal.predictdt.repository;

import com.unisal.predictdt.entity.LogMedida;
import com.unisal.predictdt.entity.LogMedidaId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LogMedidaRepository extends JpaRepository<LogMedida, LogMedidaId> {
}
