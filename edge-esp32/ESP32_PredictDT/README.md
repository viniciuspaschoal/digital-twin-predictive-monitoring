## 🛠️ Configuração do Firmware (ESP32)

O firmware foi desenvolvido em C++ utilizando o framework Arduino para ESP32, focado em alta disponibilidade e telemetria granular.

### 📚 Bibliotecas Necessárias
Para compilar este código, instale as seguintes bibliotecas no seu Arduino IDE:
- **PubSubClient** (por Nick O'Leary): Para comunicação MQTT.
- **ArduinoJson** (por Benoit Blanchon): Para manipulação de dados estruturados.
- **DHT sensor library** (por Adafruit): Suporte a sensores de temperatura/umidade.

---

### 🔌 Pinagem e Mapeamento de Hardware (GPIO)

O sistema utiliza resistores internos de **PULLUP** para garantir a estabilidade dos sinais digitais e evitar flutuações.

| Recurso | Pino ESP32 | Tipo | Descrição |
| :--- | :--- | :--- | :--- |
| **LED_STATUS** | GPIO 02 | Saída | Indicador visual de conexão (Pisca: Conectando | Aceso: OK) |
| **VAZÃO** | GPIO 34 | Analógico | Leitura de fluxo simulado (0.0 a 50.0 L/min) |
| **CORRENTE** | GPIO 35 | Analógico | Monitoramento de consumo do motor (0.0 a 30.0 A) |
| **TEMPERATURA** | GPIO 32 | Analógico | Sensor de temperatura de carcaça (20.0 a 110.0 °C) |
| **NÍVEL** | GPIO 12 | Digital (In) | Sensor de nível (Boia) - Proteção contra funcionamento a seco |
| **PRESSÃO** | GPIO 14 | Digital (In) | Pressostato de linha - Monitoramento de descarga |
| **ERRO HW** | GPIO 27 | Digital (In) | Simulação de falha física no sensor |
| **MODO** | GPIO 26 | Digital (In) | Alternância entre Modo Automático e Manual |

---

### 🚀 Simulação e Validação (Fase 1)
Nesta branch (`feature/esp32-simulation`), o firmware está configurado para validar a **Esteira de Ingestão**:
1. **Esconamento:** Sinais analógicos de 12 bits (0-4095) são mapeados para grandezas físicas reais.
2. **Protocolo:** Envio de dados a cada 1 segundo para o tópico `predictdt/sbl/bomba01/`.
3. **Resiliência:** Lógica de reconexão automática ao WiFi e ao Broker MQTT (HiveMQ).

## 📈 Tópicos MQTT Utilizados
- `predictdt/sbl/bomba01/vazao`
- `predictdt/sbl/bomba01/corrente`
- `predictdt/sbl/bomba01/temperatura`
- `predictdt/sbl/bomba01/nivel_status` (0: Baixo / 1: OK)
- `predictdt/sbl/bomba01/pressao_status` (0: Baixo / 1: OK)
- `predictdt/sbl/bomba01/sensor_health` (1: Erro Detectado)
- `predictdt/sbl/bomba01/modo_operacao` (AUTO / MANUAL)
