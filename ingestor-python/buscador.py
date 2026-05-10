import paho.mqtt.client as mqtt
import json
import asyncio
import websockets
import requests
from datetime import datetime, timezone

# ============================================================
# CONFIGURAÇÕES GERAIS
# ============================================================

JAVA_API_URL = "http://localhost:8080"

MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883

WS_PORT = 8765

# 300 segundos = 5 minutos
# A cada 5 minutos o robô posta o último valor recebido de cada sensor.
POST_INTERVAL = 300


# ============================================================
# CONFIGURAÇÕES DE VARIAÇÃO RELEVANTE
# ============================================================
#
# A ideia é:
#
# - Se o valor mudou pouco, não posta na hora.
# - Se o valor mudou muito, posta imediatamente.
#
# Exemplo:
#
# Último valor postado: 25
# Novo valor: 26
# Diferença: 1
# Resultado: não posta agora.
#
# Último valor postado: 25
# Novo valor: 40
# Diferença: 15
# Resultado: posta agora.
#

# Diferença absoluta mínima para postar imediatamente.
# Exemplo: 25 -> 31 tem diferença 6, então posta.
VARIATION_ABSOLUTE = 5.0

# Diferença percentual mínima para postar imediatamente.
# Exemplo: 25 -> 40 dá 60% de diferença, então posta.
VARIATION_PERCENT = 20.0

# Evita que variações percentuais pequenas em valores muito baixos
# fiquem gerando postagem toda hora.
#
# Exemplo:
# 0.10 -> 0.20 dá 100%, mas a diferença real é só 0.10.
# Com esse limite, ele não considera isso relevante.
MIN_DIFF_FOR_PERCENT_RULE = 1.0

# Quando o último valor postado era 0, não dá para calcular porcentagem.
# Então usamos apenas uma diferença absoluta mínima.
ZERO_BASE_ABSOLUTE = 1.0


# ============================================================
# MEMÓRIAS DO ROBÔ
# ============================================================

# Mapeamento dos sensores ativos:
#
# {
#   "predictdt/sbl/bomba01/vazao": "uuid-do-sensor",
#   "predictdt/sbl/bomba01/corrente": "uuid-do-sensor"
# }
#
# O tópico vem exatamente do backend.
# O Python não monta mais tópico.
active_sensors = {}

# Último valor recebido de cada tópico MQTT.
#
# Esse dicionário muda toda vez que chega leitura MQTT.
#
# Exemplo:
# {
#   "predictdt/sbl/bomba01/vazao": 25.4
# }
latest_values = {}

# Último valor que realmente foi salvo no banco.
#
# Esse é o valor usado para comparar se houve variação grande.
#
# Exemplo:
# Se o banco salvou 25 e agora chegou 40,
# o Python percebe que a mudança foi relevante e posta na hora.
last_posted_values = {}

# Clientes conectados no WebSocket.
connected_clients = set()

# Loop principal do asyncio.
# O MQTT roda em outra thread, então precisamos desse loop para chamar funções async.
loop = None

# Usado para imprimir apenas uma vez que houve postagem no banco.
first_post_logged = False


# ============================================================
# SINCRONIZAÇÃO COM O BACKEND JAVA
# ============================================================

def sync_sensors():
    """
    Busca os sensores ativos no Backend Java.

    IMPORTANTE:
    O Python agora usa o campo topicoCompleto exatamente como vem do backend.

    O Python não adiciona barra, não troca bomba1 por bomba01,
    não coloca /telemetria e não faz ajuste de tópico.
    """

    global active_sensors

    try:
        response = requests.get(
            f"{JAVA_API_URL}/sensores?size=100",
            timeout=10
        )

        if response.status_code != 200:
            print(f"[ERRO] Falha ao buscar sensores. Status: {response.status_code}")
            return

        data = response.json()
        sensores = data.get("content", [])

        active_sensors = {}

        for sensor in sensores:
            ativo = sensor.get("ativo")
            topico = sensor.get("topicoCompleto")
            sensor_id = sensor.get("id")

            if ativo is True and topico and sensor_id:
                active_sensors[topico] = sensor_id

        print("[OK] Robô Gateway PredictDT iniciado.")
        print(f"[OK] Sensores ativos coletados: {len(active_sensors)}")

        if active_sensors:
            print("[OK] Tópicos monitorados:")
            for topic in active_sensors.keys():
                print(f" - {topic}")
        else:
            print("[AVISO] Nenhum sensor ativo foi encontrado.")

    except requests.exceptions.ConnectionError:
        print("[ERRO] Não foi possível conectar ao Backend Java.")

    except Exception as e:
        print(f"[ERRO] Falha ao sincronizar sensores: {e}")


