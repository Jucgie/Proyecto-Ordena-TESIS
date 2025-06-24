//Obtención de datos de la api por medio del archivo store
import { useHistorialStore } from "../../store/useHistorialStore";

import { useMemo } from "react";

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
      labels: {
        color: '#ffffff'
      }
    },
  },
  scales: {
    x: {
      ticks: {
        color: '#ffffff',
      },
      grid: {
        color: 'rgba(91,91,91,0.2)',
      },
    },
    y: {
      ticks: {
        color: '#ffffff',
      },
      grid: {
        color: 'rgba(91,91,91,0.2)',
      },
    }
  }
};

export function Grafics_b() {
  //configuracion del gráfico 
  const labels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  //se obtiene datos de la constante de historial store
  const pedidos = useHistorialStore(state => state.pedidos);



  //Definiciónde Memo para guardar datos previos, evitanto cargar constantemente si no hay cambios 
  const datagrafica = useMemo(() => {

  //Array para contar los pedidos, empezando con un minimo de 0
  const pedidosPorDia = [0, 0, 0, 0, 0, 0, 0];

  //Se obtiene la cantidad de pedidos según el día.
  pedidos.forEach(p => {
    if (p.solicitud_fk?.fecha_creacion){
      const fecha = new Date(p.solicitud_fk.fecha_creacion);

      const dia = (fecha.getDay() + 6) % 7; // 
      pedidosPorDia[dia]++;
    }
  });


  return {
    labels: labels,
    datasets: [
      {
        label: 'Pedidos por Día',
        data: pedidosPorDia,
        backgroundColor: 'rgb(246, 255, 0)',
        borderRadius: 5,
        borderColor: 'rgb(0, 0, 0)',
      }
    ],
  };
},[pedidos]);

  return (
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