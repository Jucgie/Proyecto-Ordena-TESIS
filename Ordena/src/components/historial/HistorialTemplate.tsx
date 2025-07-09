import { useEffect, useState, useCallback } from "react";
import { BtnHistorial } from "../button/ButtonHist";
import { InventarioHistorial } from "../modulosHistorial/InventarioHistorial";
import { PedidoHistorial } from "../modulosHistorial/PedidosHistorial";
import { PedidosHistorialSucursal } from "../modulosHistorial/PedidosHistorialSucursal";
import { EmpleadoHistorial } from "../modulosHistorial/EmpleadosHistorial";
import styled from "styled-components";
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';
import { historialService } from "../../services/historialService";
import { useAuthStore } from "../../store/useAuthStore";
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Typography, Chip } from "@mui/material";
import { formatFechaChile } from '../../utils/formatFechaChile';



export function HistorialTemplate() {

    const [historial, setHistorial] = useState(false);
    const [pedido, setPedido] = useState(false);
    const [movimientos, setMovimientos] = useState<any[]>([]);
    const [loadingMov, setLoadingMov] = useState(false);
    const usuario = useAuthStore((state: any) => state.usuario);

    useEffect(()=>{
        if(pedido) {
            document.body.style.overflow="hidden";
        }else{
            document.body.style.overflow='';
        }
        return ()=>{
            document.body.style.overflow="";
        };
    },[pedido]);
    useEffect(()=>{
        if(historial) {
            document.body.style.overflow="hidden";
        }else{
            document.body.style.overflow='';
        }
        return ()=>{
            document.body.style.overflow="";
        };
    },[historial]);

    // Cargar movimientos recientes de inventario y pedidos
    const cargarMovimientos = useCallback(async () => {
        setLoadingMov(true);
        try {
            // Detectar ubicación activa
            let filtros: any = { limit: 10, offset: 0 };
            let ubicacionActiva = null;
            if (usuario?.bodeg_fk?.id_bdg) {
                filtros.bodega = usuario.bodeg_fk.id_bdg;
                ubicacionActiva = { tipo: 'bodega', id: usuario.bodeg_fk.id_bdg };
            } else if (usuario?.sucursal_fk?.id) {
                filtros.sucursal = usuario.sucursal_fk.id;
                ubicacionActiva = { tipo: 'sucursal', id: usuario.sucursal_fk.id };
            }
            // Movimientos de inventario (últimos 10 SOLO de la ubicación activa)
            const inv = await historialService.getMovimientosInventario(filtros);
            // Pedidos recientes (últimos 10) usando el cliente autenticado
            const pedidosResp = await historialService.getPedidosRecientes({ limit: 10 });
            let pedidos = pedidosResp.pedidos || [];
            // Filtrar pedidos por ubicación activa
            if (ubicacionActiva) {
                pedidos = pedidos.filter((p: any) => {
                    if (ubicacionActiva.tipo === 'bodega' && p.bodega_fk === ubicacionActiva.id) return true;
                    if (ubicacionActiva.tipo === 'sucursal' && p.sucursal_fk === ubicacionActiva.id) return true;
                    return false;
                });
            }
            // Unificar y ordenar por fecha descendente
            const movimientosUnificados = [
                ...inv.movimientos.map((m: any) => ({
                    tipo: "Inventario",
                    fecha: m.fecha,
                    descripcion: `${m.tipo_movimiento} - ${m.producto_nombre}`,
                    usuario: m.usuario_nombre,
                    ubicacion: m.ubicacion_nombre || m.ubicacion || '',
                    detalle: m,
                })),
                ...pedidos.map((p: any) => ({
                    tipo: "Pedido",
                    fecha: p.fecha_entrega,
                    descripcion: p.descripcion,
                    usuario: p.usuario_nombre,
                    ubicacion: p.ubicacion_nombre || p.ubicacion || '',
                    detalle: p,
                }))
            ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
            setMovimientos(movimientosUnificados);
        } catch (e) {
            setMovimientos([]);
        } finally {
            setLoadingMov(false);
        }
    }, [usuario]);
    useEffect(() => { cargarMovimientos(); }, [cargarMovimientos]);

    return(
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100"
        
        >
            <ContainerButtons>   
                <BtnHistorial titulo={
                    <>
                    <ContentPasteIcon sx={{ fontSize: 85, display:"flex",justifyContent:"center",color:"#FFD700"}}/>
                    Inventario
                    </>
                    } funcion={()=>setHistorial(true)} background="#1b1a1a"/>
                <BtnHistorial titulo={
                    <>
                        <LocalShippingIcon sx={{fontSize:85, display:"flex", justifyContent:"center",color:"#FFD700"}}/>
                        Pedidos
                    </>
                } funcion={()=>setPedido(true)} background="#1b1a1a"/>
            </ContainerButtons>
            <section>
                <div>
            {
                historial && <InventarioHistorial setHistorial={() => setHistorial(false)} />
            }
            {
                pedido && (usuario?.sucursal
                    ? <PedidosHistorialSucursal setPedido={() => setPedido(false)} />
                    : <PedidoHistorial setPedido={() => setPedido(false)} />)
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
    align-content:center;
    margin-top:2vw;
    gap:40px;


    @media (max-width: 768px){
    flex-direction:column;
    }
`