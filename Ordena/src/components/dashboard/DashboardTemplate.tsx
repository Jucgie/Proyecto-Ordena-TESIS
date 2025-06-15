import styled from "styled-components";
{/* Se importan los componentes de los graficos*/}
import { Grafics_b } from "../graficos/Grafics_bar";
import { Grafics_Pie } from "../graficos/Grafics_pie";
{/* Fin importaciones de componentes graficos */}
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

{/* Data statica */}
function createData(
    id: string,
    sucursal: string,
    producto: string,
    cantidad: number,
    fecha: Date,
    stock: number,
) {
    return { id, sucursal, producto, cantidad, fecha, stock };
}

const rows = [
    createData('id_1', 'Sucursal 1', 'producto 2', 20, new Date('2025-03-02'), 40),
    createData('id_1', 'Sucursal 2', 'producto 3', 20, new Date('2025-03-02'), 43),
    createData('id_1', 'Sucursal 3', 'producto 1', 20, new Date('2025-03-02'), 60),
    createData('id_1', 'Sucursal 4', 'producto 3', 20, new Date('2025-03-02'), 43),
    createData('id_1', 'Sucursal 5', 'producto 3', 20, new Date('2025-03-02'), 49),
    createData('id_1', 'sucursal 2', 'producto 3', 20, new Date('2025-03-02'), 39),
    createData('id_1', 'sucursal 2', 'producto 3', 20, new Date('2025-03-02'), 39),

];



