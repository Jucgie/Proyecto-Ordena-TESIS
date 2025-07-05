import React, { useMemo } from 'react';

import styled from "styled-components";

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend
);

export const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
        backgroundColor: '#232323',
        titleColor: '#FFD700',
        bodyColor: '#fff',
        borderColor: '#444',
        borderWidth: 1,
    },
  },
  scales: {
    y: {
        beginAtZero: true,
        ticks: { color: '#ccc', stepSize: 1 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
    },
    x: {
        ticks: { color: '#ccc' },
        grid: { display: false }
    }
  }
};

const ChartContainer = styled.div`
    height: 100%;
    width: 100%;
    min-height: 280px;
    background-color: rgb(20, 20, 20);
    padding: 20px;
    border-radius: 10px;
    border: 1px solid rgb(36, 34, 34);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
`;

const Title = styled.h3`
    color: #FFD700;
    margin-bottom: 20px;
    text-align: center;
    margin-top: 0;
`;

const COLORS = ['#FFD700', '#FFC300', '#FFAA00', '#FF8000', '#FF5733', '#C70039'];

interface PedidosSucursalProps {
    pedidos: any[];
}

export function PedidosSucursal({ pedidos }: PedidosSucursalProps) {
  const chartData = useMemo(() => {
    if (!pedidos || pedidos.length === 0) {
        return { labels: [], datasets: [] };
    }

    const contadorSucursales = new Map<string, number>();
    pedidos.forEach(pedido => {
        if (pedido.sucursal_nombre) {
            contadorSucursales.set(
                pedido.sucursal_nombre,
                (contadorSucursales.get(pedido.sucursal_nombre) || 0) + 1
            );
        }
    });

    const sortedSucursales = Array.from(contadorSucursales.entries())
        .map(([nombre, cantidad]) => ({ nombre, pedidos: cantidad }))
        .sort((a, b) => b.pedidos - a.pedidos);

    const labels = sortedSucursales.map(s => s.nombre);
    const data = sortedSucursales.map(s => s.pedidos);

    return {
        labels,
        datasets: [
            {
                label: 'Pedidos',
                data,
                backgroundColor: COLORS,
                borderColor: 'rgba(255, 215, 0, 0.5)',
                borderWidth: 1,
                borderRadius: 5,
            },
        ],
    };
  }, [pedidos]);

  if (!chartData.datasets.length || chartData.datasets[0].data.length === 0) {
    return (
        <ChartContainer>
            <Title>Pedidos por Sucursal</Title>
            <p style={{ color: 'white', textAlign: 'center', margin: 'auto' }}>
                No hay datos de pedidos de sucursales para mostrar.
            </p>
        </ChartContainer>
    );
  }

  return (
    <ChartContainer>
        <Title>Pedidos por Sucursal</Title>
        <div style={{ position: 'relative', height: '100%', width: '100%' }}>
            <Bar options={options as any} data={chartData} />
        </div>
    </ChartContainer>
  );

}