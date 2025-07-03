import styled from "styled-components";

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
//import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
//import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import PersonIcon from '@mui/icons-material/Person';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

//Obtención de datos de la api por medio del archivo store
import { useHistorialStore } from "../../store/useHistorialStore";

//Interfaces

interface Props {
    setDespacho: () => void;
    id: number;

}

//Constante de material ui
/* const bull = (
    <Box
        component="span"
        sx={{ display: 'inline-block', mx: '2px', transform: 'scale(0.8)' }}
    >
        •
    </Box>
); */

export function DespachoDetalle({ id, setDespacho }: Props) {

    //Definición de las constantes para obtener los datos
    const pedidos = useHistorialStore(state => state.pedidos);
    const pedido = pedidos.find((p) => p.id_p === id);

    return (
        <Container>
            <div className="cerr">
                <span onClick={setDespacho} className="vol"> X</span>
            </div>
            <div className="titulo">

                <h2>Pedido #{pedido?.id_p}</h2>

            </div>
            <div className="table-container">
                {/*Tarjeta que muestra los datos del transportista*/}
                <Card sx={{ minWidth: 10,width:"90%",display:"flex",flexDirection:"column",padding:"0",marginBottom:"5vh", '@media (max-width: 768px)': {
                            width: '50%', // o el valor que prefieras
                            minWidth: 0,
                            maxWidth: '30vw'
                        }}}>

                    {/* Recorrido de los datos para obtener los correctos según el pedido */}
                      {pedido?.personal_entrega_fk && (
                    <CardContent sx={{background:"#FFD700" }}>
                      

                        <Typography gutterBottom sx={{ color: 'text.secondary', display:'flex',justifyContent:'center' }}>
                        <PersonIcon sx={{fontSize:85, display:"flex",justifyContent:"center", color:"#1E1E1E",margin:"0px"}}/>
                        </Typography>

                        <Typography 
                            variant="h6" component="div" 
                            sx={{textAlign:"center",fontWeight:"bold",fontSize:"20px"}}>
                           {pedido.personal_entrega_fk.nombre_psn}
                        </Typography>

                        <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>{pedido.personal_entrega_fk.descripcion}</Typography>
                        
                    </CardContent>
                          )}
                      
                    <Typography 
                        sx={{textAlign:"center",
                            fontWeight:900,
                            padding:"10px",
                            fontSize:"20px",
                            letterSpacing:"0.2em"

                        }}>
                        Transportista
                    </Typography>

                {/*Segunda tarjeta que mostrará la patente vehicular */}
                </Card>

            </div>
        </Container>

    );
}


const Container = styled.div`
  position: fixed;
  height: 90vh;
  width: 30%;
  left: 85%;
  top:50%;
  transform: translate(-50%, -50%);
  border-radius: 5px;
  background: #1E1E1E;
  box-shadow: -20px 0px 20px rgba(36, 36, 36, 0.6);
  padding: 13px 26px 20px 26px;
  z-index: 100;
  display:flex;
  align-items:center;
  flex-direction:column;
  justify-content:center;

    .cerr{
        margin-bottom:40px;
        left:2vh;
        font-size:20px;
        display:flex;
        position:fixed;
        justify-content:start;
        align-content:start;
        top:0;
        width:100%;
        color:white;
        font-weight:bold;
    }

    .table-container {
        display: flex;
        position:fixed;
        flex-direction:column;
        justify-content: center;
        align-items: center;
  }

  .titulo{
        display:flex;
        justify-content:start;
        align-items:start;
        text-align:start;
        top:0;
        height:90vh;
  }

    /* --- MEDIA QUERY --- */
  @media (max-width: 768px) {
    width: 95vw;
    left: 50%;
    padding: 8px 4px 12px 4px;

    .table-container {
      width: 100%;
      padding: 0;
      position: static;
    }

    .cerr{
        left:unset;
        right:2vh;
        justify-content:flex-end;        
    }
  }

`