export function CountElement() {
    return (
        <Contenedor_Dashboard>
            <h1 className="titulo_bn">Bienvenido, [usuario]</h1>

            {/* container para los cuadrados resumen */}
            <Container>
                <ul className="cuadroEstd">
                    <p className="titulo">Pedidos Activos</p>
                    <h1 className="numero">2</h1>
                </ul>
                <ul className="cuadroEstd">
                    <p className="titulo">Total Inventario</p>
                    <h1 className="numero">2</h1>
                </ul>
                <ul className="cuadroEstd">
                    <p className="titulo">Entregas Pendientes</p>
                    <h1 className="numero">3</h1>
                </ul>
                <ul className="cuadroEstd">
                    <p className="titulo">Empleados Activos</p>
                    <h1 className="numero">4</h1>
                </ul>
            </Container>

            <br />
            <br />
            {/* Sección para grafico de barra y "Productos con menor stock" */}
            <section className="resumen">
                <section>
                    <div className="grafico_barra">
                        <h4 className="titulo_d">Pedidos por semana</h4><br />
                        {/* Llamada del componente del grafico de barras*/}
                        <div className="grafico_b">
                            <Grafics_b />
                        </div>
                    </div>
                </section>
                {/* Sección para el cuadrado de productos con menor stock */}
                <section className="grafico">
                    <h4 className="titulo_d">Productos con menor stock</h4>

                    {/* Tabla que contiene información de productos con menor stock */}
                    <TableContainer
                        component={Paper}
                        sx={{ 
                            maxHeight:270,
                            background: '#5B5B5B', 
                            '& .MuiTableRow-root': { height: "2vh", 
                            '& .MuiTableCell-root': { 
                                padding: '7px 18px', 
                                color: 'white', 
                                textAlign: 'center' } } }}
                    >
                        {/* Encabezado de tabla */}
                        <Table sx={{}} aria-label="simple table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Id</TableCell>
                                    <TableCell>Producto</TableCell>
                                    <TableCell align="right">Stock</TableCell>
                                </TableRow>
                            </TableHead>

                        {/*Cuerpo de tabla */}
                            <TableBody>
                                {rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell component="th" scope="row">
                                            {row.id}
                                        </TableCell>
                                        <TableCell align="right">{row.producto}</TableCell>
                                        <TableCell align="right">{row.stock}</TableCell>

                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </section>
            </section>

            {/* Sección para el gráfico de estado de pedidos y tabla de últimos pedidos */}    
            <section className="u_pedido">
                <div className="grafico_c">
                    <h4 className="titulo_u">Estado de los pedidos</h4>
                    {/* Llamada del componente del grafico circular*/}
                    <div className="grafico_p">
                    <Grafics_Pie />
                    </div>
                </div>

                {/*Sección para tabla de información de ultimos pedidos */}
                <div className="table_u_p">
                    <h4 className="titulo_u">Ultimos Pedidos</h4>

                    {/* Sección que contiene la tabla */}
                    <TableContainer component={Paper}
                        sx={{
                            maxHeight:400,width: "auto", background: '#5B5B5B',
                            '& .MuiTableCell-root': { color: 'white', textAlign: 'center' }
                        }}
                    >
                        <Table sx={{
                            minWidth: 50, height: '100%'

                        }} aria-label="simple table" className="table_pedido">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Id</TableCell>
                                    <TableCell>Sucursal</TableCell>
                                    <TableCell>Producto</TableCell>
                                    <TableCell>Fecha</TableCell>
                                    <TableCell>Cantidad</TableCell>
                                    <TableCell>Stock</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell component="th" scope="row">
                                            {row.id} </TableCell>
                                        <TableCell component="th" scope="row">
                                            {row.sucursal}
                                        </TableCell>
                                        <TableCell>{row.producto}</TableCell>
                                        <TableCell>{row.fecha.toLocaleDateString()}</TableCell>
                                        <TableCell>{row.cantidad}</TableCell>
                                        <TableCell>{row.stock}</TableCell>



                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>
            </section>
        </Contenedor_Dashboard>

    );
}

{/*Sección de estilos */}
const Container = styled.div`
    display:flex;
    height:100%;
    width: 100%;
    list-style:none;
    justify-content:center;
    margin:0;
    padding:0;
    @media (max-width: 768px) {
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
}

    .cuadroEstd{
    padding: 10px;
    margin:20px;
    width:160px;
    height: auto;
    display:flex;
    flex-direction:column;
    align-items:start;
    border: 1px solid rgb(36, 34, 34);
    color: yellow;
    box-sizing:border-box;
    background-color:rgb(14, 13, 13);
    }

    .numero{
        font-size:40px;
        position:relative;
        color:white;
        align-items:center;

    }
    .titulo{
        display:flex;
        font-size:14px;


    }
    .titulo_d{
        display:flex;
        color:yellow;
        margin-bottom:20px;
    }

    .titulo_bn{
        display:flex;
        color: yellow;
        align-items:start;
        justify-content:center;
        width:50%;
        font-size:30px;
    }

    .resumen{
        display: grid;
        grid-template-columns: auto auto;
        aling-items:center;
        gap:150px;
        justify-content: center;
        max-width:100%;
        heigth:50vh;

    }
    
    .grafico{
        padding:20px;
        margin:0;
        background-color: rgb(14, 13, 13);
    }
    .grafico_barra{
        padding:20px;
        margin:0;
        background-color: rgb(14, 13, 13);
    }
    .grafico_b{
        border:1px solid #5B5B5B;
        border-radius: 10px;
        padding: 10px;
        box-shadow:1px 1px 1px 1px rgba(91, 91, 91, 0.31);

    }
    .grafico_p{
        border:1px solid #5B5B5B;
        border-radius: 10px;
        padding: 10px;
        box-shadow:1px 1px 1px 1px rgba(91, 91, 91, 0.31);
    }

    .table{
        border: 1px solid;
        width: 20vw;
        heigth:100%;
        padding:6px;
    }

    .table_pedido{
        padding:6px;
        text-align:;
        justify-content:center;  
        width: 50%;   
    }
    .u_pedido{
        display:flex;
        justify-content:center;
        align-content:center;
        margin-top:40px;
        padding:20px;
        text-content:center;
        max-width:100%;
        gap: 30px;
    }

    body{
        display:grid;
        flex-direction:column;
        align-items: center;
        justify-content: center;
        max-width:98%;
    }

    .grafico_c{
        width: 50%;
        display: grid;
        justify-content: center;
        align-items: start;
        align-content: center;
        background-color: rgb(14, 13, 13);
        padding: 0px;
    }
    .table_u_p{
        width: 60%;
        display: grid;
        justify-content: center;
        align-items: center;
        background-color: rgb(14, 13, 13);
        padding: 10px;
        }

    .titulo_u{
        display:flex;
        margin-bottom:20px;
        color:#FFD700;
        justify-content:start;
    }

}


`;

const Contenedor_Dashboard = styled.div`
    @media (max-width: 768px) {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;

        .resumen, .u_pedido, .grafico_c,.grafico_barra{
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            width: 100%;
        }
    }
`;