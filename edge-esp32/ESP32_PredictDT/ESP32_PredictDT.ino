#include <WiFi.h>
#include <PubSubClient.h>

// --- Configurações de Rede ---
const char* ssid = "NOME_REDE";
const char* password = "SENHA_REDE";
const char* mqtt_server = "broker.hivemq.com"; 

// --- Definições de Hardware (Pinos) ---
#define LED_STATUS 2     // LED Azul nativo do ESP32
#define PIN_VAZAO 34    
#define PIN_CORRENTE 35  
#define PIN_TEMP 32      

#define BTN_NIVEL 12     
#define BTN_PRESSAO 14   
#define BTN_ERRO 27      
#define BTN_MODO 26      
#define BTN_RESET 25     

WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastMsg = 0;
unsigned long lastBlink = 0;
const char* topicPrefix = "predictdt/sbl/bomba01/";

void setup_wifi() {
  delay(10);
  Serial.println("\nConectando WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    digitalWrite(LED_STATUS, LOW); // LED apagado enquanto não tem WiFi
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Conectado!");
}

void reconnect() {
  while (!client.connected()) {
    // Lógica para piscar o LED enquanto tenta o Broker
    unsigned long now = millis();
    if (now - lastBlink > 200) {
      lastBlink = now;
      digitalWrite(LED_STATUS, !digitalRead(LED_STATUS)); 
    }

    Serial.print("Tentando MQTT...");
    String clientId = "ESP32_PredictDT_" + String(random(0, 0xffff), HEX);
    
    if (client.connect(clientId.c_str())) {
      Serial.println("Conectado!");
      digitalWrite(LED_STATUS, HIGH); // Fica aceso direto ao conectar no Broker
    } else {
      Serial.print("falhou, rc=");
      Serial.print(client.state());
      Serial.println(" tentando novamente...");
      // O loop vai continuar e o LED vai piscar por causa do código acima
      delay(2000); 
    }
  }
}

void enviarTelemetria() {
  float vazao = map(analogRead(PIN_VAZAO), 0, 4095, 0, 500) / 10.0;     
  float corrente = map(analogRead(PIN_CORRENTE), 0, 4095, 0, 300) / 10.0; 
  float temperatura = map(analogRead(PIN_TEMP), 0, 4095, 200, 1100) / 10.0; 

  bool nivelOk = digitalRead(BTN_NIVEL);   
  bool pressaoOk = digitalRead(BTN_PRESSAO);
  bool erroHardware = digitalRead(BTN_ERRO);
  bool modoAuto = digitalRead(BTN_MODO);

  client.publish((String(topicPrefix) + "vazao").c_str(), String(vazao).c_str());
  client.publish((String(topicPrefix) + "corrente").c_str(), String(corrente).c_str());
  client.publish((String(topicPrefix) + "temperatura").c_str(), String(temperatura).c_str());
  client.publish((String(topicPrefix) + "nivel_status").c_str(), nivelOk ? "1" : "0");
  client.publish((String(topicPrefix) + "pressao_status").c_str(), pressaoOk ? "1" : "0");
  client.publish((String(topicPrefix) + "sensor_health").c_str(), erroHardware ? "1" : "0");
  client.publish((String(topicPrefix) + "modo_operacao").c_str(), modoAuto ? "AUTO" : "MANUAL");

  Serial.println(">>> Telemetria enviada.");
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_STATUS, OUTPUT);
  pinMode(BTN_NIVEL, INPUT_PULLUP);
  pinMode(BTN_PRESSAO, INPUT_PULLUP);
  pinMode(BTN_ERRO, INPUT_PULLUP);
  pinMode(BTN_MODO, INPUT_PULLUP);
  pinMode(BTN_RESET, INPUT_PULLUP);

  setup_wifi();
  client.setServer(mqtt_server, 1883);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  } else {
    digitalWrite(LED_STATUS, HIGH); // Garante que fica aceso se estiver tudo OK
  }
  
  client.loop();

  unsigned long now = millis();
  if (now - lastMsg > 1000) {
    lastMsg = now;
    enviarTelemetria();
  }
}