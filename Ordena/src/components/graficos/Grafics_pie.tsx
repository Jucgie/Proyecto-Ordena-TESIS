import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import styled from 'styled-components';

ChartJS.register(ArcElement, Tooltip, Legend);

export const data = {
  labels: ['No Iniciado', 'Completado', 'En proceso', 'Anulado'],
  datasets: [
    {
      label: 'Pedidos',
      data: [12, 19, 3, 5],
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 163, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
        'rgba(75, 192, 192, 0.5)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
      ],
      borderWidth: 1,
    },
  ],
};

export function Grafics_Pie() {
  return (

    <Container>
    <Pie 
    data={data}
    
    />
    </Container>

  );
  
}


const Container = styled.div`
    width: 100%;
    height: 100%;
`