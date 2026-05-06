package com.unisal.predictdt.controller;

import com.unisal.predictdt.dto.sensor.SensorRequestDTO;
import com.unisal.predictdt.dto.sensor.SensorResponseDTO;
import com.unisal.predictdt.dto.sensor.SensorUpdateDTO;
import com.unisal.predictdt.service.SensoresService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/sensores") //Rota base para os sensores
@RequiredArgsConstructor // Faz o @Autowired via construtor automaticamente
public class SensorController {

    private final SensoresService service;

    // Criar Sensor
    // Post
    @PostMapping
    public ResponseEntity<SensorResponseDTO> criar(@RequestBody SensorRequestDTO dto) {
        SensorResponseDTO response = service.criarSensor(dto);
        //Retorna o status 201 (Created) e o objeto criado
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // 2. Listar tudo com paginação
    // Exemplo de uso: /api/sensores?page=0&size=10
    @GetMapping
    public ResponseEntity<Page<SensorResponseDTO>> getSensores(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<SensorResponseDTO> sensores = service.getSensores(page, size);
        return ResponseEntity.ok(sensores);
    }

    // 3. Buscar apenas um sensor por ID
    // Rota: /api/sensores/{id}
    @GetMapping("/{id}")
    public ResponseEntity<SensorResponseDTO> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getSensorById(id));
    }

    // 4. Atualiza sensor
    @PutMapping("/{id}")
    public ResponseEntity<SensorResponseDTO> putSensor(@PathVariable UUID id, @RequestBody SensorUpdateDTO dto){
        return ResponseEntity.ok(service.putSensorByID(id, dto));
    }

    // 5. Deletar Sensor
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable UUID id){
        service.deletarSensor(id);

        // Retorna 200 e a resposta
        return ResponseEntity.ok("Equipamento deletado com sucesso");
    }

}
