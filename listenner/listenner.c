/*

gcc listenner.c -o ouvinte -lmosquitto -lcurl

*/

#include <stdio.h>
#include <mosquitto.h>
#include <curl/curl.h>

const char* VERCEL_URL = "https://esp-wheather-sensor-monitoring.vercel.app/api/dados";
// const char* VERCEL_URL = "http://localhost:3000/api/dados";


// FUnção para empacotar o json e enviar ao vercel
void enviar_para_vercel(const char* json_payload){
    CURL *curl;
    CURLcode response;

    curl = curl_easy_init();
    if (curl){
        //COnfigura o cabeçalho, indicando q que o formato é JSON
        struct curl_slist *headers = NULL;
        headers = curl_slist_append(headers, "Content-Type: application/json");

        // Prepara o pacote
        curl_easy_setopt(curl, CURLOPT_URL, VERCEL_URL);
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, json_payload);

        response = curl_easy_perform(curl);

        if (response != CURLE_OK){
            fprintf(stderr, "[X] Erro no envio do pacote para o vercel: %s\n", curl_easy_strerror(response));
        } else {
            printf("Pacote enviado com sucesso\n");
        }

        // Limpa a memória
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
    }
}

// Função callback chamada quando uma mensagem chega no tópico/url assinado.
void on_message(struct mosquitto *mosq, void *obj, const struct mosquitto_message *msg){
    printf("Nova leitura recebida no tópico [%s]: %s\n", msg->topic, (char *)msg->payload);

    enviar_para_vercel((char*)msg->payload);
}

// Função de callback chamada quando a exonexão com o broker deve ser estabelecida
void on_connect(struct mosquitto *mosq, void *obj, int rc){
    if (rc == 0){
        printf("Dispositivo conectado ao Broker com sucesso!\n");
        // Inscreve o url assim que conectar
        mosquitto_subscribe(mosq, NULL, "estacao/dados",0);
    } else {
        fprintf(stderr,"Erro na conexxão: %s\n", mosquitto_connack_string(rc));
    }
}

int enviar_para_esp(int payload){
    int response;

} int response;

void check_ping(int current_sequence){
    current_sequence++;

    enviar_para_esp(current_sequence);

}

int main(){
    struct mosquitto *mosq;
    int rc;
    int current_sequence = 0;

    // Inicializa a biblioteca cURL
    curl_global_init(CURL_GLOBAL_ALL);

    // Inicializa biblioteca Mosquitto para comunicação
    mosquitto_lib_init();

    mosq = mosquitto_new("Workstation_Listener",true, NULL);
    if (!mosq){
        fprintf(stderr,"Erro ao criar instancia do Mosquitto.\n");
        return 1;
    }

    // Define os callbacks
    mosquitto_connect_callback_set(mosq,on_connect);
    mosquitto_message_callback_set(mosq,on_message);

    rc = mosquitto_connect(mosq, "localhost", 1883, 60);
    if(rc != MOSQ_ERR_SUCCESS){
        mosquitto_destroy(mosq);
        fprintf(stderr,"Erro ao conectar: %s\n", mosquitto_strerror(rc));
        return 1;
    }

    mosquitto_loop_forever(mosq, -1,1);

    mosquitto_destroy(mosq);
    mosquitto_lib_cleanup();
    curl_global_cleanup();
    return 0;
}