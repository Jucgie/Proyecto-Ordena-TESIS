import styled from "styled-components";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import {BtnAct} from "../button/ButtonHist";
import { Select, MenuItem } from "@mui/material";
//import ReplayIcon from '@mui/icons-material/Replay';



interface Props {
    setEmpleado: () => void;
}

function createData(
    name: Date,
    calories: string,
    fat: string,
    carbs: string,
    protein: string,
    description:string,
) {
    return { name, calories, fat, carbs, protein,description };
}

const rows = [
    createData(new Date('2025-03-02'), '20:20', 'Añadir empleado', 'admin', 'empelado_1', "rol rol_1"),
    createData(new Date('2025-03-02'), '20:20', 'Añadir empleado', 'admin', 'empelado_1', "rol rol_1"),
    createData(new Date('2025-03-02'), '20:20', 'Añadir empleado', 'admin', 'empelado_1', "rol rol_1"),

];

export function EmpleadoHistorial({ setEmpleado }: Props) {
    return (
        <Container>
            <div className="cerr">
                <span onClick={setEmpleado} className="vol"> 🠔 Volver</span>
            </div>
            <section className="Botones">
                <div className="Boton-start">
                    <input type="text" placeholder="Buscar"/>
                </div>
                <div className="Boton_center">
                        <Select
                            style={{ width: 100, height:40,background: "#2E2E2E", color: "white", borderRadius: "5px" }}
                          >
                            <MenuItem value="">Todas las categorías</MenuItem>
                            <MenuItem value="categoria_1">categoria_1</MenuItem>
                            <MenuItem value="categoria_2">categoria_2</MenuItem>
                            <MenuItem value="categoria_3">categoria_3</MenuItem>
                          </Select>

                                                  <Select
                            style={{ width: 100, height:40,background: "#2E2E2E", color: "white", borderRadius: "5px" }}
                          >
                            <MenuItem value="">Todas las categorías</MenuItem>
                            <MenuItem value="categoria_1">categoria_1</MenuItem>
                            <MenuItem value="categoria_2">categoria_2</MenuItem>
                            <MenuItem value="categoria_3">categoria_3</MenuItem>
                          </Select>

                </div>
                <div className="Boton-end">
                    <BtnAct titulo="Recargar" background="#1E1E1E" />
                    <BtnAct titulo="Exportar" background="#1E1E1E" />
                </div>
            </section>
            <div className="table-container">

                <TableContainer component={Paper}
                        sx={{
                            maxHeight:400,width: "auto", background: '#5B5B5B',
                            '& .MuiTableCell-root': { color: 'white', textAlign: 'center' }
                        }}
                >
                    <Table sx={{ minWidth: 650}} aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Fecha</TableCell>
                                <TableCell align="right">Hora</TableCell>
                                <TableCell align="right">Acción</TableCell>
                                <TableCell align="right">Usuario</TableCell>
                                <TableCell align="right">Empleado</TableCell>
                                <TableCell align="right">Descripción</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((row) => (
                                <TableRow
                                    key={row.fat}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                    <TableCell component="th" scope="row">
                                        {row.name.toLocaleDateString()}
                                    </TableCell>
                                    <TableCell align="right">{row.calories}</TableCell>
                                    <TableCell align="right">{row.fat}</TableCell>
                                    <TableCell align="right">{row.carbs}</TableCell>
                                    <TableCell align="right">{row.protein}</TableCell>
                                    <TableCell align="right">{row.description}</TableCell>
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
  width: 60%;
  left: 55%;
  top:50%;
  transform: translate(-50%, -50%);
  border-radius: 5px;
  background: #1E1E1E;
  box-shadow: -10px 15px 30px rgba(10, 9, 9, 0.4);
  padding: 13px 26px 20px 26px;
  z-index: 100;
  display:flex;
  align-items:center;
  flex-direction:column;
  justify-content:center;

    .cerr{
        margin-bottom:40px;
        font-size:20px;
        cursor:pointer;
    }

  .table-container {
    display: flex;
    justify-content: center;
    align-items: center;
    
  }

  .Botones{
    display:flex;
    width: 100%;
    margin-bottom: 20px;
}
  .Boton-end{
    display: flex;
    justify-content: end;
    align-items: end;
    flex-direction: row;
    width: 100%;
    gap: 10px;
  }

    .Boton-start{
    display: flex;
    justify-content: start;
    align-items: start;
    flex-direction: row;
    width: 100%;
    gap: 10px;

    input{
        padding: 0.7em;
    }
    }
    .Boton_center{
        display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: row;
    width: 100%;
    gap: 10px;
    }
    `