import styled from "styled-components";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

//Obtención de datos de la api por medio del archivo store
import { useHistorialStore } from "../../store/useHistorialStore";
import type { ProductoSolicitud } from "../../store/useHistorialStore";


//Definición de Interfaces 
interface Props {
    setDetalle: () => void;
    id: number;

}

export function PedidoDetalle({ id, setDetalle }: Props) {
    {/*Definicón de constante para obtener los datos */}
    const pedidos = useHistorialStore(state => state.pedidos);
    const pedido = pedidos.find((p) => p.id_p === id);


    return (
        <Container>
            {/*Sección para cerra/salir de la ventana */}
            <div className="cerr">
                <span onClick={setDetalle} className="vol"> X</span>
            </div>
            <div className="titulo">

                <h2>Pedido #{pedido?.id_p}</h2>
                <h4>Productos</h4>
            </div>
            <div className="table-container">

                {/*Tabla central que muestra los productos y su cantidad */}
                <TableContainer component={Paper}
                    sx={{
                        maxHeight: 400, width: "16vw", background:"#232323",display:"flex",
                        '& .MuiTableCell-root': { color: 'white', textAlign: 'center' },
                        '@media (max-width: 768px)': {
                            width: '100%', // o el valor que prefieras
                            minWidth: 0,
                            maxWidth: '30vw'
                        }
                    }}
                >
                    <Table sx={{ minWidth: 150 }} aria-label="simple table" stickyHeader> 
                        <TableHead sx={{
                            '& .MuiTableCell-root': {
                                backgroundColor: '#232323',
                                color: 'white'
                            }
                        }} >
                            <TableRow>
                                <TableCell>Producto</TableCell>
                                <TableCell align="right">Cantidad</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody sx={{ background: "#232323" }}>

                            {/*Recorrido de los datos */}
                            {pedido?.solicitud_fk?.productos?.map((p: ProductoSolicitud) => (

                                <TableRow
                                    key={p.id_solc_prod}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>


                                    <TableCell component="th" scope="row">
                                        {p.producto_nombre}
                                    </TableCell>

                                    <TableCell>{Number(p.cantidad)}</TableCell>


                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
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
        font-size:20px;
        left:2vh;
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
        justify-content: center;
        align-items: center;
        align-content:center;
        top:50%;
        height:90vh;
        position:static;
  }

    .titulo{
        display:flex;
        flex-direction:column;
        justify-content:start;
        align-items:center;
        text-align:center;
        top:2px;

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