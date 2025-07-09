import styled from "styled-components";

{/* Se importan los componentes de los graficos*/}
import { Grafics_b } from "../graficos/Grafics_bar";
import { Grafics_Pie } from "../graficos/Grafics_pie";
import { PedidosSucursal } from "../graficos/sucursalespedidos";
{/* Fin importaciones de componentes graficos */}

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Chip } from "@mui/material";
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import Tooltip from '@mui/material/Tooltip';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';


import ordena from "../../assets/ordena.svg";


//Obtención de datos de la api por medio del archivo store
import { useHistorialStore } from "../../store/useHistorialStore";
import { useHistProductStore } from "../../store/useHistorialStore";
import { useInventariosStore } from "../../store/useProductoStore";
import { useProveedoresStore } from "../../store/useProveedorStore";


import { useUsuariosStore } from "../../store/useUsuarioStore";

//datos de la autenticación
import { useAuthStore } from "../../store/useAuthStore";

import stockImage  from '../../assets/en-stock.png';
import {use, useEffect, useMemo, useState } from "react";

//import { useEffect } from "react";

import { SUCURSALES } from "../../constants/ubicaciones";
import { formatFechaChile } from '../../utils/formatFechaChile';

import PedidoDetalleModal from "../pedidos/pedidoDetalle";
import {ProductoMasPedido} from "../graficos/productosDemandas";


