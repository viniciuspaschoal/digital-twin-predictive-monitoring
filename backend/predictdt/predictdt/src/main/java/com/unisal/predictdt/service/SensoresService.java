package com.unisal.predictdt.service;

import com.unisal.predictdt.dto.sensor.SensorRequestDTO;
import com.unisal.predictdt.dto.sensor.SensorResponseDTO;
import com.unisal.predictdt.dto.sensor.SensorUpdateDTO;
import com.unisal.predictdt.entity.GrandezaMedida;
import com.unisal.predictdt.entity.Sensor;
import com.unisal.predictdt.entity.TopicoMqtt;
import com.unisal.predictdt.exception.BusinessException;
import com.unisal.predictdt.mapper.SensorMapper;
import com.unisal.predictdt.repository.GrandezaMedidaRepository;
import com.unisal.predictdt.repository.SensorRepository;
import com.unisal.predictdt.repository.TopicoMqttRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SensoresService {

    private final SensorRepository sensorRepository;
    private final TopicoMqttRepository topicoMqttRepository;
    private final GrandezaMedidaRepository grandezaMedidaRepository;

    /*
     * Cadastra um novo sensor.
     *
     * O sensor pode estar associado a:
     * - um tópico MQTT base;
     * - uma grandeza medida, como CORRENTE, PRESSAO, TEMPERATURA etc.;
     * - uma unidade efetiva digitada pelo usuário.
     */
    @Transactional
    public SensorResponseDTO criarSensor(SensorRequestDTO dto) {
        String descricao = limparDescricao(dto.descricao());
        validarDescricao(descricao);

        /*
         * Busca o tópico base usando o ID recebido no DTO.
         *
         * O tópico é necessário para compor o caminho MQTT completo
         * utilizado pelo coletor/Python/ESP.
         */
        TopicoMqtt topico = topicoMqttRepository.findById(dto.topicoId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Tópico base não encontrado"));

        /*
         * Busca a grandeza física do sensor, quando informada.
         *
         * O campo é opcional por enquanto para manter compatibilidade
         * com sensores antigos. Quando preenchido, permite que o sistema
         * entenda tecnicamente o significado da medição.
         */
        GrandezaMedida grandezaMedida = buscarGrandezaMedidaOpcional(dto.grandezaMedidaId());

        /*
         * A unidade efetiva continua vindo do usuário.
         *
         * Caso o usuário não informe unidade e a grandeza possua unidade padrão,
         * usamos a unidade padrão como fallback para evitar sensor sem unidade.
         */
        String unidadeMedida = dto.unidadeMedida();

        if ((unidadeMedida == null || unidadeMedida.isBlank()) && grandezaMedida != null) {
            unidadeMedida = grandezaMedida.getUnidadePadrao();
        }

        /*
         * Converte DTO + tópico + grandeza em Entity.
         */
        Sensor entity = SensorMapper.toEntity(dto, topico, grandezaMedida);
        entity.setDescricao(descricao);
        entity.setUnidadeMedida(unidadeMedida);
        entity.setAtivo(true);

        Sensor saved = sensorRepository.save(entity);

        return SensorMapper.toResponse(saved);
    }

    /*
     * Lista sensores com paginação.
     *
     * A transação readOnly mantém o contexto de persistência aberto durante
     * o mapeamento para DTO, permitindo acessar relações como tópico e grandeza.
     */
    @Transactional(readOnly = true)
    public Page<SensorResponseDTO> getSensores(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Sensor> result = sensorRepository.findAll(pageable);

        if (result.isEmpty()) {
            throw new BusinessException(HttpStatus.NO_CONTENT, "Nenhum sensor cadastrado");
        }

        return result.map(SensorMapper::toResponse);
    }

    /*
     * Busca um sensor por ID.
     *
     * Também usa readOnly para permitir que o mapper acesse relações associadas
     * antes da sessão do Hibernate ser encerrada.
     */
    @Transactional(readOnly = true)
    public SensorResponseDTO getSensorById(UUID id) {
        Sensor entity = buscarSensorPorId(id);

        return SensorMapper.toResponse(entity);
    }

    /*
     * Atualiza um sensor existente.
     *
     * Permite alterar descrição, unidade efetiva, tópico auxiliar, status
     * e grandeza medida.
     */
    @Transactional
    public SensorResponseDTO putSensorByID(UUID id, SensorUpdateDTO dto) {
        Sensor entity = buscarSensorPorId(id);
        LocalDateTime now = LocalDateTime.now();

        /*
         * Atualiza descrição quando fornecida.
         */
        if (dto.descricao() != null && !dto.descricao().equals(entity.getDescricao())) {
            String descricao = limparDescricao(dto.descricao());
            validarDescricao(descricao);
            entity.setDescricao(descricao);
        }

        /*
         * Atualiza unidade efetiva usada pelo sensor.
         */
        if (dto.unidadeMedida() != null) {
            entity.setUnidadeMedida(dto.unidadeMedida());
        }

        /*
         * Atualiza tópico auxiliar usado para compor o tópico MQTT completo.
         */
        if (dto.topicoAuxiliar() != null) {
            entity.setTopicoAuxiliar(dto.topicoAuxiliar());
        }

        /*
         * Atualiza a grandeza física associada ao sensor.
         *
         * Quando enviada, a grandeza é validada contra a tabela grandeza_medida.
         */
        if (dto.grandezaMedidaId() != null) {
            GrandezaMedida grandezaMedida = grandezaMedidaRepository.findById(dto.grandezaMedidaId())
                    .orElseThrow(() -> new BusinessException(
                            HttpStatus.NOT_FOUND,
                            "Grandeza de medida não encontrada"
                    ));

            entity.setGrandezaMedida(grandezaMedida);
        }

        /*
         * Atualiza status e gerencia data de bloqueio.
         */
        if (dto.ativo() != null && !dto.ativo().equals(entity.getAtivo())) {
            entity.setAtivo(dto.ativo());
            entity.setDtBloqueio(!dto.ativo() ? now : null);
        }

        entity.setDtAlteracao(now);

        Sensor saved = sensorRepository.save(entity);
        return SensorMapper.toResponse(saved);
    }

    /*
     * Remove um sensor do banco.
     */
    @Transactional
    public void deletarSensor(UUID id) {
        Sensor entity = buscarSensorPorId(id);
        sensorRepository.delete(entity);
    }

    // --- MÉTODOS AUXILIARES ---

    private Sensor buscarSensorPorId(UUID id) {
        return sensorRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Sensor não encontrado"));
    }

    private GrandezaMedida buscarGrandezaMedidaOpcional(UUID grandezaMedidaId) {
        if (grandezaMedidaId == null) {
            return null;
        }

        return grandezaMedidaRepository.findById(grandezaMedidaId)
                .orElseThrow(() -> new BusinessException(
                        HttpStatus.NOT_FOUND,
                        "Grandeza de medida não encontrada"
                ));
    }

    private String limparDescricao(String descricao) {
        return (descricao != null) ? descricao.toLowerCase().trim() : "";
    }

    private void validarDescricao(String descricao) {
        /*
         * Permite letras, números, espaços, hífens, underlines e barra.
         */
        if (descricao == null || !descricao.matches("[a-zA-Z0-9À-ÿ/\\-_\\s]+")) {
            throw new BusinessException("A descrição contém caracteres especiais não permitidos.");
        }
    }
}