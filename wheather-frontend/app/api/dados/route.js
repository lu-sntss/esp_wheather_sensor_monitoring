import { NextResponse } from 'next/server';

// Banco de dados em memória (Apenas para esse teste sem persistência)
let historico = [];

// O listener vai fazer um POST para cá
export async function POST(request) {
    const data = await request.json();
    
    // Adiciona a hora atual na leitura para o eixo X do gráfico
    const leitura = {
        ...data,
        hora: new Date().toLocaleTimeString('pt-BR', { hour12: false })
    };

    historico.push(leitura);

    // Guarda apenas as últimas 20 leituras para o gráfico não virar uma bagunça
    if (historico.length > 20) {
        historico.shift();
    }

    return NextResponse.json({ success: true, recebido: leitura });
}

// O Front-end (React) vai fazer um GET aqui para pegar os dados e desenhar o gráfico
export async function GET() {
    return NextResponse.json(historico);
}