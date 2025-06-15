import styled from "styled-components";
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);
export const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top" as const,
      labels:{
        color:'#ffffff'
      }
    },
  },
  scales:{
    x:{
        ticks:{
            color:'#ffffff',
        },
        grid:{
            color:'rgba(91,91,91,0.2)',
        },
    },
    y:{
        ticks:{
            color:'#ffffff',
        },
        grid:{
            color:'rgba(91,91,91,0.2)',
        },
    }
  }
};

const labels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export const datagrafica = {
  labels:labels,
  datasets: [
    {
      label: 'Pedidos',
      data: [5,3,4,0,1,2,3],
      backgroundColor: 'rgb(246, 255, 0)',
      borderRadius: 5,
      borderColor:'rgb(0, 0, 0)',
    }
  ],
};

export function Grafics_b() {
  
    return(
      <Container>
      <Bar options={options} data={datagrafica}
      width={"50%"}
      height={'35%'}

      /> 
      </Container>
    );
}

const Container = styled.div`
  display: flex;
  width: 50vh;
  height: 35vh;
  @media (max-width: 768px) {
    width: 100%;
    height: 35vh;
  }

`;