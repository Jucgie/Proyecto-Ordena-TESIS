import styled from "styled-components";

{/* Se importan los componentes de los graficos*/ }
import { Grafics_b } from "../graficos/Grafics_bar";
import { Grafics_Pie } from "../graficos/Grafics_pie";
import { TasaAprobacionDoughnut } from "../graficos/tasaAprobacionSolc";
import { TopProductosSolicitados } from "../graficos/productsSucursal";
import { ComparativoSolicitudesPedidos } from "../graficos/ComparativoSolicitudPedido";

{/* Fin importaciones de componentes graficos */ }

import PedidoDetalleModal from "../pedidos/pedidoDetalle";
import SolicitudDetalleModal from "../graficos/solicitudDetalle";

import ordena from "../../assets/ordena.svg";


import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';


import { SUCURSALES } from "../../constants/ubicaciones";

//Obtención de datos de la api por medio del archivo store
import { useHistorialStore } from "../../store/useHistorialStore";
import { useHistProductStore } from "../../store/useHistorialStore";
import { useInventariosStore } from "../../store/useProductoStore";
import { useBodegaStore } from "../../store/useBodegaStore";

//import { useAuthStore } from "../../store/useAuthStore";

//datos de la autenticación
import { useAuthStore } from "../../store/useAuthStore";

import stockImage from '../../assets/en-stock.png';
import { useEffect, useMemo, useState } from "react";
import { useUsuariosStore } from "../../store/useUsuarioStore";

import { Chip } from "@mui/material";
import { formatFechaChile } from '../../utils/formatFechaChile';


//import { useEffect } from "react";



