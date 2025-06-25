import styled from "styled-components";

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Select, MenuItem } from "@mui/material";

import { BtnAct } from "../button/ButtonHist";

import { PedidoDetalle } from "./DetallePedido";
import { DespachoDetalle } from "./DetalleDespacho";
import { useEffect, useState, useMemo } from "react";

import ordena from "../../assets/ordena.svg";

//Obtención de datos de la api por medio del archivo store
import { useHistorialStore } from "../../store/useHistorialStore";


//import ReplayIcon from '@mui/icons-material/Replay';



interface Props {
    setPedido: () => void;
}

export function PedidoHistorial({ setPedido }: Props) {

    const [busqueda, setBusqueda] = useState("");
    const [detalle, setDetalle] = useState(false);
    const [despacho, setDespacho] = useState(false);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<number | null>(null);

    const { pedidos, fetchPedidos, loading, error } = useHistorialStore();

    const [sucursalSeleccionada, setSucursalSeleccionada] = useState("");
    const [usuarioSeleccionada, setUsuarioSeleccionada] = useState("");

    useEffect(() => {
        fetchPedidos();
    }, [fetchPedidos]);
    
    const sucursalesBusqueda = useMemo(() => {
        const nombres = pedidos.map(p => p.sucursal_fk?.nombre_sucursal).filter(Boolean);
        return [...new Set(nombres)];
    },[pedidos]);

    const usuariosBusqueda = useMemo(() => {
        const nombresUs = pedidos.map(p => p.solicitud_fk?.usuario_nombre).filter(Boolean);
        return [...new Set(nombresUs)];
    },[pedidos]);

    // sección para definir los datos para la busqueda
    const pedidosFiltros = useMemo(()=>{
        return pedidos.filter(pedido => {
            //filtro para sucursal
            const filtroSucursal = sucursalSeleccionada
            ? pedido.sucursal_fk?.nombre_sucursal === sucursalSeleccionada
            : true;

            //filtro para usuario
            const filtroUsuario = usuarioSeleccionada
            ? pedido.solicitud_fk?.usuario_nombre === usuarioSeleccionada
            : true;

            //filtro para la barra de busqueda
            const busquedaLower = busqueda.toLowerCase();
            const filtroBusqueda = busquedaLower === ""
            ? true
            : (
                (pedido.sucursal_fk?.nombre_sucursal || "").toLowerCase().includes(busquedaLower) ||
                (pedido.fecha_entrega || "").toLowerCase().includes(busquedaLower) ||
                (pedido.personal_entrega_fk?.nombre_psn || "").toLowerCase().includes(busquedaLower) ||
                (pedido.solicitud_fk?.usuario_nombre || "").toLowerCase().includes(busquedaLower) ||
                String(pedido.solicitud_fk?.productos.length || 0).includes(busquedaLower)
            );
            return filtroSucursal && filtroBusqueda && filtroUsuario;
            
        });
    },[sucursalSeleccionada, pedidos,busqueda, usuarioSeleccionada])
    
    
    //Configuracion en caso de carga
        if (loading) return (
            <Loader>
                <>
                <img src={ordena} alt="Ordena_logo" />
                <p>Ordena</p>
                {/* <div>Cargando...</div> */}
                </>
            </Loader>)
        if (error) return <div>Error: {error}</div>;

    return (
        <Container>
            <div className="cerr">
                <span onClick={setPedido} className="vol"> 🠔 Volver</span>
            </div>
            <div>
                <h2>Historial Pedidos</h2>
            </div>
            <section className="Botones">
                <div className="Boton-start">
                    <input type="text" placeholder="Buscar..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                    />
                </div>
                <div className="Boton_center">
                        <Select
                            value={sucursalSeleccionada}
                            onChange={(e) => setSucursalSeleccionada(e.target.value)}
                            displayEmpty
                            style={{ width:'10vw', height:40,background: "#2E2E2E", color: "white", borderRadius: "5px" }}
                          >
                            <MenuItem value=""><em>Sucursales (Todos)
                                </em></MenuItem>
                            {sucursalesBusqueda.map((sucursal)=>(

                            <MenuItem 
                            key={sucursal}
                            value={sucursal}>{sucursal}</MenuItem>
                            ))}

                          </Select>

                             <Select
                            value={usuarioSeleccionada}
                            onChange={(e) => setUsuarioSeleccionada(e.target.value)}
                            displayEmpty
                            style={{ width: '10vw', height:40,background: "#2E2E2E", color: "white", borderRadius: "5px" }}
                          >
                            <MenuItem value="">Usuarios (Todos)</MenuItem>
                            {usuariosBusqueda.map((usuario)=>  (

                                <MenuItem key={usuario} value={usuario}>{usuario}</MenuItem>
                            ))}
                          </Select>
 
                </div> 
                <div className="Boton-end">
                    <BtnAct titulo="Recargar"
                         background="#1E1E1E" 
                         funcion={fetchPedidos}/>
                    <BtnAct titulo="Exportar" background="#1E1E1E" />
                </div>
            </section>
            {/*Tabla central */}
            <div className="table-container">

                <TableContainer component={Paper}
                    sx={{
                        maxHeight: '30vw', width: "60vw",
                        minHeight:'30vw',background:"#232323",
                        '& .MuiTableCell-root': {
                            color: 'white', textAlign: 'center'
                        },
                        '@media (max-width: 768px)': {
                            width: '100%', // o el valor que prefieras
                            minWidth: 0,
                            maxWidth: '70vw',
                            maxHeight: '40vw',
                        }
                    }}
                >
                    
                    <Table sx={{ minWidth: 650 }} aria-label="simple table" stickyHeader>
                        <TableHead sx={{
                            '& .MuiTableCell-root': {
                                backgroundColor: '#232323',
                                color: 'white'
                            }
                        }} >

                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Fecha Inicio</TableCell>
                                <TableCell align="right">Fecha Entrega</TableCell>
                                <TableCell align="right">Sucursal</TableCell>
                                <TableCell align="right">Usuario</TableCell>
                                <TableCell align="right">Cantidad(total)</TableCell>
                                <TableCell align="right">Productos</TableCell>
                                <TableCell align="right">
                                    Transportista
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody
                            sx={{ background: "#232323" }}
                        >
                        {/*Recorrido de los datos utilizando la constante de filtro de busqueda */}    
                            {pedidosFiltros.map((pedido) => (
                                <TableRow
                                    sx={{ 
                                        '&:last-child td, &:last-child th': { border: 0 },
                                        backgroundColor: pedido.id_p === pedidoSeleccionado ? 'rgba(243, 210, 22, 0.7)' : 'transparent',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.08)'
                                        }
                                    }}
                                >
                                    <TableCell component="th" scope="row">
                                        {pedido.id_p}
                                    </TableCell>
                                    <TableCell component="th" scope="row">
                                        {pedido.solicitud_fk?.fecha_creacion.split('T')[0]}-
                                        {pedido.solicitud_fk?.fecha_creacion.split('T')[1].split('.')[0]}
                                    </TableCell>
                                    <TableCell align="right">
                                        {pedido.fecha_entrega.split('T')[0]}-
                                        {pedido.fecha_entrega.split('T')[1].split('.')[0]}</TableCell>
                                    <TableCell align="right">
                                        {pedido.sucursal_fk?.nombre_sucursal}</TableCell>
                                    <TableCell align="right">
                                        {pedido.solicitud_fk?.usuario_nombre}</TableCell>
                                    <TableCell align="right">
                                        <p>
                                            {pedido.solicitud_fk?.productos.length}
                                        </p>

                                    </TableCell>

                                    {/*sección de botónes para ver detalles de productos y del transportista */}
                                    <TableCell
                                        align="right"
                                    ><button onClick={() => {
                                        setPedidoSeleccionado(pedido.id_p);
                                        setDetalle(true);
                                    }} className="button_det">Ver</button></TableCell>
                                    <TableCell align="right">
                                        <button
                                            onClick={() => {
                                                setPedidoSeleccionado(pedido.id_p);
                                                setDespacho(true);
                                            }}
                                            className="buttton_des"
                                        >
                                            Ver
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))}

                        </TableBody>
                    </Table>
                </TableContainer>
            </div>

            {/* sección para mostrar los componentes que son llamados en lo botones, se da el id para obtener los datos correctos del pedido*/}
            {detalle && pedidoSeleccionado !== null && (
                <PedidoDetalle
                    id={pedidoSeleccionado}
                    setDetalle={() => {setDetalle(false)
                        setPedidoSeleccionado(null)
                    }}
                />
            )}
            {despacho && pedidoSeleccionado !== null && (
                <DespachoDetalle
                    id={pedidoSeleccionado}
                    setDespacho={() => {setDespacho(false)
                        setPedidoSeleccionado(null)
                    }}
                />
            )}
        </Container>
    );
}

