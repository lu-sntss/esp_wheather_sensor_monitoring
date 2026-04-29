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

    const intervalo = setInterval(puxarDados, 2000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <h1 className="text-3xl font-bold mb-8 text-center text-blue-400">
        Estação Meteorológica IoT
      </h1>

      <div className="max-w-5xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl mb-4 text-gray-300">Temperatura e Pressão ao vivo</h2>
        
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
                // Linha de temperatura
                <Line yAxisId="left" type="monotone" dataKey="temp" stroke="#F87171" name="Temperatura (°C)" strokeWidth={3} isAnimationActive={false} />
                // Linha de pressão
                <Line yAxisId="right" type="monotone" dataKey="press" stroke="#60A5FA" name="Pressão (hPa)" strokeWidth={3} isAnimationActive={false} />
                // Linha de luz
                <Line yAxisId="right" type="monotone" dataKey="luz" stroke="#edeb6d" name="Luz (Lux)" strokeWidth={3} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Aguardando dados do ESP8266...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}