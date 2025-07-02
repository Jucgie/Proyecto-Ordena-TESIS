import { useEffect, useState, useCallback } from "react";
import { BtnHistorial } from "../button/ButtonHist";
import { InventarioHistorial } from "../modulosHistorial/InventarioHistorial";
import { PedidoHistorial } from "../modulosHistorial/PedidosHistorial";     
import { EmpleadoHistorial } from "../modulosHistorial/EmpleadosHistorial";
import styled from "styled-components";
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';
import { historialService } from "../../services/historialService";
import { useAuthStore } from "../../store/useAuthStore";
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Typography, Chip } from "@mui/material";



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
            // Movimientos de inventario (últimos 10)
            const inv = await historialService.getMovimientosInventario({ limit: 10, offset: 0 });
            // Pedidos recientes (últimos 10) usando el cliente autenticado
            const pedidosResp = await historialService.getPedidosRecientes({ limit: 10 });
            const pedidos = pedidosResp.pedidos || [];
            // Unificar y ordenar por fecha descendente
            const movimientosUnificados = [
                ...inv.movimientos.map((m: any) => ({
                    tipo: "Inventario",
                    fecha: m.fecha,
                    descripcion: `${m.tipo_movimiento} - ${m.producto_nombre}`,
                    usuario: m.usuario_nombre,
                    detalle: m,
                })),
                ...pedidos.map((p: any) => ({
                    tipo: "Pedido",
                    fecha: p.fecha_entrega,
                    descripcion: p.descripcion,
                    usuario: p.usuario_nombre,
                    detalle: p,
                }))
            ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
            setMovimientos(movimientosUnificados);
        } catch (e) {
            setMovimientos([]);
        } finally {
            setLoadingMov(false);
        }
    }, []);
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
                pedido && <PedidoHistorial setPedido={() => setPedido(false)} />
            }
                </div>

            </section>
            {/* Tabla de movimientos recientes */}
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: 6, mb: 4 }}>
                <Box sx={{ width: '100%', maxWidth: 1100, px: { xs: 1, sm: 3, md: 6 }, py: 3, bgcolor: '#232323', borderRadius: 4, boxShadow: '0 4px 24px 0 rgba(0,0,0,0.18)' }}>
                    <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 700, mb: 2, textAlign: 'center' }}>
                        Movimientos recientes de inventario y pedidos
                    </Typography>
                    <TableContainer component={Paper} sx={{ bgcolor: '#232323', borderRadius: 3, boxShadow: '0 2px 12px 0 rgba(0,0,0,0.10)' }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#232323' }}>
                                    <TableCell sx={{ color: '#FFD700', fontWeight: 700, fontSize: 16 }}>Tipo</TableCell>
                                    <TableCell sx={{ color: '#FFD700', fontWeight: 700, fontSize: 16 }}>Fecha</TableCell>
                                    <TableCell sx={{ color: '#FFD700', fontWeight: 700, fontSize: 16 }}>Descripción</TableCell>
                                    <TableCell sx={{ color: '#FFD700', fontWeight: 700, fontSize: 16 }}>Usuario</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loadingMov ? (
                                    <TableRow><TableCell colSpan={4} sx={{ color: '#FFD700', textAlign: 'center', py: 4 }}>Cargando...</TableCell></TableRow>
                                ) : movimientos.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} sx={{ color: '#FFD700', textAlign: 'center', py: 4 }}>No hay movimientos recientes</TableCell></TableRow>
                                ) : movimientos.map((mov, idx) => (
                                    <TableRow key={idx} sx={{ borderBottom: '1px solid #333', '&:last-child td': { borderBottom: 0 }, '&:hover': { bgcolor: '#292929' } }}>
                                        <TableCell sx={{ color: mov.tipo === 'Inventario' ? '#4CAF50' : '#2196F3', fontWeight: 700 }}>{mov.tipo}</TableCell>
                                        <TableCell sx={{ color: '#fff' }}>{mov.fecha ? new Date(mov.fecha).toLocaleString() : '—'}</TableCell>
                                        <TableCell sx={{ color: '#fff' }}>{mov.descripcion}</TableCell>
                                        <TableCell sx={{ color: '#fff' }}>{mov.usuario}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Box>
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