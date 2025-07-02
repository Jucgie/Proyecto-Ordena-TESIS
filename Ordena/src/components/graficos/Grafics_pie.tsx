import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

import styled from 'styled-components';

import {useMemo } from 'react';
//import { each } from 'chart.js/helpers';

//Obtención de datos de la api por medio del archivo store
import { useBodegaStore } from '../../store/useBodegaStore';
import { useHistorialStore } from "../../store/useHistorialStore";
import { useAuthStore } from '../../store/useAuthStore';

ChartJS.register(ArcElement, Tooltip, Legend);


export function Grafics_Pie() {

  //Definición de constantes para obtener los datos 
  const pedidos = useHistorialStore(state=>state.pedidos);
  const solicitudesTransferidas = useBodegaStore(state=>state.solicitudesTransferidas);
  const {usuario} = useAuthStore();
  

  //Definición de Memo para guardar datos previos, evitanto cargar constantemente si no hay cambios 
    const data = useMemo(() =>{
      let pedidosMostrados = pedidos;


      if (usuario?.tipo === 'bodega' && usuario.bodega) {
        pedidosMostrados = pedidos.filter(p => String(p.bodega_fk)===String(usuario.bodega));

      }else if (usuario?.tipo === 'sucursal' && usuario.sucursal) {
        pedidosMostrados = pedidos.filter(p => String(p.sucursal_fk) === String(usuario.sucursal));
      // Las sucursales no ven las solicitudes pendientes de despacho en la bodega
    }


      const pedidosEnCamino = pedidosMostrados.filter(p => p.estado_pedido_fk === 1).length;
      const pedidosCompletados = pedidosMostrados.filter(p => p.estado_pedido_fk === 2).length;
      const pedidosPendientes = pedidosMostrados.filter(p => p.estado_pedido_fk === 3).length;
      
        const counts=[
          
          pedidosPendientes,
          pedidosEnCamino,
          pedidosCompletados,
          
        ]

        return {
  labels: ['Pendiente','En Camino', 'Terminado'],
  datasets: [
    {
      label: 'Pedidos',
      data: counts,
      backgroundColor: [
                  '#FF9800', // pendiente
                '#2196F3',   // En Camino
                '#4CAF50',   // Completado
 
      ],
      borderColor: [
                'rgb(255, 232, 99)',
                'rgb(75, 151, 192)',
                'rgb(69, 235, 54)',
      ],
      borderWidth: 1,
    },
  ],
};

}, [pedidos, solicitudesTransferidas,usuario]);

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