export function CountElement() {

    //Obtención perfil de usuario
    const {usuario} = useAuthStore();


    // Estado para el modal de detalles
    const [modalOpen, setModalOpen] = useState(false);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<any>(null);

    //Definición de constante para obtener datos 

    const {pedidos,fetchPedidos, loading:loadingPedidos} = useHistorialStore();
    const {productos, fetchProducts,loading:loadingProducto} = useHistProductStore();
    const {usuarios,fetchUsuarios, loading:loadingUsuarios} = useUsuariosStore();
    const {proveedores,fetchProveedores,loading:loadingProveedor} = useProveedoresStore();

    // Siempre trabajar con un array seguro
    const usuariosArray = Array.isArray(usuarios) ? usuarios : (usuarios?.results || []);
    const productosArray = Array.isArray(productos) ? productos : (productos?.results || []);

    const isLoading = loadingPedidos || loadingProducto || loadingProveedor || loadingUsuarios;

    const [state, setState] = useState(false);
    const [prod,setProd] = useState(false);



   // const prodct = useInventariosStore(state=>state.inventarios)
  //  const prodcts = Object.values(prodct).flat();
  // Cargar los datos cuando el componente se monta
    useEffect(() => {
        const bodegaId = usuario?.tipo === 'bodega' && usuario.bodega ? String(usuario.bodega) : undefined;
        fetchPedidos({ bodega_id: bodegaId });
        fetchProducts({bodega_id:bodegaId});
        fetchUsuarios();
        fetchProveedores();

    }, [usuario,fetchPedidos, fetchProducts,fetchUsuarios,fetchProveedores]);   


 
    //almacenar datos
    //let pedidosMostrados = pedidos;
    //let inventarioMostrados = productos;

    //filtrar datos según el perfil bodega
    const {pedidosMostrados,inventarioMostrados} = useMemo(() => {
        if (usuario?.tipo === 'bodega' && usuario.bodega){

            const bodegaId = String(usuario.bodega);

            const pedidosFiltrados = pedidos.filter(p => String(p.bodega_fk)=== bodegaId);

            const inventarioFiltrados = productosArray.filter(p => String(p.bodega_fk) === bodegaId);
            return {pedidosMostrados: pedidosFiltrados, inventarioMostrados: inventarioFiltrados};
        }
        return {pedidosMostrados: pedidos, inventarioMostrados: productosArray}
    },[usuario, pedidos, productosArray]);

    //Se obtiene los pedidos según el id del estado_pedido
    const pedidosActivos = useMemo(()=>
        (pedidosMostrados || []).filter(p => p.estado_pedido_fk === 1).length
    ,[pedidosMostrados]) ;

    //Se obtinen los pedidos pendientes
    const pedidosPendientes = useMemo(()=>
        (pedidosMostrados || []).filter(p => p.estado_pedido_fk === 3).length,
    [pedidosMostrados]
    )
    const pedidosCompletados = useMemo(()=>
        (pedidosMostrados || []).filter(p => p.estado_pedido_fk === 2).length,
    [pedidosMostrados]
    )

    //Se obtiene los productos bajos, por medio de un filtro comparando el stock y el stock minimo
    const productossStockBajo = useMemo(() => 
        (inventarioMostrados || []).filter(p=>p.stock <= p.stock_minimo
        ),[inventarioMostrados]
    );

    //Se obtiene los ultimos pedidos por fecha y se muestran solo los cinco "ultimos"
   const ultimosPedidos = useMemo(() => {
        return [...(pedidosMostrados || [])]
            .sort((a, b) => new Date(b.fecha_entrega).getTime() - new Date(a.fecha_entrega).getTime())
            .slice(0, 5);
    }, [pedidosMostrados]);

    //producto más pedido
    const productoMasPedido = useMemo(() => {
        if(!pedidosMostrados || pedidosMostrados.length === 0){
            return {nombre:'N/A', cantidad:0};
        }

        //mapa para contar la cantidad total
        const contadorProductos = new Map<string,number>();

        pedidosMostrados.forEach(pedido => {
            pedido.detalles_pedido?.forEach(detalle => {
                const cantidad = parseInt(detalle.cantidad,10);
                if(detalle.producto_nombre && !isNaN(cantidad)){
                    const totalActual = contadorProductos.get(detalle.producto_nombre) || 0;
                    contadorProductos.set(detalle.producto_nombre,totalActual + cantidad);
                }
            });
        });

        if (contadorProductos.size === 0){
            return {nombre:'N/A', cantidad:0};
        }
        //encontrar cantidad maxima
        const [nombre, cantidad] = [...contadorProductos.entries()].reduce((max,current) => current[1] > max[1] ? current : max);

        return {nombre,cantidad};
    },[pedidosMostrados]);

      //sucursal con más pedidos
    const SucursalMasPedidos = useMemo(() => {
        if(!pedidosMostrados || pedidosMostrados.length === 0){
            return {nombre: 'N/A',cantidad:0};
        }

        const contadorSucursales = new Map<number,{nombre:string,cantidad:number}>();

        pedidosMostrados.forEach(pedido => {
            //contar pedido solo de sucursales
            if (pedido.sucursal_nombre){
                contadorSucursales.set(pedido.sucursal_nombre, (contadorSucursales.get(pedido.sucursal_nombre) || 0) + 1);
            }
        });
        if (contadorSucursales.size === 0) {
            return { nombre: 'N/A', cantidad: 0 };
        }

        // Encontrar la sucursal con más pedidos
        const [nombre, cantidad] = [...contadorSucursales.entries()].reduce(
            (max, current) => (current[1] > max[1] ? current : max)
        );

        return { nombre, cantidad };
    },[pedidosMostrados]);

    useEffect(() => {
        const isModalOpen = state || prod;
        document.body.style.overflow = isModalOpen ? 'hidden' : 'auto';
        //recuperar scroll
        return () => { document.body.style.overflow = 'auto'; }; 
    }, [state, prod]);

    //se obtiene el total de productos
    const totalProducts = inventarioMostrados.length;

    const totalEmpleadosActivos = useMemo(() => {
        if (usuario?.rol === 'supervisor' && usuario.bodega) {
            return usuariosArray.filter(emp => emp.bodeg_fk == usuario.bodega && emp.is_active).length;
        }
        return 0;
    }, [usuariosArray, usuario]);

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

    const handleOpenModal = (pedido: any) => {
        setPedidoSeleccionado(pedido);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setPedidoSeleccionado(null);
    };
   if (isLoading) {
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
            {(state || prod) && <Backdrop onClick={()=>{setState(false);setProd(false);}}/>}
            <h1 className="titulo_bn">Bienvenido,  {usuario?.nombre || ' usuario'} 

                <span style={{color:'#FFD700', marginLeft:'8px',justifyContent:'start',width:'100%',fontSize:'18px',}}>
                    {usuario?.rol} 
                    </span>
            </h1>

            {state && <PedidosSucursal pedidos={pedidosMostrados} setState={() => setState(false)} />}
            
            {prod && <ProductoMasPedido pedidos={pedidosMostrados} inventario={inventarioMostrados} setProd={() => setProd(false)} />}
        {/*container para los cuadrados resumen */}
            <Container>
                <ul className="cuadroEstd">
                    <h4 className="titulo">Pedidos Activos</h4>
                    <h1 className="numero">{pedidosActivos}</h1>
                </ul>
                <ul className="cuadroEstd">
                    <h4 className="titulo">Total Inventario</h4>
                    <h1 className="numero">{totalProducts}</h1>
                </ul>
                <ul className="cuadroEstd">
                    <h4 className="titulo">Pedidos Pendientes</h4>
                    <h1 className="numero">{pedidosPendientes}</h1>
                </ul>
                {/*cuadros segun el rol */}
                {usuario?.rol != 'supervisor' && (
                <ul className="cuadroEstd">
                    <h4 className="titulo">Pedidos Completados</h4>
                    <h1 className="numero">{pedidosCompletados}</h1>
                </ul>)}
                {usuario?.rol === 'supervisor' && (
                    <ul className="cuadroEstd">
                        <h4 className="titulo">Empleados Activos</h4>
                        <h1 className="numero">{totalEmpleadosActivos}</h1>
                    </ul>
                )} 
            </Container>

            <br />
            <br />
            {/* Sección para grafico de barra y "Productos con menor stock" */}
            <section className="resumen">
                <section>
                    <div className="grafico_barra">
                        <h3 className="titulo_d">Pedidos por semana</h3>
                        <div style={{display:"flex", color:"grey",justifyContent:"center",fontSize:"14px"}}>
                            <InfoOutlineIcon/>
                            <p>Selecciona el tipo de pedido</p>
                        </div>
                        {/* Llamada del componente del grafico de barras*/}
                        <div className="grafico_b">
                            <Grafics_b />
                        </div>
                    </div>
                </section>
                {/* Sección para el cuadrado de productos con menor stock */}
                <section className="grafico">
                    <h3 className="titulo_d">Productos con stock mínimo</h3>

                     {productossStockBajo.length === 0 ? (
                        <Mensaje>
                            <img src={stockImage} alt="producto con stock" />
                            <p>¡Todos los productos tienen stock suficiente!</p>
                        </Mensaje>
                    ) : (
                        /* Tabla que contiene información de productos con menor stock */
                        <TableContainer
                            component={Paper}
                            sx={{
                                maxHeight:320,
                                minHeight:320,
                                maxWidth:290,
                                background: '#232323',padding:"10px",
                                '& .MuiTableRow-root': { height: "2vh",
                                '& .MuiTableCell-root': {
                                    padding: '7px 9px',
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
                                        <TableCell>Producto</TableCell>
                                        <TableCell align="right">Stock Actual</TableCell>
                                        <TableCell> Stock Mínimo </TableCell>
                                    </TableRow>
                                </TableHead>

                            {/*Cuerpo de tabla */}
                                <TableBody>
                                    {productossStockBajo.map((row) => (
                                        <TableRow
                                            key={row.id_prodc}
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                        >
                                            <TableCell component="th" scope="row">
                                                {row.id_prodc}
                                            </TableCell>
                                            <TableCell align="right">{row.nombre_prodc}</TableCell>
                                            <TableCell align="right">{row.stock}</TableCell>
                                            <TableCell align="right">{row.stock_minimo}</TableCell>

                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                
                </section>
                <section className="datos-importantes">
                    <section className="cuadroProductPedido">
              
                    <h3 className="tituloProductoPedido">Producto más Pedido</h3>
                    <div className="sucursalesPedidosInfo">
                        <div className="sucursalTotal">
                            <h4>{productoMasPedido.nombre}</h4>
                            <p> {productoMasPedido.cantidad} unidades</p> 
                        </div>
                            <div className="sucursalesPedidos">
                                <Tooltip title="Ver más información" arrow>
                                    <div className="buttonBackground">
                                        <button onClick={()=>setProd(!prod)} className={prod ? 'open':''}>
                                            <UnfoldMoreIcon/>
                                        </button>

                                    </div>

                                </Tooltip>
                            </div>
                    </div>

                    </section>

                    <section className="cuadroProductPedido">
                    <h3 className="tituloProductoPedido">Sucursal con más pedidos</h3>
                        <div className="sucursalesPedidosInfo">
                            <div className="sucursalTotal">
                                <h4> {SucursalMasPedidos.nombre} </h4>
                                <p>{SucursalMasPedidos.cantidad} Pedidos</p>
                            </div>
                            <div className="sucursalesPedidos">
                                <Tooltip title="Ver más sucursales" arrow>
                                    <div className="buttonBackground">
                                    <button onClick={()=>setState(!state)} className={state ? 'open':''}>
                                        <UnfoldMoreIcon/>
                                    </button>
                                    </div>

                                </Tooltip>
                            </div>
                        </div>
                    </section>
                </section>
                
            </section>
            {/* Sección para el gráfico de estado de pedidos y tabla de últimos pedidos */}    
            <section className="u_pedido">
                <div className="grafico_c">
                    <h3 className="titulo_u">Estado de los pedidos</h3>
                    {/* Llamada del componente del grafico circular*/}
                    <div className="grafico_p">
                         <div style={{display:"flex", color:"grey",justifyContent:"center",fontSize:"14px"}}>
                            <InfoOutlineIcon/>
                            <p>Selecciona el tipo de pedido</p>
                        </div>
                    <Grafics_Pie />
                    </div>
                </div>

                {/*Sección para tabla de información de ultimos pedidos */}
                <div className="table_u_p">
                    <h3 className="titulo_u">Ultimos Pedidos</h3>
                        <div style={{display:"flex", color:"grey",justifyContent:"center",fontSize:"14px"}}>
                            <InfoOutlineIcon/>
                            <p>Selecciona un pedido para ver los detalles</p>
                        </div>
                    {/* Sección que contiene la tabla */}
                    <TableContainer component={Paper}
                        sx={{
                            maxHeight:400,
                            width: "auto", background: '#232323',
                            '& .MuiTableCell-root': { color: 'white', textAlign: 'center', 
                            },
                            '& .MuiTableRow-root:hover': {
                                background:'#363636'
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
                                    <TableCell>Origen/Destino</TableCell>
                                    <TableCell>Total Productos</TableCell>
                                    <TableCell>Fecha Entrega</TableCell>
                                    <TableCell>Estado</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {/*Reorrido de los datos */}
                                {ultimosPedidos.map((pedido) => (
                                    <TableRow
                                        key={pedido.id_p}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 },cursor:'pointer' }}
                                        onClick={() => handleOpenModal(pedido)}
                                    >
                                        <TableCell component="th" scope="row">
                                            {pedido.id_p} </TableCell>
                                        <TableCell component="th" scope="row">
                                            {pedido.sucursal_nombre || pedido.proveedor_nombre || 'N/A'}
                                        </TableCell>
                                        <TableCell>{(pedido.detalles_pedido || []).reduce((total, detalle) =>
                                                total + (parseInt(detalle.cantidad, 10) || 0), 0
                                            )}</TableCell>
                                        <TableCell>{formatFechaChile(pedido.fecha_entrega)}</TableCell>
                                        <TableCell>{getEstadoPedido(pedido.estado_pedido_fk)}</TableCell>


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
        grid-template-columns: auto auto auto;
        aling-items:start;
        gap:50px;
        justify-content: center;
        max-width:100%;
        heigth:50vh;

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

    .datos-importantes{
        display:grid;
        grid-template-columns: auto;
        align-items: start;
        gap:10px;
        
    }
    .cuadroProductPedido{
        padding:20px;
        background-color: rgb(20, 20, 20);
        box-shadow:1px 1px 1px 1px rgba(91, 91, 91, 0.31);
        border: 1px solid rgb(36, 34, 34);
        border-radius:10px;

        .tituloProductoPedido{
            color:#FFD700;
            margin-bottom:20px;
            
        }
        h4{
         font-size:20px;
        }

        .sucursalesPedidosInfo{
        width:100%;
        display: grid;
        margin-right:2vw;
        align-items:center;
        background:#232323;
        padding:10px 0px 0px 10px;
        border-radius:10px;
                


            .sucursalTotal{
            }
            .sucursalesPedidos{
                align-items:center;
                justify-content:flex-end;
                display:flex;
                .buttonBackground{
                    background:rgb(20, 20, 20);
                    padding:10px 0px 0px 10px;
                    border-radius:20px 0px 0px 0px;

                }
                button{
                    background-color:#FFD700;
                    color:#1a1a1a;
                    font-size:1vw;
                    font-weight:bold;
                    transition: transform 0.5s ease-in-out;
                    border-radius:15px;
                      background-clip: padding-box;

                    &:hover{
                        transform: scale(1.1);

                    }
                    &:focus{
                        outline:none;
                    }
                    &.open{
                        transform: scale(1.1);
                    
                    }
                    svg {
                        transition: transform 0.8s ease-in-out;
                         transform: rotate(55deg);
                         border:none;

                    }
                    &:hover svg {
                        transform: rotate(55deg) scale(1.5);
                        border:none;


                    }
                    &.open svg {
                        border:none;
                        transform: rotate(55deg) scale(1.5);
                    }
                    
                }

            }
        }
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
        align-items: center;
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
 const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 99;
  cursor: pointer;`