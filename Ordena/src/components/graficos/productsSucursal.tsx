import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import styled from 'styled-components';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface SolicitudProducto {
    producto_nombre: string;
    cantidad: string | number;
}

interface Solicitud {
    productos?: SolicitudProducto[];
}

interface TopProductosProps {
    solicitudes: Solicitud[];
}

const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
        legend: {
            display: false,
        },
        tooltip: {
            backgroundColor: '#232323',
            titleColor: '#FFD700',
            bodyColor: '#fff',
        },
    },
    scales: {
        x: {
            ticks: { color: '#ccc' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            title: {
                display: true,
                text: 'Unidades Solicitadas',
                color: '#FFD700',
                font: {
                    size: 14,
                    weight: 'bold',
                    lineHeight: 1.1,

                }
            }
        },
        y: {
            ticks: { color: '#ccc', font: { size: 12 } },
            grid: { display: false },
            title: {
                display: true,
                text: 'P r o d u c t o',
                color: '#FFD700',
                font: {
                    size: 14,
                    weight: 'bold',
                    lineHeight: 1.1,

                }
            }
        },
    },
};

export function TopProductosSolicitados({ solicitudes }: TopProductosProps) {
    const chartData = useMemo(() => {
        if (!solicitudes || solicitudes.length === 0) {
            return { labels: [], datasets: [] };
        }

        const contadorProductos = new Map<string, number>();

        solicitudes.forEach(solicitud => {
            (solicitud.productos || []).forEach(producto => {
                const cantidad = Number(producto.cantidad) || 0;
                if (producto.producto_nombre) {
                    contadorProductos.set(
                        producto.producto_nombre,
                        (contadorProductos.get(producto.producto_nombre) || 0) + cantidad
                    );
                }
            });
        });

        const sortedProductos = [...contadorProductos.entries()]
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        if (sortedProductos.length === 0) {
            return { labels: [], datasets: [] };
        }

        const labels = sortedProductos.map(([nombre]) => nombre);
        const data = sortedProductos.map(([, cantidad]) => Math.round(cantidad));

        return {
            labels,
            datasets: [
                {
                    label: 'Unidades Solicitadas',
                    data,
                    backgroundColor: 'rgba(255, 215, 0, 0.7)',
                    borderColor: '#FFD700',
                    borderWidth: 1,
                    borderRadius: 5,
                },
            ],
        };
    }, [solicitudes]);

    if (chartData.datasets.length === 0 || chartData.datasets[0].data.length === 0) {
        return <p style={{ color: 'white', textAlign: 'center', margin: 'auto' }}>No hay datos de productos solicitados.</p>;
    }

    return (
        <Container>
            <Bar options={options} data={chartData}
                height={'350vw'}
                width={'500vw'}
            />
        </Container>
    );
}

const Container = styled.div`
    width: 100%;
    height:20vw;
    `