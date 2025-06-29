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

import { SUCURSALES } from "../../constants/ubicaciones";

//Obtención de datos de la api por medio del archivo store
import { useHistorialStore } from "../../store/useHistorialStore";
import { useHistProductStore } from "../../store/useHistorialStore";
import { useInventariosStore } from "../../store/useProductoStore";
import { useBodegaStore } from "../../store/useBodegaStore";

//import { useAuthStore } from "../../store/useAuthStore";

//datos de la autenticación
import { useAuthStore } from "../../store/useAuthStore";

import stockImage  from '../../assets/en-stock.png';
import { useEffect, useMemo } from "react";
import { useUsuariosStore } from "../../store/useUsuarioStore";

import { Chip } from "@mui/material";


//import { useEffect } from "react";



export function CountElementSucursal() {

    //Obtención perfil de usuario
    const {usuario} = useAuthStore();

    //Definición de constante para obtener datos 

    const {pedidos,fetchPedidos} = useHistorialStore();
    const {solicitudes, fetchSolicitudes} = useBodegaStore();
    const {usuarios,fetchUsuarios} = useUsuariosStore();
   // const prodct = useInventariosStore(state=>state.inventarios)
  //  const prodcts = Object.values(prodct).flat();
  // Cargar los datos cuando el componente se monta
    useEffect(() => {
        fetchPedidos();
        fetchUsuarios();
        if (usuario?.sucursal) {
            fetchSolicitudes({sucursal_id: String(usuario.sucursal)})
        }
    }, [fetchPedidos, fetchSolicitudes, fetchUsuarios, usuario?.sucursal]);   


    //almacenar datos
    //let pedidosMostrados = pedidos;
    //let solicitudesoMostrados = solicitudes;


    //filtrar datos según el perfil bodega
    const {pedidosMostrados, solicitudesMostrados} = useMemo(() => {
        if (usuario?.tipo === 'sucursal' && usuario.sucursal){

            const sucursalId = String(usuario.sucursal);

            const pedidosFiltrados = pedidos.filter(p => String(p.sucursal_fk)=== sucursalId);

            const solicitudesFilrados = solicitudes.filter(s => String(s.fk_sucursal) === sucursalId);


            
            return {pedidosMostrados: pedidosFiltrados, solicitudesMostrados: solicitudesFilrados};

        }
        return {pedidosMostrados: pedidos, solicitudesMostrados: solicitudes}

     /*         else if (usuario?.tipo === 'sucursal' && usuario.sucursal) {
            const sucursalId = usuario.sucursal;
            // Los pedidos se filtran por el ID de la sucursal.
            pedidosMostrados = pedidos.filter(p => String(p.sucursal_fk) === sucursalId);
            // Los productos en useHistProductStore no tienen sucursal_fk, por lo que el inventario es 0 para sucursales.
            inventarioMostrados = [];
        } */

    },[usuario, pedidos, solicitudes]);

    const totalSolicitudes = useMemo(()=>
        (solicitudesMostrados || []).length
    ,[solicitudesMostrados]) ;

    //Se obtiene los pedidos según el id del estado_pedido
    const pedidosCamino = useMemo(()=>
        (pedidosMostrados || []).filter(p => p.estado_pedido_fk === 1).length
    ,[pedidosMostrados]) ;

    const pedidosCompletados = useMemo(()=>
        (pedidosMostrados || []).filter(p => p.estado_pedido_fk === 2).length,
    [pedidosMostrados]
    )
    

    //Se obtinen los pedidos pendientes
    const pedidosPendientes = useMemo(()=>
        (pedidosMostrados || []).filter(p => p.estado_pedido_fk === 3).length,
    [pedidosMostrados]
    )


    //Se obtiene los productos bajos, por medio de un filtro comparando el stock y el stock minimo
    const totalEmpleadosActivos = useMemo(() => {
        if (usuario?.rol === 'supervisor' && usuario.sucursal) {
            return usuarios.filter(emp => emp.sucursal_fk == usuario.sucursal && emp.is_active).length;
        }
        return 0;
    }, [usuarios, usuario]);

    //Se obtiene los ultimos pedidos por fecha y se muestran solo los cinco "ultimos"
    const ultimosPedidos = useMemo(() => {
        return [...(pedidosMostrados || [])]
            .sort((a, b) => new Date(b.fecha_entrega).getTime() - new Date(a.fecha_entrega).getTime())
            .slice(0, 5);
    }, [pedidosMostrados]);

    const ultimasSolicitudes = useMemo(() => {
        return [...(solicitudesMostrados || [])]
            .sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime())
            .slice(0, 5);
    }, [solicitudesMostrados]);

    const getEstadoPedido = (id_estado: number) => {
        switch (id_estado) {
            case 1:
                return <Chip label="En Camino" color="primary" size="small" sx={{ color: 'white', backgroundColor: '#2196F3' }} />;
            case 2:
                return <Chip label="Completado" color="success" size="small" sx={{ color: 'white', backgroundColor: '#4CAF50' }} />;
            case 3:
                return <Chip label="Pendiente" color="warning" size="small" sx={{ color: 'white', backgroundColor: '#FF9800' }} />;
            default:
                return <Chip label="Desconocido" size="small" />;
        }
    };

        const getEstadoSolicitud = (estado: string) => {
        switch (estado?.toLowerCase()) {
            case 'aprobada':
                return <Chip label="Aprobada" color="success" size="small" sx={{ color: 'white', backgroundColor: '#4CAF50' }} />;
            case 'denegada':
                return <Chip label="Denegada" color="error" size="small" sx={{ color: 'white', backgroundColor: '#f44336' }} />;
            case 'pendiente':
                return <Chip label="Pendiente" color="warning" size="small" sx={{ color: 'white', backgroundColor: '#FF9800' }} />;
            default:
                return <Chip label={estado || "Desconocido"} size="small" />;
        }
    };

    //se obtiene el total de productos
    //const totalProducts = inventarioMostrados.length;
    return (
        <Contenedor_Dashboard>
            <h1 className="titulo_bn">Bienvenido, {usuario?.nombre || 'usuario'} </h1>

            {/* container para los cuadrados resumen */}
            <Container>
                <ul className="cuadroEstd">
                    <p className="titulo">Total solicitudes</p>
                    <h1 className="numero">{totalSolicitudes}</h1>
                </ul>
                <ul className="cuadroEstd">
                    <p className="titulo">Pedidos En camino</p>
                    <h1 className="numero">{pedidosCamino}</h1>
                </ul>
                <ul className="cuadroEstd">
                    <p className="titulo">Entregas Pendientes</p>
                    <h1 className="numero">{pedidosPendientes}</h1>
                </ul>
                {usuario?.rol != 'supervisor' && (
                <ul className="cuadroEstd">
                    <p className="titulo">Pedidos Completados</p>
                    <h1 className="numero">{pedidosCompletados}</h1>
                </ul>)}
                {usuario?.rol === 'supervisor' && (
                <ul className="cuadroEstd">
                    <p className="titulo">Empleados Activos</p>
                    <h1 className="numero">{totalEmpleadosActivos}</h1>
                </ul>)}
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
                    <h4 className="titulo_d">Ultimas Solicitudes</h4>
                    {ultimasSolicitudes.length > 0 ?(
                        <TableContainer
                            component={Paper}
                            sx={{
                                maxHeight:270,
                                background: '#232323',
                                '& .MuiTableRow-root': { height: "2vh",
                                '& .MuiTableCell-root': {
                                    padding: '7px 18px',
                                    color: 'white',
                                    textAlign: 'center' } } }}
                        >
                            {/* Encabezado de tabla */}
                            <Table sx={{}} aria-label="simple table" stickyHeader>
                                <TableHead sx={{
                            '& .MuiTableCell-root': {
                                backgroundColor: '#232323',
                                color: 'white'
                            }
                        }}>
                                    <TableRow>
                                        <TableCell>Id</TableCell>
                                        <TableCell>Fecha</TableCell>
                                        <TableCell align="right">N° Productos</TableCell>
                                        <TableCell align="right">Estado</TableCell>
                                    </TableRow>
                                </TableHead>

                                 <TableBody>
                                    {ultimasSolicitudes.map((solicitud)=> (
                                        <TableRow
                                            key={solicitud.id_solc}
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                        >
                                            <TableCell component="th" scope="row">
                                                {solicitud.id_solc}
                                            </TableCell>
                                            <TableCell align="right">{new Date(solicitud.fecha_creacion).toLocaleDateString()}</TableCell>
                                            <TableCell align="right">{solicitud.productos?.length ?? 0}</TableCell>
 <TableCell>{getEstadoSolicitud(solicitud.estado)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ):(
                        <div><p>no hay solicitudes</p></div>
                    )}
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
                            maxHeight:400,width: "auto", background: '#232323',
                            '& .MuiTableCell-root': { color: 'white', textAlign: 'center' }
                        }}
                    >
                        <Table sx={{
                            minWidth: 50, height: '100%'

                        }} aria-label="simple table" className="table_pedido" stickyHeader>
                            <TableHead sx={{
                            '& .MuiTableCell-root': {
                                backgroundColor: '#232323',
                                color: 'white'
                            }
                        }} >
                                <TableRow>
                                    <TableCell>Id</TableCell>
                                    <TableCell>Sucursal</TableCell>
                                    <TableCell>Productos</TableCell>
                                    <TableCell>Fecha Inicio</TableCell>
                                    <TableCell>Estado</TableCell>

                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {/*Reorrido de los datos */}
                                {ultimosPedidos.map((row) => (
                                    <TableRow
                                        key={row.id_p}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <TableCell component="th" scope="row">
                                            {row.id_p} </TableCell>
                                        <TableCell component="th" scope="row">
                                            {SUCURSALES.find(s => s.id == row.sucursal_fk)?.nombre ?? 'N/A'}
                                        </TableCell>
                                        <TableCell>{row.solicitud_fk?.productos?.length ?? 0}</TableCell>
                                        <TableCell>{row.fecha_entrega.split('T')[0] ?? 'N/A'}</TableCell>
                                        <TableCell>{getEstadoPedido(row.estado_pedido_fk)}</TableCell>




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
    background-color:rgb(20, 20, 20);
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
        aling-items:start;
        gap:150px;
        justify-content: center;
        max-width:100%;
        heigth:50vh;

    }
    
    .grafico{
        padding:20px;
        margin:0;
        background-color: rgb(20, 20, 20);
        border: 1px solid rgb(36, 34, 34);

        
    }
    .grafico_barra{
        padding:20px;
        margin:0;
        border: 1px solid rgb(36, 34, 34);
        background-color: rgb(20, 20, 20);
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
        border: 1px solid rgb(36, 34, 34);
        background-color: rgb(20, 20, 20);
        padding: 0px;
    }
    .table_u_p{
        width: 60%;
        display: grid;
        justify-content: center;
        align-items: center;
        border: 1px solid rgb(36, 34, 34);
        background-color: rgb(20, 20, 20);
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

const Mensaje = styled.div`
    display:flex;
    align-items:center;
    justify-content:center;
    flex-direction:column;
    font-size:1.2em;;
    height:270px;
    text-align:center;
    width:20vw;

    @media (max-width: 768px) {
        align-items:center;
        justify-content:center;
        align-content:center;
        width:20vw;
    )

`

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