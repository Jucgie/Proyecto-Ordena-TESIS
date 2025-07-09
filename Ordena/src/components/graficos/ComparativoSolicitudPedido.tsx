import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import styled from 'styled-components';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Solicitud {
    fecha_creacion: string;
}

interface Pedido {
    fecha_entrega: string;
    estado_pedido_fk: number;
}

interface ComparativoProps {
    solicitudes: Solicitud[];
    pedidos: Pedido[];
}

const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top' as const,
            labels: {
                color: '#fff',
            },
        },
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: { color: '#ccc', stepSize: 1 },
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            title: {
                display: true,
                text: 'C a n t i d a d',
                color: '#FFD700',

                font: {
                    size: 14,
                    weight: 'bold',

                }
            }
        },
        x: {
            ticks: { color: '#ccc' },
            grid: { display: false },
            title: {
                display: true,
                text: 'Meses',
                color: '#FFD700',

                font: {
                    size: 14,
                    weight: 'bold',

                }
            }
        },
    },
};

export function ComparativoSolicitudesPedidos({ solicitudes, pedidos }: ComparativoProps) {
    const chartData = useMemo(() => {
        const labels: string[] = [];
        const solicitudesData: number[] = [];
        const pedidosData: number[] = [];

        const now = new Date();
        for (let i = 3; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            labels.push(d.toLocaleString('es-CL', { month: 'short', year: '2-digit' }).replace('.', ''));
            solicitudesData.push(0);
            pedidosData.push(0);
        }

        solicitudes.forEach(solicitud => {
            const fecha = new Date(solicitud.fecha_creacion);
            const monthDiff = (now.getFullYear() - fecha.getFullYear()) * 12 + (now.getMonth() - fecha.getMonth());
            if (monthDiff >= 0 && monthDiff < 3) {
                solicitudesData[3 - monthDiff]++;
            }
        });

        pedidos.forEach(pedido => {
            // Contar solo pedidos completados (estado_pedido_fk === 2)
            if (pedido.estado_pedido_fk === 2) {
                const fecha = new Date(pedido.fecha_entrega);
                const monthDiff = (now.getFullYear() - fecha.getFullYear()) * 12 + (now.getMonth() - fecha.getMonth());
                if (monthDiff >= 0 && monthDiff < 3) {
                    pedidosData[3 - monthDiff]++;
                }
            }
        });

        return {
            labels,
            datasets: [
                {
                    label: 'Solicitudes Hechas',
                    data: solicitudesData,
                    backgroundColor: 'rgba(255, 152, 0, 0.7)', // Naranja
                    borderColor: '#FF9800',
                    borderWidth: 1,
                    borderRadius: 5,
                },
                {
                    label: 'Pedidos Recibidos',
                    data: pedidosData,
                    backgroundColor: 'rgba(76, 175, 80, 0.7)', // Verde
                    borderColor: '#4CAF50',
                    borderWidth: 1,
                    borderRadius: 5,
                },
            ],
        };
    }, [solicitudes, pedidos]);

    return (
        <Container>
            <Bar options={options} data={chartData} />

        </Container>

    )
}

const Container = styled.div`
    border: 1px solid #5B5B5B;
    border-radius: 10px;
    height:15vw;
`
