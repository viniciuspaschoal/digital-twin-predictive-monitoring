package com.unisal.predictdt.repository;

import com.unisal.predictdt.entity.GrandezaMedida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GrandezaMedidaRepository extends JpaRepository<GrandezaMedida, UUID> {

    Optional<GrandezaMedida> findByDescricao(String descricao);
}