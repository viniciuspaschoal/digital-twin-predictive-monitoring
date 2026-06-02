package com.unisal.predictdt.repository;

import com.unisal.predictdt.entity.Modelo3D;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface Modelo3DRepository extends JpaRepository<Modelo3D, UUID> {

    /*
     * Busca o modelo 3D ativo do dashboard.
     *
     * Pela regra atual do sistema, deve existir no máximo um modelo ativo.
     */
    Optional<Modelo3D> findByAtivoTrue();
}