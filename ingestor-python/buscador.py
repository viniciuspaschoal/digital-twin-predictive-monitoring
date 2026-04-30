import asyncio
import json
import paho.mqtt.client as mqtt
import websockets

# --- CONFIGURAÇÕES ---
BROKER = "broker.hivemq.com"
PORT_MQTT = 1883
TOPICO_ASSINADO = "unisal/projeto/#"
WS_HOST = "127.0.0.1" 
WS_PORT = 8765

CLIENTES_CONECTADOS = set()

# --- LÓGICA WEBSOCKET ---

async def gerenciar_websocket(websocket):
    CLIENTES_CONECTADOS.add(websocket)
    print(f"🌐 Dashboard conectado! Total: {len(CLIENTES_CONECTADOS)}")
    try:
        # Este loop mantém a conexão VIVA
        async for message in websocket:
            pass 
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        CLIENTES_CONECTADOS.remove(websocket)
        print(f"🌐 Dashboard desconectado.")

async def broadcast_ws(mensagem):
    if CLIENTES_CONECTADOS:
        # Envio em massa para todos os conectados
        await asyncio.gather(*[client.send(mensagem) for client in CLIENTES_CONECTADOS])

# --- LÓGICA MQTT ---

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ Robô Ingestor Conectado ao Broker!")
        client.subscribe(TOPICO_ASSINADO)
    else:
        print(f"❌ Erro MQTT: {rc}")

def on_message(client, userdata, msg):
    try:
        payload = msg.payload.decode()
        # Cria o JSON que vai para o Dashboard [cite: 27]
        dados_web = json.dumps({
            "topico": msg.topic,
            "payload": json.loads(payload)
        })
        # Agenda o envio para o WebSocket sem travar o MQTT [cite: 25, 26]
        asyncio.run_coroutine_threadsafe(broadcast_ws(dados_web), loop_principal)
    except Exception as e:
        print(f"⚠️ Erro no processamento: {e}")

# --- START ---

async def main():
    global loop_principal
    loop_principal = asyncio.get_running_loop()

    # Configuração MQTT [cite: 17, 22]
    mqtt_client = mqtt.Client()
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message
    mqtt_client.connect(BROKER, PORT_MQTT, 60)
    mqtt_client.loop_start() 

    # Inicia o servidor e mantém rodando [cite: 54, 61]
    async with websockets.serve(gerenciar_websocket, WS_HOST, WS_PORT):
        print(f"🚀 Gateway rodando em ws://{WS_HOST}:{WS_PORT}")
        await asyncio.Future() # Mantém o processo principal vivo

if __name__ == "__main__":
    asyncio.run(main())