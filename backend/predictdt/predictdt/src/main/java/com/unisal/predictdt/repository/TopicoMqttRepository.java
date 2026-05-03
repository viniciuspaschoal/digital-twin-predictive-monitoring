package com.unisal.predictdt.repository;

import com.unisal.predictdt.entity.TopicoMqtt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TopicoMqttRepository  extends JpaRepository<TopicoMqtt, UUID> {
    Optional<TopicoMqtt> findByDescricao(String descricao);
}
