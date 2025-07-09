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
import { SUCURSALES } from '../../constants/ubicaciones';


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
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            title: {
                display: true,
                text: 'C a n t i d a d   P e d i d o s',
                color: '#FFD700',

                font: {
                    size: 14,
                    weight: 'bold',

                }
            }
        },
        x: {
            ticks: {
                color: '#ccc'
            },
            grid: {
                display: false
            },
            title: {
                display: true,
                text: 'Sucursales',
                color: '#FFD700',

                font: {
                    size: 14,
                    weight: 'bold',

                }
            }
        }
    }
};



const COLORS = ['#FFD700', '#FFC300', '#FFAA00', '#FF8000', '#FF5733', '#C70039'];

interface PedidosSucursalProps {
    pedidos: any[];
    setState: () => void;
}



export function PedidosSucursal({ pedidos, setState }: PedidosSucursalProps) {
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

        // const sortedSucursales = Array.from(contadorSucursales.entries())
        const todasSucursales = SUCURSALES.map(sucursal => ({
            nombre: sucursal.nombre,
            pedidos: contadorSucursales.get(sucursal.nombre) || 0
        }));
        /*         .map(([nombre, cantidad]) => ({ nombre, pedidos: cantidad }))
                .sort((a, b) => b.pedidos - a.pedidos); */

        const sortedSucursales = todasSucursales.sort((a, b) => b.pedidos - a.pedidos);
        const labels = sortedSucursales.map(s => s.nombre);
        const data = sortedSucursales.map(s => s.pedidos);

        return {
            labels,
            datasets: [
                {
                    label: 'Total Pedidos',
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
                <Title>Total Pedidos de cada Sucursal</Title>
                <p style={{ color: 'white', textAlign: 'center', margin: 'auto' }}>
                    No hay datos de pedidos de sucursales para mostrar.
                </p>
            </ChartContainer>
        );
    }

    return (
        <Container>
            <div className='buttonClose'>
                <button onClick={setState}>Cerrar</button>

            </div>
            <ChartContainer>
                <Title>Total Pedidos de cada Sucursal</Title>
                <div style={{ position: 'relative', height: '100%', width: '100%' }}>
                    <Bar options={options as any} data={chartData} />
                </div>
            </ChartContainer>

        </Container>
    );

}
const Container = styled.div`
  position: fixed;
  height: 90vh;
  width: 70vw;
  left: 55%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-radius: 8px;
  background: #1E1E1E;
  box-shadow: 0px 0px 4px rgba(36, 36, 36, 0.7);
  padding: 32px;
  z-index: 100;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  justify-content: flex-start;
  overflow-y: auto;

    .buttonClose{
        display:flex;
        justify-content: flex-end;
        width:100%;

        button{
            border: 2px solid ;
            color:yellow;
            transition:0.5s ease-in-out;

            &:hover{
            border:2px solid rgb(197, 19, 19);
            color:white;
            }   
        }
  `
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