const Container = styled.div`
  position: fixed;
  height: 90vh;
  width: 70%;
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
  border:1px solid rgb(122, 119, 119);

    .cerr{
        margin-bottom:2vw;
        margin-top:1vw;
        font-size:20px;
        cursor:pointer;
    }

  .table-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding:0;
    
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
        padding: 0.8em;
        border-radius:10px;
        border:none;
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

    .button_det{
        background:rgb(140, 219, 144);
        color:rgb(17, 152, 23);
        font-size:14px;
        font-weight:bold;
        border: 2px solid rgb(17, 152, 23);
        border-radius:5px;

        &:hover{
        transition:0.9s;
        background:#2AC034;
        color: white
        }
    }

    .buttton_des{
        background:rgb(214, 219, 140);
        color:rgb(152, 127, 17);
        font-size:14px;
        font-weight:bold;
        border: 2px solid rgb(152, 152, 17);
        border-radius:5px;

        &:hover{
        transition:0.9s;
        background:#c0bb2a;
        color: white
        }
    }

  /* --- MEDIA QUERY --- */
  @media (max-width: 768px) {
    width: 95vw;
    left: 50%;
    padding: 8px 4px 12px 4px;

    .table-container {
      width: 100%;
      heigh:50%;
      padding: 0;
      position: static;
    }
  }
 `

//Estilos para loading
 const Loader = styled.div`
    display:flex;
    position:fixed;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    left:0;
    top: 0;
    width: 100%;
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