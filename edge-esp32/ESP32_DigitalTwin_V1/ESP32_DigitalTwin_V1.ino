#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// --- CONFIGURAÇÕES DE CONEXÃO ---
const char* ssid = "G15_VINICIUS";
const char* password = "3*w372C0";
const char* mqtt_server = "broker.hivemq.com"; // Usando o Broker Público para o teste no site

// --- DEFINIÇÃO DE PINOS ---
#define DHTPIN 4       // DHT11 no pino D4
#define DHTTYPE DHT11
#define POT_PIN 34     // Potenciômetro (Vazão) no D34
#define LED_PIN 2

DHT dht(DHTPIN, DHTTYPE);
WiFiClient espClient;
PubSubClient client(espClient);

// --- TÓPICOS MQTT (CONTRATO DE DADOS) ---
const char* topic_vazao = "unisal/projeto/bomba_01/telemetria/vazao";
const char* topic_clima = "unisal/projeto/bomba_01/telemetria/clima_interno"; //sbl/client/482888/bomba1/telemetria/sensorx/temperatura

// --- PROTÓTIPOS DAS TASKS (PILAR: SISTEMAS OPERACIONAIS) ---
void taskMQTT(void *pvParameters);
void taskSensors(void *pvParameters);

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  dht.begin();

  // Conexão WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { 
    delay(500); 
    Serial.print("."); 
  }
  Serial.println("\n✅ WiFi Conectado!");

  client.setServer(mqtt_server, 1883);

  // Criação das Tarefas Independentes (FreeRTOS)
  xTaskCreatePinnedToCore(taskMQTT, "TaskMQTT", 5000, NULL, 2, NULL, 1);
  xTaskCreatePinnedToCore(taskSensors, "TaskSensors", 5000, NULL, 1, NULL, 0);
}

void loop() {
  // O loop fica vazio. O FreeRTOS gerencia as tasks acima.
}

// --- TASK 1: GERENCIAMENTO DA CONEXÃO MQTT ---
void taskMQTT(void *pvParameters) {
  for (;;) {
    if (!client.connected()) {
      Serial.print(" tentando conectar MQTT...");
      if (client.connect("ESP32_Vinicius_B01")) {
        Serial.println(" SUCESSO!");
      } else {
        vTaskDelay(5000 / portTICK_PERIOD_MS);
      }
    }
    client.loop();
    vTaskDelay(10 / portTICK_PERIOD_MS);
  }
}

// --- TASK 2: LEITURA DE SENSORES E ENVIO JSON ---
void taskSensors(void *pvParameters) {
  unsigned long lastClimaTime = 0;
  
  for (;;) {
    // 1. TELEMETRIA DE VAZÃO (Alta Frequência - Cada 1 segundo)
    int potValue = analogRead(POT_PIN);
    float vazaoSimulada = map(potValue, 0, 4095, 0, 100); 

    StaticJsonDocument<128> docVazao;
    docVazao["id"] = "B01";
    docVazao["vazao"] = vazaoSimulada;
    
    char bufferVazao[128];
    serializeJson(docVazao, bufferVazao);
    client.publish(topic_vazao, bufferVazao);

    // 2. TELEMETRIA DE CLIMA (Baixa Frequência - Cada 10 segundos)
    if (millis() - lastClimaTime > 10000) {
      float h = dht.readHumidity();
      float t = dht.readTemperature();

      if (!isnan(h) && !isnan(t)) {
        StaticJsonDocument<128> docClima;
        docClima["id"] = "B01";
        docClima["temp"] = t;
        docClima["umid"] = h;

        char bufferClima[128];
        serializeJson(docClima, bufferClima);
        client.publish(topic_clima, bufferClima);
        lastClimaTime = millis();
      }
    }
    vTaskDelay(1000 / portTICK_PERIOD_MS); 
  }
}