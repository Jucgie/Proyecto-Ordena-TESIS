import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import styled from 'styled-components';
import { Container } from '@mui/material';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

interface Solicitud {
    estado?: string;
}

interface TasaAprobacionDoughnutProps {
    solicitudes: Solicitud[];
}



export function TasaAprobacionDoughnut({ solicitudes }: TasaAprobacionDoughnutProps) {
    const { charData, porcentaje, counts } = useMemo(() => {
        const total = solicitudes.length;
        if (total === 0) {
            return {
                charData: {
                    datasets: [{ data: [100], backgroundColor: ['#333'] }],
                    labels: ['Sin datos'],
                },
                porcentaje: 0,
                counts: { aprobadas: 0, denegadas: 0, pendientes: 0, total: 0 }
            };
        }

        const aprobadas = solicitudes.filter(s => s.estado?.toLowerCase() === 'aprobada').length;
        const denegadas = solicitudes.filter(s => s.estado?.toLowerCase() === 'denegada').length;
        const pendientes = total - aprobadas - denegadas;

        const porcentaje = Math.round((aprobadas / total) * 100);

        return {
            charData: {
                datasets: [
                    {
                        data: [aprobadas, denegadas, pendientes],
                        backgroundColor: ['#4CAF50', '#f44336', '#FF9800'],
                        borderColor: '#1E1E1E',
                        borderWidth: 3,
                    },
                ],
                labels: ['Aprobadas', 'Denegadas', 'Pendientes'],
            },
            porcentaje: porcentaje,
            counts: { aprobadas, denegadas, pendientes, total }


        };
    }, [solicitudes]);

    return (
        <Container>

            <ChartWrapper>
                <Doughnut
                    data={charData}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '55%',
                        plugins: {
                            legend: {
                                display: true,
                            },
                            tooltip: {
                                enabled: true,
                            },
                        },
                    }}
                />
                <PercentageText>
                    {porcentaje}<span>%</span>
                </PercentageText>
                
            </ChartWrapper>

            <Summary>
                    <SummaryItem color="#4CAF50">
                        <span>Aprobadas</span>
                        <strong>{counts.aprobadas}</strong>
                    </SummaryItem>
                    <SummaryItem color="#f44336">
                        <span>Denegadas</span>
                        <strong>{counts.denegadas}</strong>
                    </SummaryItem>
                    <SummaryItem color="#FF9800">
                        <span>Pendientes</span>
                        <strong>{counts.pendientes}</strong>
                    </SummaryItem>
                    <SummaryItem color="#ccc" style={{ borderTop: '1px solid #444', paddingTop: '8px', marginTop: '8px' }}>
                        <span>Total</span>
                        <strong>{counts.total}</strong>
                    </SummaryItem>
                </Summary>
        </Container>

    );
}

const ChartWrapper = styled.div`
    position: relative;
    height: 19vw;
    width: 14vw;
    margin: 20px auto;
    border: 1px solid rgb(91, 91, 91);
    padding:10px;
    border-radius:10px;
`;

const PercentageText = styled.div`
    position: absolute;
    top: 65%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 2.2rem;
    font-weight: 700;
    text-align: center;

    span {
        font-size: 1.2rem;
        font-weight: 400;
        color: #FFD700;
    }
`;
const Summary = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 200px;
    gap: 8px;
    background:#363636;
    padding:20px;
    border-radius:10px;
`;

const SummaryItem = styled.div<{ color: string }>`
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;

    span {
        color: #ccc;
        &::before {
            content: '●';
            color: ${props => props.color};
            margin-right: 8px;
        }
    }
`;