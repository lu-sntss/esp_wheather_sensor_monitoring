# Estação Meteorológica IoT (ESP8266 + Edge Gateway em C)

Este projeto implementa uma arquitetura robusta de IoT para monitoramento climático. Um ESP8266 coleta dados ambientais usando os sensores BMP280 e BH1750 e transmite via MQTT para um Edge Gateway local (rodando Ubuntu/Q4OS). 
O Gateway utiliza um ouvinte (Listener) escrito em C puro, otimizado para baixo consumo de recursos, que recebe os pacotes e os despacha para a nuvem via requisição HTTP POST (Vercel).

## 🛠 Hardware Utilizado
* ESP8266 (NodeMCU 1.0 ou genérico)
* Sensor BMP280 (Temperatura e Pressão atmosférica) - I2C
* Sensor BH1750 (Luminosidade) - I2C
* Servidor Gateway Local (PC com Ubuntu, ou dispositivo de baixo custo como Patroplo/Q4OS)

---

## 💻 1. Configuração do Firmware (ESP8266)

  O código embarcado foi desenvolvido utilizando o **PlatformIO** no VS Code. Não é necessário instalar bibliotecas manualmente na IDE do Arduino.
  
  ### Dependências (`platformio.ini`)
  Ao clonar este repositório e abrir a pasta do firmware no PlatformIO, garanta que o seu arquivo `platformio.ini` possua as seguintes configurações e bibliotecas:
  
  
  [env:esp8266]
  platform = espressif8266
  board = esp12e ; ou nodemcuv2
  framework = arduino
  monitor_speed = 115200
  
  lib_deps = 
  	claws/BH1750 @ ^1.3.0
  	adafruit/Adafruit BMP280 Library @ ^2.6.8
  	adafruit/Adafruit Unified Sensor @ ^1.1.14
  	knolleary/PubSubClient @ ^2.8

## 2. Configuração do Gateway Local (Ubuntu)

  O Gateway precisa atuar como um Broker MQTT e possuir as ferramentas de desenvolvimento em C para compilar o nosso Listener.
  2.1 Instalando os Pacotes Essenciais
  
  Abra o terminal e execute:
      Bash
      
      sudo apt update
      sudo apt install mosquitto mosquitto-clients
      sudo apt install libmosquitto-dev libcurl4-openssl-dev
    
  2.2 Configurando a Rede e Segurança do Mosquitto
  
  Por padrão, o Mosquitto bloqueia conexões externas. Precisamos liberar a porta 1883 e permitir acessos anônimos para receber os dados do ESP8266.
  
  Crie um arquivo de configuração:
    Bash
    
    sudo nano /etc/mosquitto/conf.d/teste.conf
  
  Adicione as seguintes linhas, salve (Ctrl+O, Enter) e saia (Ctrl+X):
    listener 1883 0.0.0.0
    allow_anonymous true
  
  Reinicie o serviço para aplicar:
    Bash
    
    sudo systemctl restart mosquitto
  
  2.3 Regras de Firewall (UFW)
  
  Caso o seu firewall bloqueie o tráfego MQTT que vem pelo Wi-Fi, libere a porta e as permissões de leitura serial:
    Bash
    
    sudo ufw allow 1883/tcp
    sudo chmod a+rw /dev/ttyUSB0
  
  (Para remover a regra do firewall posteriormente, use: sudo ufw delete allow 1883/tcp).

## 3. Compilando e Rodando o Listener em C

  O arquivo C atua como um Subscriber eficiente na rede local e despacha os dados para a Web usando a biblioteca libcurl.
  
  Para compilar o código, linkando as duas bibliotecas de rede necessárias, rode:
    Bash
    
    gcc listener.c -o ouvinte -lmosquitto -lcurl
  
  Para iniciar a escuta da rede e o encaminhamento de dados:
  Bash
  
  ./ouvinte

## 4. Ferramentas de Teste (Debugging)

  Caso precise apenas escutar o tráfego da rede sem rodar o script em C:
      Via Terminal no Linux:
        Bash
        mosquitto_sub -h localhost -t "estacao/dados" -v
        (Se estiver rodando em um PC diferente do Broker, substitua localhost pelo IP do Gateway).
      Via Interface Gráfica (Windows/Mac):
        Baixe o MQTT Explorer. Ele possui versões Portable (não exige instalação ou permissão de administrador). Basta conectar informando o IP do Gateway e a porta 1883.
