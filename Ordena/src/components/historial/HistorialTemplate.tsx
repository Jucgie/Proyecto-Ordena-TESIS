import { useState } from "react";
import { BtnHistorial } from "../button/ButtonHist";
import { InventarioHistorial } from "../modulosHistorial/InventarioHistorial";
import { PedidoHistorial } from "../modulosHistorial/PedidosHistorial";     
import { EmpleadoHistorial } from "../modulosHistorial/EmpleadosHistorial";
import styled from "styled-components";
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';



export function HistorialTemplate() {

    const [historial, setHistorial] = useState(false);
    const [pedido, setPedido] = useState(false);
    const [empleado,setEmpleado] = useState(false);

    return(
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">


            <ContainerButtons>   
                <BtnHistorial titulo={
                    <>
                    <ContentPasteIcon sx={{ fontSize: 85, display:"flex",justifyContent:"center",color:"#FFD700"}}/>
                    Inventario
                    </>
                    } funcion={()=>setHistorial(true)} background="#5a5858"/>
                <BtnHistorial titulo={
                    <>
                        <LocalShippingIcon sx={{fontSize:85, display:"flex", justifyContent:"center",color:"#FFD700"}}/>
                        Pedidos
                    </>
                } funcion={()=>setPedido(true)} background="#5a5858"/>
                <BtnHistorial titulo={
                    <>
                        <PersonIcon sx={{fontSize:85, display:"flex",justifyContent:"center", color:"#FFD700"}}/>
                        Empleados
                    </>                 
                } funcion={()=>setEmpleado(true)} background="#5a5858"/>
            </ContainerButtons>
            <section>
                <div>
            {
                historial && <InventarioHistorial setHistorial={() => setHistorial(false)} />
            }
            {
                pedido && <PedidoHistorial setPedido={() => setPedido(false)} />
            }
                        {
                empleado && <EmpleadoHistorial setEmpleado={() => setEmpleado(false)} />
            }
                </div>

            </section>
        </div>
    );
}

const ContainerButtons = styled.div`
    display:flex;
    flex-direction:row;
    justify-content:center;
    gap:40px;


    @media (max-width: 768px){
    flex-direction:column;
    }
`