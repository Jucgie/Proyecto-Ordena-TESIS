import styled from "styled-components";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

interface Props{
    setDetalle: ()=>void;

}

function createData(
    name: string,
    calories: number,

) {
    return { name, calories};
}

const rows = [
    createData("Producto_1",2),
    createData("Producto_1",2),
    createData("Producto_1",2),
    createData("Producto_1",2),
    createData("Producto_1",2),
    createData("Producto_1",2),
    createData("Producto_1",2),
    createData("Producto_1",2),


];


export function PedidoDetalle({setDetalle}:Props) {
    return(
        <Container>
            <div className="cerr">
                <span onClick={setDetalle} className="vol"> X Cerrar</span>
            </div>
            <h2>Productos</h2>
            <div className="table-container">

                <TableContainer component={Paper}
                        sx={{
                            maxHeight:400,width: "auto", background: '#5B5B5B',
                            '& .MuiTableCell-root': { color: 'white', textAlign: 'center' }
                        }}
                >
                    <Table sx={{ minWidth: 150}} aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Producto</TableCell>
                                <TableCell align="right">Cantidad</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((row) => (
                                <TableRow
                                    key={row.name}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                    <TableCell component="th" scope="row">
                                        {row.name}
                                    </TableCell>
                                    <TableCell align="right">{row.calories}</TableCell>
                                    
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
  box-shadow: -30px 15px 30px rgba(10, 9, 9, 0.6);
  padding: 13px 26px 20px 26px;
  z-index: 100;
  display:flex;
  align-items:center;
  flex-direction:column;
  justify-content:center;

    .cerr{
        margin-bottom:40px;
        font-size:20px;
        display:flex;
        justify-content:start;
        width:100%;
        color: #d62600;
        font-weight:bold;
    }

    .table-container {
        display: flex;
        justify-content: center;
        align-items: center;
  }
`