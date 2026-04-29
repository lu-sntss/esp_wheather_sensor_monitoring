/*
// Adicionando o escutar externo do mosquito no Ubuntu
sudo nano /etc/mosquitto/conf.d/teste.conf

listener 1883 0.0.0.0
allow_anonymous true


// Liberar porta temporariamente
sudo chmod a+rw /dev/ttyUSB0

// Adicionando passe no firewall
sudo ufw allow 1883/tcp

sudo systemctl restart mosquitto

// Deletar passe no firewall
sudo ufw delete allow 1883/tcp
*/

#include "HardwareSerial.h"
#include <Arduino.h> // Obrigatório no C++ padrão do PlatformIO
#include <Wire.h>
#include <BH1750.h>
#include <ESP8266WiFi.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BMP280.h>
#include <PubSubClient.h>

// Constantes de conexão
const char* ssid = "N305-3033124-LL-lu"; 
const char* password = ""; 
const char* mqtt_server = "10.42.0.1"; // O IP do notebook

// Instancia os objetos
WiFiClient espClient;
PubSubClient client(espClient);
BH1750 lightMeter;
Adafruit_BMP280 bmp;

// Variáveis de tempo para não travar o loop
unsigned long ultima_leitura = 0;
const long intervalo = 5000;
const long intervalo_leitura = 2000;

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Conectando ao WiFi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.print("WiFi conectado! IP: ");
  Serial.println(WiFi.localIP());
}

void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println(F("\n--- Iniciando Estacao Meteorologica via PlatformIO ---"));

  setup_wifi();
  
  // Configura o MQTT
  client.setServer(mqtt_server, 1883);

  Wire.begin();
  
  // Verifica e Inicia Sensores
  if (lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {
    Serial.println(F("[OK] Sensor BH1750 (Luz) pronto!"));
  } else {
    Serial.println(F("[ERRO] Falha no BH1750."));
  }

  if (bmp.begin(0x76)) {
    Serial.println(F("[OK] Sensor BMP280 (Clima) pronto!"));
  } else {
    Serial.println(F("[ERRO] Falha no BMP280."));
  }
}

void loop() {
  // Mantém ou reconecta no MQTT do Ubuntu
  if (!client.connected()) {
    unsigned long contagem_tentativa = 1;
    while (!client.connected()) {
      Serial.print("Tentando conectar ao Mosquitto MQTT...");
      Serial.print(" (Tentativa ");
      Serial.print(contagem_tentativa);
      Serial.print(")");
      if (client.connect("ESP8266_Estacao")) {
        Serial.println("\nConectado!");
      } else {
        Serial.print("\nFalha, rc=");
        Serial.print(client.state());
        Serial.println("Tentando de novo em 5 segundos...");
        delay(5000);
        contagem_tentativa++;
        
      }
    }
  }
  
  client.loop(); // Processa a conexão MQTT em background

  // Envia as leituras a cada 5 segundos sem travar o processador (sem delay)
  unsigned long tempo_atual = millis();
  if (tempo_atual - ultima_leitura >= intervalo_leitura) {
    ultima_leitura = tempo_atual;

    float lux = lightMeter.readLightLevel();
    float temp = bmp.readTemperature();
    float press = bmp.readPressure() / 100.0F;

    // Monta o pacote no braço
    char payload[100];
    snprintf(payload, sizeof(payload), "{\"temp\": %.2f, \"press\": %.2f, \"luz\": %.2f}", temp, press, lux);

    // Serial.print("Enviando dados pro Ubuntu: ");
    Serial.println(payload);
    
    // Grita os dados no tópico
    client.publish("estacao/dados", payload);
  }
}