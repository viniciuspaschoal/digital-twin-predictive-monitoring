package com.unisal.predictdt.repository;

import com.unisal.predictdt.entity.TipoEquipamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TipoEquipamentoRepository extends JpaRepository<TipoEquipamento, UUID> {

    Optional<TipoEquipamento> findByDescricao(String descricao);
}