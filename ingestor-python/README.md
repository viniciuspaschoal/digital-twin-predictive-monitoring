# 🐍 Ingestor e Gateway Digital Twin (Python)

Este módulo atua como o **Gateway de Borda** do projeto Digital Twin. Ele é responsável por realizar a ponte entre o hardware físico (ESP32 via MQTT) e a interface de visualização (Dashboard via WebSockets), garantindo a integridade e a eficiência no fluxo de dados.

## 🚀 Funcionalidades
* **Ingestão Assíncrona:** Gerenciamento de mensagens MQTT sem bloqueio de thread.
* **Servidor WebSocket:** Transmissão em tempo real (Full-Duplex) para múltiplos dashboards.
* **Data Throttling (ODS 12):** Filtro de ruído e mudanças irrelevantes para otimizar o tráfego de rede e o futuro processamento em banco de dados.
* **Multithreading:** Operação simultânea de protocolos de rede distintos (Pilar de Sistemas Operacionais).

## 🛠️ O Arquivo: `buscador.py`
O script principal utiliza a biblioteca `asyncio` para orquestrar duas tarefas críticas:

1.  **Callback MQTT (`on_message`):** Atua como o "porteiro". Ele recebe o JSON do ESP32, valida os campos e decide se o dado é relevante para ser transmitido (Throttling).
2.  **Broadcast WebSocket (`broadcast_ws`):** Quando um dado válido chega, o script o "empurra" para todos os clientes conectados na porta `8765`, eliminando a necessidade de requisições HTTP constantes.

## 📦 Dependências e Instalação (`requirements.txt`)
Para garantir a portabilidade do projeto (Pilar de Engenharia de Software), utilizamos o arquivo `requirements.txt`. Ele lista todas as bibliotecas necessárias para rodar o gateway.

### Como instalar as dependências:
Abra o terminal na pasta deste módulo e execute:
```bash
pip install -r requirements.txt