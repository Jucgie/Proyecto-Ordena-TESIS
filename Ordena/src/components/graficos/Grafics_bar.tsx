//Obtención de datos de la api por medio del archivo store
import { useHistorialStore } from "../../store/useHistorialStore";

import { useBodegaStore } from "../../store/useBodegaStore";

import { useAuthStore } from "../../store/useAuthStore";

import { useMemo, useState } from "react";

import styled from "styled-components";

import Radio from '@mui/material/Radio';


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
import { formatFechaChile } from '../../utils/formatFechaChile';
import { yellow } from "@mui/material/colors";

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
        color: '#ffffff'
      },
      grid: {
        color: 'rgba(91,91,91,0.2)',
      },
      title:{
        display:true,
        text:'Días de la Semana',
        color: '#FFD700',

        font:{
          size:14,
          weight: 'bold',
          
        }
      }
    },
    y: {
      ticks: {
        color: '#ffffff',font: { size: 10 }, stepSize:1
      },
      grid: {
        color: 'rgba(91,91,91,0.2)',
      },
      title:{
        display:true,
        text:'C a n t i d a d',
        color: '#FFD700',
        font:{
          size:14,
          weight: 'bold',
          
        }
      }
    }
  }
};

export function Grafics_b() {
  //configuracion del gráfico 
  const labels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  //se obtiene datos de la constante de historial store
  const pedidos = useHistorialStore(state => state.pedidos);


  const {usuario} = useAuthStore();

  const[filtroTipo, setFiltroTipo] = useState('todos');

  //Definiciónde Memo para guardar datos previos, evitanto cargar constantemente si no hay cambios 
  const datagrafica = useMemo(() => {
    let pedidosMostradosPorRol = pedidos;

    if (usuario?.tipo === 'bodega' && usuario.bodega) {
      pedidosMostradosPorRol = pedidos.filter(p => String(p.bodega_fk)===String(usuario.bodega));
    } else if (usuario?.tipo === 'sucursal' && usuario.sucursal) {
      pedidosMostradosPorRol =pedidos.filter(p => String(p.sucursal_fk)===String(usuario.sucursal));
    }

    let pedidosMostrados = pedidosMostradosPorRol;

    //desarrollo de filtro solo para usuario de bodega
    if (usuario?.tipo === 'bodega'){
      if(filtroTipo === 'sucursales'){
        pedidosMostrados = pedidosMostradosPorRol.filter(p => p.sucursal_fk !== null);
      } else if (filtroTipo === 'proveedores'){
        pedidosMostrados = pedidosMostradosPorRol.filter(p=>p.sucursal_fk == null);
      }
    }

  //Array para contar los pedidos, empezando con un minimo de 0
  const pedidosPorDia = [0, 0, 0, 0, 0, 0, 0];

  //Se obtiene la cantidad de pedidos según el día.
  pedidosMostrados.forEach(p => {
    if (p.fecha_entrega){
      const fechaObj = new Date(p.fecha_entrega);
      if (!isNaN(fechaObj.getTime())) {
        const dia = (fechaObj.getDay() + 6) % 7; // Lunes=0, Domingo=6
        pedidosPorDia[dia]++;
      }
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
},[pedidos, usuario,filtroTipo]);

  return (
    <Container>
      {usuario?.tipo === 'bodega' && (
        <FilterContainer>
          <label>
          <Radio value={"todos"} 
            checked={filtroTipo === 'todos'} 
            onChange={() => setFiltroTipo('todos')} 
            sx={{color:'white', 
              '&.Mui-checked': {
            color: "yellow",
          }}}/>
            Todos
          </label>
          <label>
            <Radio value="sucursales" 
              checked={filtroTipo === 'sucursales'} 
              onChange={()=>setFiltroTipo('sucursales')} 
              sx={{color:'white', '&.Mui-checked': {
            color: "yellow",
          }}}/>
            Sucursales
          </label>
          <label>
            <Radio value={"proveedores"} 
              checked={filtroTipo === 'proveedores'} 
              onChange={() => setFiltroTipo('proveedores')}
              sx={{color:'white', '&.Mui-checked': {
            color: "yellow",
          }}}/>
            Proveedores
          </label>
        </FilterContainer>
      )}
      <ContainerChart>
        
          <Bar options={options} data={datagrafica}
            width={"50%"}
            height={'40vh'}
          />
      </ContainerChart>
    </Container>
  );

}
const Container = styled.div`
  display: flex;
  flex-direction:column;
  width: 52vh;
  height: 40vh;
  @media (max-width: 768px) {
    width: 100%;
    height: 35vh;
  }

`;

const FilterContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-bottom:5px;
  color: #ccc;
  font-size: 14px;


  label {
    display: flex;
    align-items: center;
    cursor: pointer;
    color: white;
  }

`;

const ContainerChart = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;