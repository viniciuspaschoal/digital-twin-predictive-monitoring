# Digital Twin - Monitoramento Preditivo de Equipamentos 🚀

Projeto Integrador do 5º Semestre (Unisal) focado em **Indústria 4.0** e **Agenda ONU 2030 (ODS 9 e 12)**. Este repositório centraliza todas as camadas do sistema, desde o hardware até a análise preditiva.

## 🏗️ Arquitetura do Sistema
O projeto é dividido em camadas independentes para garantir escalabilidade e manutenção:

* **`edge-esp32`**: Firmware em C++/FreeRTOS para coleta de sensores e processamento de borda.
* **`ingestor-python`**: Gateway de rede para consumo, triagem e validação de dados via protocolo MQTT.
* **`backend-java`**: API de inteligência para análise estatística e lógica de negócio.
* **`frontend-web`**: Interface de visualização em tempo real e dashboard do Digital Twin.
* **`database`**: Scripts de persistência e modelagem de dados (PostgreSQL/TimescaleDB).
* **`docs`**: Centralização de relatórios acadêmicos, diagramas e referências técnicas.

## 🛠️ Tecnologias Utilizadas
- **Linguagens:** C++, Python, Java.
- **Protocolos:** MQTT, HTTP, JSON.
- **Hardware:** ESP32, DHT11, Potenciômetro.
- **Broker:** HiveMQ (Cloud/Public).

## 👥 Integrantes
- Carlos Eduardo Leite de Oliveira
- Murillo Gonçalves
- Vinícius de Lima Paschoal