# ============================================================
# LÓGICA DE VARIAÇÃO RELEVANTE
# ============================================================

def is_binary_status(previous_value, current_value):
    """
    Verifica se os valores parecem ser status binário: 0 ou 1.

    Isso ajuda sensores como:
    - nivel_status
    - pressao_status

    Para status, qualquer mudança entre 0 e 1 é importante.
    """

    return (
        previous_value in (0.0, 1.0)
        and current_value in (0.0, 1.0)
    )


def should_post_immediately(topic, current_value):
    """
    Decide se uma leitura deve ser postada imediatamente.

    Ela será postada imediatamente quando:

    1. For a primeira leitura daquele sensor.
    2. O valor mudou bastante comparado ao último valor salvo no banco.
    3. For um status 0/1 e ele mudou.

    Se a mudança for pequena, o valor fica guardado em latest_values
    e será salvo no próximo ciclo de 5 minutos.
    """

    # Se nunca postamos esse tópico no banco, posta agora.
    if topic not in last_posted_values:
        return True

    previous_value = last_posted_values[topic]
    diff = abs(current_value - previous_value)

    # Se não mudou nada, não precisa postar agora.
    if diff == 0:
        return False

    # Caso de sensores tipo status: 0 -> 1 ou 1 -> 0.
    # Qualquer mudança é relevante.
    if is_binary_status(previous_value, current_value):
        return True

    # Se o valor anterior era zero, não dá para calcular porcentagem.
    # Então usamos uma diferença absoluta mínima.
    if previous_value == 0:
        return diff >= ZERO_BASE_ABSOLUTE

    # Calcula diferença percentual.
    percent_diff = (diff / abs(previous_value)) * 100

    # Regra 1:
    # Se a diferença absoluta for grande, posta.
    if diff >= VARIATION_ABSOLUTE:
        return True

    # Regra 2:
    # Se a diferença percentual for grande, posta,
    # mas só se a diferença real também não for minúscula.
    if percent_diff >= VARIATION_PERCENT and diff >= MIN_DIFF_FOR_PERCENT_RULE:
        return True

    # Se chegou aqui, a variação foi pequena.
    return False


# ============================================================
# POSTAGEM NO BACKEND JAVA
# ============================================================

async def post_to_java(topic, value):
    """
    Envia uma medida para o Backend Java.

    Esse método é usado em dois momentos:

    1. Quando detecta variação relevante.
    2. No ciclo fixo de 5 minutos.

    Quando o POST dá certo, atualiza last_posted_values.
    Isso é importante porque a próxima variação será comparada
    com o último valor realmente salvo no banco.
    """

    global first_post_logged

    sensor_id = active_sensors.get(topic)

    if not sensor_id:
        return False

    try:
        medida = float(value)

        payload = {
            "sensorId": sensor_id,
            "medida": medida
        }

        response = await asyncio.to_thread(
            requests.post,
            f"{JAVA_API_URL}/log-medida",
            json=payload,
            timeout=10
        )

        if 200 <= response.status_code < 300:
            last_posted_values[topic] = medida

            if not first_post_logged:
                print("[OK] Primeira medida postada no banco com sucesso.")
                first_post_logged = True

            return True

        print(f"[ERRO] Java recusou uma medida. Status: {response.status_code}")
        return False

    except ValueError:
        print(f"[ERRO] Valor inválido recebido no MQTT: {value}")
        return False

    except requests.exceptions.ConnectionError:
        print("[ERRO] Não foi possível conectar ao Java para postar medida.")
        return False

    except Exception as e:
        print(f"[ERRO] Falha ao postar medida: {e}")
        return False


# ============================================================
# POSTAGEM PERIÓDICA
# ============================================================

