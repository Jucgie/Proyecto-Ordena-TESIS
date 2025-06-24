import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

import styled from 'styled-components';

import {useMemo } from 'react';
//import { each } from 'chart.js/helpers';

//Obtención de datos de la api por medio del archivo store
import { useBodegaStore } from '../../store/useBodegaStore';
import { useHistorialStore } from "../../store/useHistorialStore";

ChartJS.register(ArcElement, Tooltip, Legend);


export function Grafics_Pie() {

  //Definición de constantes para obtener los datos 
  const pedidos = useHistorialStore(state=>state.pedidos);
  const SolicitudesTrasnferidas = useBodegaStore(state=>state.solicitudes);
  

  //Definición de Memo para guardar datos previos, evitanto cargar constantemente si no hay cambios 
    const data = useMemo(() =>{
      const TransferenciaCount=SolicitudesTrasnferidas.length;
      const pedidosEnCamino = pedidos.filter(p => p.estado_pedido_fk === 1).length;
      const pedidosCompletados = pedidos.filter(p => p.estado_pedido_fk === 2).length;
      
        const counts=[
          TransferenciaCount,
          pedidosCompletados,
          pedidosEnCamino,
          
        ]

        return {
  labels: ['No Iniciado', 'En Camino', 'Terminado'],
  datasets: [
    {
      label: 'Pedidos',
      data: counts,
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 163, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
       // 'rgba(75, 192, 192, 0.5)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
    // const pedidosCompletados = pedidos.filter(p => p.estado_pedido_fk === 2).length;    'rgba(75, 192, 192, 1)',
      ],
      borderWidth: 1,
    },
  ],
};

    }, [pedidos, SolicitudesTrasnferidas])

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