export function CountElementSucursal() {

    //Obtención perfil de usuario
    const { usuario } = useAuthStore();

    // Estado para el modal de detalles
    const [modalOpen, setModalOpen] = useState(false);
    const [modalOpenResumen, setModalResumen] = useState(false);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<any>(null);
    const [solicitudSeleccionado, setSolicitudSeleccionado] = useState<any>(null);

    //Definición de constante para obtener datos 

    const { pedidos, fetchPedidos, loading: loadingPedidos } = useHistorialStore();
    const { solicitudes, fetchSolicitudes } = useBodegaStore();
    const { usuarios, fetchUsuarios } = useUsuariosStore();
    // const prodct = useInventariosStore(state=>state.inventarios)
    //  const prodcts = Object.values(prodct).flat();
    // Cargar los datos cuando el componente se monta
    useEffect(() => {
        fetchPedidos();
        fetchUsuarios();
        if (usuario?.sucursal) {
            fetchSolicitudes({ sucursal_id: String(usuario.sucursal) })
        }
    }, [fetchPedidos, fetchSolicitudes, fetchUsuarios, usuario?.sucursal]);


    //almacenar datos
    //let pedidosMostrados = pedidos;
    //let solicitudesoMostrados = solicitudes;


    //filtrar datos según el perfil bodega
    const { pedidosMostrados, solicitudesMostrados } = useMemo(() => {
        if (usuario?.tipo === 'sucursal' && usuario.sucursal) {

            const sucursalId = String(usuario.sucursal);

            const pedidosFiltrados = pedidos.filter(p => String(p.sucursal_fk) === sucursalId);

            const solicitudesFilrados = solicitudes.filter(s => String(s.fk_sucursal) === sucursalId);



            return { pedidosMostrados: pedidosFiltrados, solicitudesMostrados: solicitudesFilrados };

        }
        return { pedidosMostrados: pedidos, solicitudesMostrados: solicitudes }

        /*         else if (usuario?.tipo === 'sucursal' && usuario.sucursal) {
               const sucursalId = usuario.sucursal;
               // Los pedidos se filtran por el ID de la sucursal.
               pedidosMostrados = pedidos.filter(p => String(p.sucursal_fk) === sucursalId);
               // Los productos en useHistProductStore no tienen sucursal_fk, por lo que el inventario es 0 para sucursales.
               inventarioMostrados = [];
           } */

    }, [usuario, pedidos, solicitudes]);

    const totalSolicitudes = useMemo(() =>
        (solicitudesMostrados || []).length
        , [solicitudesMostrados]);

    //Se obtiene los pedidos según el id del estado_pedido
    const pedidosCamino = useMemo(() =>
        (pedidosMostrados || []).filter(p => p.estado_pedido_fk === 1).length
        , [pedidosMostrados]);

    const pedidosCompletados = useMemo(() =>
        (pedidosMostrados || []).filter(p => p.estado_pedido_fk === 2).length,
        [pedidosMostrados]
    )


    //Se obtinen los pedidos pendientes
    const pedidosPendientes = useMemo(() =>
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

    //se obtiene las ultimas cinco solicitudes
    const ultimasSolicitudes = useMemo(() => {
        return [...(solicitudesMostrados || [])]
            .sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime())
            .slice(0, 5);
    }, [solicitudesMostrados]);

    //tasa de aprobación solicitudes
    const tasaAprobación = useMemo(() => {
        const total = solicitudesMostrados.length;
        if (total === 0) return { porcentaje: 0, aprobadas: 0, total: 0 };

        const aprobadas = solicitudesMostrados.filter(s => s.estado?.toLocaleLowerCase() === 'aprobada').length;
        const porcentaje = Math.round((aprobadas / total) * 100);
        return { porcentaje, aprobadas, total };
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
            if (!estado){
            return <Chip label="Pendiente" color="warning" size="small" sx={{ color: 'white', backgroundColor: '#FF9800' }}/>;
        }
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

    const handleOpenModal = (pedido: any) => {
        setPedidoSeleccionado(pedido);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setPedidoSeleccionado(null);
    };

    const handleOpenModalResumen = (solicitudes: any) => {
        setSolicitudSeleccionado(solicitudes);
        setModalResumen(true);
    };

    const handleCloseModalResumen = () => {
        setModalResumen(false);
        setPedidoSeleccionado(null);
    };
    //se obtiene el total de productos
    //const totalProducts = inventarioMostrados.length;
    if (loadingPedidos) {
        return (
            <Loader>
                <>
                    <img src={ordena} alt="Ordena_logo" />
                    <p>Ordena</p>
                    <div>Cargando Dashboard...</div>
                </>
            </Loader>
        );
    }

    return (
        <Contenedor_Dashboard>

            <h1 className="titulo_bn">Bienvenido,  {usuario?.nombre || ' usuario'} 

                <span style={{color:'#FFD700', marginLeft:'8px',justifyContent:'start',width:'100%',fontSize:'18px',}}>
                    {usuario?.rol} 
                    </span>
            </h1>
        
            {/* container para los cuadrados resumen */}
            <Container>
                <ul className="cuadroEstd">
                    <h4 className="titulo">Total solicitudes</h4>
                    <h1 className="numero">{totalSolicitudes}</h1>
                </ul>
                <ul className="cuadroEstd">
                    <h4 className="titulo">Pedidos En camino</h4>
                    <h1 className="numero">{pedidosCamino}</h1>
                </ul>
                <ul className="cuadroEstd">
                    <h4 className="titulo">Entregas Pendientes</h4>
                    <h1 className="numero">{pedidosPendientes}</h1>
                </ul>
                {usuario?.rol != 'supervisor' && (
                    <ul className="cuadroEstd">
                        <h4 className="titulo">Pedidos Completados</h4>
                        <h1 className="numero">{pedidosCompletados}</h1>
                    </ul>)}
                {usuario?.rol === 'supervisor' && (
                    <ul className="cuadroEstd">
                        <h4 className="titulo">Empleados Activos</h4>
                        <h1 className="numero">{totalEmpleadosActivos}</h1>
                    </ul>)}
            </Container>

            <br />
            <br />
            {/* Sección para grafico de barra y "Productos con menor stock" */}
            <section className="resumen_1">
                <section className="datos-importantes">

                    <section className="cuadroProductPedido">
                        <h3 className="tituloTopProdc">Comparación Solicitudes Pedidos</h3>
                        <div style={{ display: "flex", color: "grey", justifyContent: "center", fontSize: "14px" }}>
                            <InfoOutlineIcon />
                            <p>Solicitudes y Pedidos de los ultimos 4 meses</p>
                        </div>
                        <div>

                            <ComparativoSolicitudesPedidos solicitudes={solicitudesMostrados} pedidos={pedidosMostrados} />
                        </div>
                    </section>

                    <section className="cuadroProductPedido">
                        <h3 className="tituloTopProdc">Productos más pedidos</h3>
                        <div style={{ display: "flex", color: "grey", justifyContent: "center", fontSize: "14px" }}>
                            <InfoOutlineIcon />
                            <p>Se muestran los 5 productos más pedidos</p>
                        </div>
                        <div style={{
                            border: ' 1px solid #5B5B5B', borderRadius: '10px',
                            padding: '10px',
                            boxShadow: '1px 1px 1px 1px rgba(91, 91, 91, 0.31)'
                        }}>
                            <TopProductosSolicitados solicitudes={solicitudesMostrados} />
                        </div>

                    </section>


                </section>
                <section className="cuadroProductPedido_2">

                    <h3 className="tituloProductoPedido">Tasa Aprobación Solicitudes</h3>
                    <TasaAprobacionDoughnut solicitudes={solicitudesMostrados} />
                </section>

            </section>
            <section className="resumen">
                <div className="grafico_barra">
                    <h4 className="titulo_d">Pedidos por semana</h4>
                    {/* Llamada del componente del grafico de barras*/}
                    <div className="grafico_b">
                        <Grafics_b />
                    </div>
                </div>

                {/* Sección para el cuadrado de productos con menor stock */}
                <section className="grafico">
                    <h4 className="titulo_d">Ultimas Solicitudes</h4>
                    <div style={{ display: "flex", color: "grey", justifyContent: "center", fontSize: "14px" }}>
                        <InfoOutlineIcon />
                        <p>Ultimas 5 solicitudes realizadas, selecciona uno para ver sus detalles</p>
                    </div>
                    {ultimasSolicitudes.length > 0 ? (
                        <TableContainer
                            component={Paper}
                            sx={{
                                maxHeight: 270,
                                maxWidth: 450,
                                background: '#232323',
                                '& .MuiTableRow-root': {
                                    height: "2vh",
                                    '& .MuiTableCell-root': {
                                        padding: '7px 18px',
                                        color: 'white',
                                        textAlign: 'center'
                                    }
                                },
                                                            '& .MuiTableRow-root:hover': {
                                background: '#363636'
                            }
                            }}
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
                                        <TableCell align="right">Total Productos</TableCell>
                                        <TableCell align="right">Estado</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {ultimasSolicitudes.map((solicitud) => (
                                        <TableRow
                                            key={solicitud.id_solc}
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 },cursor: 'pointer'  }}
                                            onClick={() => handleOpenModalResumen(solicitud)}
                                        >
                                            <TableCell component="th" scope="row">
                                                {solicitud.id_solc}
                                            </TableCell>
                                            <TableCell align="right">{formatFechaChile(solicitud.fecha_creacion)}</TableCell>
                                            <TableCell align="right">    {(solicitud.productos || []).reduce((total, producto) => 
        total + (Number(producto.cantidad) || 0), 0
    )}</TableCell>
                                            <TableCell>{getEstadoSolicitud(solicitud.estado)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
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
                    <div style={{ display: "flex", color: "grey", justifyContent: "center", fontSize: "14px" }}>
                        <InfoOutlineIcon />
                        <p>Selecciona un pedido para ver los detalles</p>
                    </div>
                    {/* Sección que contiene la tabla */}
                    <TableContainer component={Paper}
                        sx={{
                            maxHeight: 400, width: "auto", background: '#232323',
                            '& .MuiTableCell-root': { color: 'white', textAlign: 'center' },
                            '& .MuiTableRow-root:hover': {
                                background: '#363636'
                            }
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
                                    <TableCell>Fecha Entrega</TableCell>
                                    <TableCell>Estado</TableCell>

                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {/*Reorrido de los datos */}
                                {ultimosPedidos.map((row) => (
                                    <TableRow
                                        key={row.id_p}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 }, cursor: 'pointer' }}
                                        onClick={() => handleOpenModal(row)}
                                    >
                                        <TableCell component="th" scope="row">
                                            {row.id_p} </TableCell>
                                        <TableCell component="th" scope="row">
                                            {SUCURSALES.find(s => s.id == row.sucursal_fk)?.nombre ?? 'N/A'}
                                        </TableCell>
                                        <TableCell>                       {(row.detalles_pedido || []).reduce((total, producto) =>
                                            total + (parseInt(producto.cantidad, 10) || 0), 0
                                        )}</TableCell>
                                        <TableCell> {(() => {
                                                if (!row.fecha_entrega) return 'N/A';
                                            
                                                const datePart = row.fecha_entrega.split('T')[0];
                                                return new Date(datePart + 'T00:00:00').toLocaleDateString('es-CL');
                                            })()}</TableCell>
                                        <TableCell>{getEstadoPedido(row.estado_pedido_fk)}</TableCell>




                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>
            </section>
            <PedidoDetalleModal
                open={modalOpen}
                onClose={handleCloseModal}
                pedido={pedidoSeleccionado}
            />
            <SolicitudDetalleModal
                open={modalOpenResumen}
                onClose={handleCloseModalResumen}
                solicitud={solicitudSeleccionado}
            />
        </Contenedor_Dashboard>

    );
}

{/*Sección de estilos */ }
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
    width:180px;
    height: 8vw;
    display:flex;
    flex-direction:column;
    align-items:start;
    border: 1px solid rgb(36, 34, 34);
    color: yellow;
    box-sizing:border-box;
    border-radius:10px;
    background-color:rgb(20, 20, 20);
    }

    .numero{
        font-size:4vw;
        position:relative;
        color:white;
        align-items:center;

    }
    .titulo{
        display:flex;
        color:#FFD700;


    }
    .titulo_d{
        display:flex;
        color:#FFD700;
        margin-bottom:20px;
    }

    .titulo_bn{
        display:flex;
        flex-direction:column;
        color: yellow;
        align-items:start;
        justify-content:start;
        width:50%;
        margin-left:5vw;
        font-size:30px;
        margin-top:10px;

    }

    .resumen{
        display: grid;
        grid-template-columns: auto auto ;
        aling-items:start;
        gap:120px;
        justify-content: center;
        max-width:100%;
        heigth:50vh;
    }
    .resumen_1{
        display: grid;
        grid-template-columns: auto auto ;
        aling-items:start;
        gap:160px;
        justify-content: center;
        max-width:100%;
        heigth:50vh;
        margin-bottom:30px;
    }
    .grafico{
        padding:20px;
        margin:0;
        background-color: rgb(20, 20, 20);
        border: 1px solid rgb(36, 34, 34);
        border-radius:10px;


        
    }
    .grafico_barra{
        padding:20px;
        margin:0;
        border: 1px solid rgb(36, 34, 34);
        background-color: rgb(20, 20, 20);
        border-radius:10px;

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
        border-radius:10px;

    }
    .table_u_p{
        width: 60%;
        display: grid;
        justify-content: center;
        align-content: start;
        border: 1px solid rgb(36, 34, 34);
        background-color: rgb(20, 20, 20);
        padding: 10px;
        border-radius:10px;

        }

    .titulo_u{
        display:flex;
        margin-bottom:20px;
        color:#FFD700;
        justify-content:start;
    }

    .tituloTopProdc{
        display:flex;
        margin-bottom:20px;
        color:#FFD700;
        justify-content:start;
    }
        .tituloProductoPedido{
        display:flex;
        margin-bottom:20px;
        color:#FFD700;
        justify-content:start;
    }
    .datos-importantes{
        display:grid;
        grid-template-column: auto  ;
        align-items: start;
        gap:20px;
        margin-bottom:20px;
    }

    .cuadroProductPedido{
        padding:10px;
        background-color: rgb(20, 20, 20);
        box-shadow:1px 1px 1px 1px rgba(91, 91, 91, 0.31);
        border: 1px solid rgb(36, 34, 34);
        border-radius:10px;
        }
    .cuadroProductPedido_2{
        padding:10px;
        background-color: rgb(20, 20, 20);
        box-shadow:1px 1px 1px 1px rgba(91, 91, 91, 0.31);
        border: 1px solid rgb(36, 34, 34);
        border-radius:10px;
        height:42vw;
        width:20vw;
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
const Loader = styled.div`
    display:flex;
    position:fixed;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    background: rgba(0, 0, 0, 0.52);
    z-index: 1000;
    right:0;
    top: 0;
    width: 85.5%;
    height: 100%;

    img{
        width: 150px;
        height: 150px;

        animation: animate 2s infinite ease-in-out;
    
    }
    p{
        text-align:center;
        font-size:30px;
        font-weight:bold;
        animation: animate 2s infinite ease-in-out;

    }

    @Keyframes animate{
      0% {
        transform: scale(1);
        opacity:60%;
  }
  50% {
    transform: scale(1.1); /* Aumenta el tamaño al 110% */
        opacity:100%;
  }
  100% {
    transform: scale(1);
    opacity:60%;
  }
    }
        
 `