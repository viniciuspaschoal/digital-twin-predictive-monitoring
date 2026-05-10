# PredictDT - Python Gateway 🐍

Este componente atua como o **Middleware** do sistema, realizando a orquestração entre a Camada de Borda (MQTT) e a Camada de Persistência (Java/Spring Boot).

## 🚀 Funcionalidades
- **Subscriber MQTT:** Escuta todos os tópicos da bomba no broker HiveMQ.
- **WebSocket Server:** Realiza o broadcast dos dados para o Frontend (Lovable) em tempo real.
- **REST Client:** Realiza o POST das medidas para o endpoint `/log-medida` do backend Java.
- **Data Buffering:** Mantém o último estado conhecido de cada sensor para postagens agendadas.

## 🧠 Inteligência de Dados
O gateway utiliza um algoritmo de filtragem para decidir o que deve ser persistido:
- **Mudança Brusca:** Se a vazão ou temperatura variar significativamente, o dado é salvo na hora.
- **Snapshot:** Se o sistema estiver estável, um registro é salvo a cada 5 minutos para auditoria.
- **Status:** Sensores de nível e pressão (0/1) têm prioridade máxima de postagem em qualquer mudança.

## 🛠️ Requisitos
- Python 3.13+
- Bibliotecas: `paho-mqtt`, `websockets`, `requests`

## 📊 Fluxo de Dados
1. O Robô inicia e busca a lista de sensores ativos no Java.
2. Ao receber um dado MQTT, ele atualiza o buffer interno.
3. Envia o dado via WebSocket para quem estiver conectado (Dashboard).
4. A cada 5 minutos, consolida e envia todos os dados para o Java salvar no PostgreSQL.

---
**Status da Fase 1: Estabilidade de Ingestão Validada**