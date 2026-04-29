"use client"; // Diz ao Next que isso roda no navegador

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Home() {
  const [dados, setDados] = useState([]);

  // Fica puxando os dados da nossa API a cada 2 segundos
  useEffect(() => {
    const puxarDados = async () => {
      try {
        const res = await fetch('/api/dados');
        const json = await res.json();
        setDados(json);
      } catch (error) {
        console.error("Erro ao buscar dados", error);
      }
    };

    const intervalo = setInterval(puxarDados, 500); // Configuração de intervalo
    return () => clearInterval(intervalo);
  }, []);

  // Pega sempre a última leitura para atualizar a barra de luz
  const ultimaLeitura = dados.length > 0 ? dados[dados.length - 1] : { temp: 0, press: 0, luz: 0 };
  
  // Define o nosso "100%" de luz. Se for usar ao ar livre, mude para 10000
  const MAX_LUZ = 1000; 
  // Calcula a porcentagem travando no máximo em 100%
  const percentLuz = Math.min((ultimaLeitura.luz / MAX_LUZ) * 100, 100);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <h1 className="text-3xl font-bold mb-8 text-center text-blue-400">
        Estação Meteorológica IoT
      </h1>

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
        
        {/* Painel do Gráfico (Temp e Pressão) */}
        <div className="flex-1 bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl mb-4 text-gray-300">Clima Histórico</h2>
          
          <div className="h-96 w-full">
            {dados.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dados} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="hora" stroke="#9CA3AF" />
                  <YAxis yAxisId="left" stroke="#F87171" domain={['auto', 'auto']} />
                  <YAxis yAxisId="right" orientation="right" stroke="#60A5FA" domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                  <Legend />
                  {/* Linha de temperatura */}
                  <Line yAxisId="left" type="monotone" dataKey="temp" stroke="#F87171" name="Temp (°C)" strokeWidth={3} isAnimationActive={false} />
                  {/* Linha de pressão */}
                  <Line yAxisId="right" type="monotone" dataKey="press" stroke="#60A5FA" name="Pressão (hPa)" strokeWidth={3} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Aguardando dados do ESP8266...
              </div>
            )}
          </div>
        </div>

        {/* Painel da Luminosidade (Medidor Vertical) */}
        <div className="w-full md:w-32 bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center justify-between">
          <h2 className="text-gray-300 font-semibold mb-2">Luz</h2>
          
          {/* A Barra de Progresso Vertical */}
          <div className="w-10 h-64 bg-gray-700 rounded-full overflow-hidden flex items-end relative shadow-inner">
            <div 
              className="w-full bg-yellow-400 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(250,204,21,0.6)]" 
              style={{ height: `${percentLuz}%` }}
            ></div>
          </div>
          
          <div className="mt-4 flex flex-col items-center">
            <span className="text-2xl font-bold text-yellow-400">{ultimaLeitura.luz}</span>
            <span className="text-xs text-gray-400">LUX</span>
          </div>
        </div>

      </div>
    </div>
  );
}