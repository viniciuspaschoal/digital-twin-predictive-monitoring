package com.unisal.predictdt.repository;

import com.unisal.predictdt.entity.Sensor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SensorRepository extends JpaRepository<Sensor, UUID> {

    // 1. Busca todos os sensores que não estão bloqueados (ativo = true)
    // Útil para o Robô Python listar o que precisa monitorar
    List<Sensor> findByAtivoTrue();

    // 2. Para a Tela de Gestão: Ver tudo (Ativos e Inativos)
    // O JpaRepository já nos dá o findAll(), mas podemos ordenar por data de inclusão
    List<Sensor> findAllByOrderByDtInclusaoDesc();

    // 3. Filtro rápido na tela: Ver apenas os inativos/bloqueados
    List<Sensor> findByAtivoFalse();

    // 5. Busca por descrição: Para "campo de busca" na tela
    List<Sensor> findByDescricaoContainingIgnoreCase(String descricao);
}