async def forced_post_scheduler():
    """
    A cada POST_INTERVAL segundos, posta o último valor recebido de cada sensor.

    Isso garante que mesmo sensores estáveis continuem gerando histórico.

    Exemplo:
    Se a vazão ficou em 40 por meia hora, ele não vai postar toda hora
    por variação, porque não variou.

    Mas ainda vai salvar snapshots a cada 5 minutos.
    """

    while True:
        await asyncio.sleep(POST_INTERVAL)

        if not latest_values:
            continue

        for topic, value in list(latest_values.items()):
            await post_to_java(topic, value)


# ============================================================
# WEBSOCKET PARA O DASHBOARD
# ============================================================

async def broadcast_ws(data):
    """
    Envia uma leitura para todos os clientes WebSocket conectados.

    O WebSocket continua sendo em tempo real.
    Ou seja:
    - Chegou leitura MQTT
    - Manda para o dashboard na hora

    Mesmo que a leitura não seja salva no banco imediatamente.
    """

    if not connected_clients:
        return

    message = json.dumps(data)
    disconnected_clients = []

    for client in list(connected_clients):
        try:
            await client.send(message)
        except Exception:
            disconnected_clients.append(client)

    for client in disconnected_clients:
        connected_clients.discard(client)


async def websocket_handler(ws):
    """
    Controla conexões WebSocket do dashboard.
    """

    connected_clients.add(ws)
    print(f"[OK] Cliente WebSocket conectado. Total: {len(connected_clients)}")

    try:
        await ws.wait_closed()
    finally:
        connected_clients.discard(ws)
        print(f"[OK] Cliente WebSocket desconectado. Total: {len(connected_clients)}")


# ============================================================
# CALLBACKS MQTT
# ============================================================

def on_connect(client, userdata, flags, reason_code, properties=None):
    """
    Executa quando o Python conecta no broker MQTT.

    Aqui ele assina todos os tópicos que vieram do backend.
    """

    print(f"[OK] Conectado ao MQTT: {reason_code}")

    if not active_sensors:
        print("[AVISO] Nenhum tópico MQTT para assinar.")
        return

    for topic in active_sensors.keys():
        client.subscribe(topic)


def on_message(client, userdata, msg):
    """
    Executa sempre que chega uma mensagem MQTT.

    Fluxo:

    1. Recebe o tópico e o valor.
    2. Confere se esse tópico está cadastrado como sensor ativo.
    3. Converte o valor para número.
    4. Guarda o último valor em memória.
    5. Se houve variação relevante, posta imediatamente.
    6. Sempre manda para o WebSocket em tempo real.
    """

    topic = msg.topic
    raw_value = msg.payload.decode(errors="ignore")

    # Ignora qualquer tópico que não veio do backend.
    if topic not in active_sensors:
        return

    try:
        medida = float(raw_value)
    except ValueError:
        return

    # Guarda a última leitura recebida.
    latest_values[topic] = medida

    # Verifica se precisa postar agora por primeira leitura
    # ou por variação relevante.
    if should_post_immediately(topic, medida):
        asyncio.run_coroutine_threadsafe(
            post_to_java(topic, medida),
            loop
        )

    # Envia para o dashboard em tempo real.
    payload_ws = {
        "sensor_id": active_sensors[topic],
        "topico": topic,
        "medida": medida,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    asyncio.run_coroutine_threadsafe(
        broadcast_ws(payload_ws),
        loop
    )


# ============================================================
# MAIN
# ============================================================

async def main():
    """
    Inicializa o robô:

    1. Busca sensores no Java.
    2. Conecta no MQTT.
    3. Inicia o agendador de postagem a cada 5 minutos.
    4. Abre o WebSocket para o dashboard.
    """

    global loop

    loop = asyncio.get_running_loop()

    sync_sensors()

    mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message

    try:
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
    except Exception as e:
        print(f"[ERRO] Não foi possível conectar ao MQTT: {e}")
        return

    mqtt_client.loop_start()

    asyncio.create_task(forced_post_scheduler())

    async with websockets.serve(websocket_handler, "0.0.0.0", WS_PORT):
        print(f"[OK] Robô ativo. WebSocket na porta {WS_PORT}")
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())