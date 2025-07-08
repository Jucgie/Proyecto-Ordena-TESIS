import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Box, Typography, Chip, CircularProgress, Divider, Card, CardContent, IconButton } from '@mui/material';
import { 
    Close as CloseIcon,
    LocalShipping as ShippingIcon,
    Store as StoreIcon,
    Person as PersonIcon,
    Schedule as ScheduleIcon,
    Description as DescriptionIcon,
    CheckCircle as CheckCircleIcon,
    Pending as PendingIcon,
    LocalShippingOutlined as InTransitIcon,
    Inventory as InventoryIcon,
    Timeline as TimelineIcon
} from '@mui/icons-material';
import { formatFechaChile } from '../../utils/formatFechaChile';
import { pedidosService } from "../../services/pedidosService";
import { useHistorialStore } from "../../store/useHistorialStore";

interface Props {
    setDetalle: () => void;
    id: number;
}

export function PedidoDetalle({ id, setDetalle }: Props) {
    const pedidos = useHistorialStore(state => state.pedidos);
    const pedido = pedidos.find((p) => p.id_p === id);
    const [historialEstados, setHistorialEstados] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        pedidosService.getHistorialEstados(id)
            .then(historialData => {
                let historial = Array.isArray(historialData) ? historialData : [];
                
                // Agregar evento inicial 'Pendiente' si no existe
                if (pedido) {
                    const yaTienePendiente = historial.some(h => h.estado_nuevo_nombre === 'Pendiente');
                    if (!yaTienePendiente) {
                        // Usar la fecha del pedido como fecha inicial del estado Pendiente
                        const fechaInicial = pedido.fecha_entrega;
                        historial = [
                            {
                                id_hist_ped: 'fake-pendiente',
                                pedido_fk: pedido.id_p,
                                estado_nuevo: 3, // ID de Pendiente
                                estado_nuevo_nombre: 'Pendiente',
                                usuario_nombre: pedido.usuario_nombre || pedido.solicitud_fk?.usuario_nombre || '—',
                                fecha: fechaInicial,
                                comentario: 'Registro inicial automático'
                            },
                            ...historial
                        ];
                    }
                }
                
                // Ordenar cronológicamente: Pendiente abajo (más antiguo), Completado arriba (más reciente)
                historial = historial.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
                
                setHistorialEstados(historial);
            })
            .catch(() => setError("Error al cargar el historial de estados"))
            .finally(() => setLoading(false));
    }, [id, pedido]);

    if (loading) return <Container><CircularProgress sx={{ color: '#FFD700' }} /></Container>;
    if (error) return <Container><Typography sx={{ color: 'red' }}>{error}</Typography></Container>;
    if (!pedido) return <Container><Typography sx={{ color: '#fff' }}>No se encontró el pedido.</Typography></Container>;

    // Productos del pedido
    const productos = pedido.detalles_pedido || pedido.solicitud_fk?.productos || [];
    // Formato de fecha
    let fecha = null;
    if (pedido.fecha_entrega) {
        try {
            const fechaObj = new Date(pedido.fecha_entrega);
            fecha = {
                fecha: fechaObj.toLocaleDateString(),
                hora: fechaObj.toLocaleTimeString()
            };
        } catch {
            fecha = { fecha: pedido.fecha_entrega, hora: '' };
        }
    }

    // --- AJUSTE: Ordenar timeline de salida por flujo lógico ---
    let historialFiltrado = historialEstados;
    if (pedido && (pedido.proveedor_nombre || pedido.proveedor_fk)) {
        // Si es ingreso de proveedor, solo mostrar 'Completado' si existe
        const completado = historialEstados.find(h => h.estado_nuevo_nombre === 'Completado');
        historialFiltrado = completado ? [completado] : [];
    } else {
        // Para salidas, ordenar por flujo lógico y luego por fecha, y mostrar de abajo hacia arriba
        const ordenFlujo = ['Pendiente', 'En camino', 'Completado'];
        historialFiltrado = [...historialEstados].sort((a, b) => {
            const idxA = ordenFlujo.indexOf(a.estado_nuevo_nombre);
            const idxB = ordenFlujo.indexOf(b.estado_nuevo_nombre);
            if (idxA !== idxB) return idxA - idxB;
            // Si tienen el mismo estado, ordenar por fecha ascendente
            return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
        }).reverse(); // Invertir para que Pendiente quede abajo y Completado arriba
    }

    return (
        <Container>
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 3,
                pb: 2,
                borderBottom: '2px solid #FFD700'
            }}>
                <Typography variant="h4" sx={{ 
                    color: '#FFD700', 
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}>
                    <InventoryIcon sx={{ fontSize: 32 }} />
                    Pedido #{pedido.id_p}
                </Typography>
                <IconButton 
                    onClick={setDetalle}
                    sx={{
                        color: '#FFD700',
                        '&:hover': { 
                            bgcolor: 'rgba(255, 215, 0, 0.1)',
                            transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </Box>

            <Box className="contenido" sx={{ width: '100%' }}>
                {/* Información General */}
                <Card sx={{ 
                    mb: 3, 
                    bgcolor: '#2A2A2A', 
                    border: '1px solid #FFD700',
                    boxShadow: '0 4px 20px rgba(255, 215, 0, 0.1)'
                }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ 
                            color: '#FFD700', 
                            fontWeight: 700, 
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                            <DescriptionIcon />
                            Información General
                        </Typography>
                        <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                            gap: 3
                        }}>
                            {/* FECHA */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ScheduleIcon sx={{ color: '#FFD700', fontSize: 20 }} />
                                <Box>
                                    <Typography sx={{ color: '#FFD700', fontSize: 12, fontWeight: 600 }}>FECHA</Typography>
                                    <Typography sx={{ color: '#fff', fontSize: 14 }}>{fecha ? fecha.fecha + ' ' + fecha.hora : '—'}</Typography>
                                </Box>
                            </Box>
                            {/* PROVEEDOR (solo para ingresos de proveedor) */}
                            {pedido && (pedido.proveedor_nombre || pedido.proveedor_fk) && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PersonIcon sx={{ color: '#FFD700', fontSize: 20 }} />
                                    <Box>
                                        <Typography sx={{ color: '#FFD700', fontSize: 12, fontWeight: 600 }}>PROVEEDOR</Typography>
                                        <Typography sx={{ color: '#fff', fontSize: 14 }}>{
                                            pedido.proveedor_nombre ||
                                            (typeof pedido.proveedor_fk === 'object' && pedido.proveedor_fk && (pedido.proveedor_fk as any).nombre) ||
                                            '—'
                                        }</Typography>
                                    </Box>
                                </Box>
                            )}
                            {/* USUARIO */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PersonIcon sx={{ color: '#FFD700', fontSize: 20 }} />
                                <Box>
                                    <Typography sx={{ color: '#FFD700', fontSize: 12, fontWeight: 600 }}>USUARIO</Typography>
                                    <Typography sx={{ color: '#fff', fontSize: 14 }}>{pedido.usuario_nombre || pedido.solicitud_fk?.usuario_nombre || '—'}</Typography>
                                </Box>
                            </Box>
                            {/* ESTADO */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CheckCircleIcon sx={{ color: '#FFD700', fontSize: 20 }} />
                                <Box>
                                    <Typography sx={{ color: '#FFD700', fontSize: 12, fontWeight: 600 }}>ESTADO</Typography>
                                    <Chip 
                                        label={pedido && (pedido.proveedor_nombre || pedido.proveedor_fk) ? 'Completado' : (typeof pedido.estado_pedido_fk === 'object' && pedido.estado_pedido_fk && (pedido.estado_pedido_fk as any).nombre ? (pedido.estado_pedido_fk as any).nombre : pedido.estado_pedido_nombre || pedido.estado_pedido_fk || '—')} 
                                        sx={{ 
                                            bgcolor: '#FFD700', 
                                            color: '#232323', 
                                            fontWeight: 700,
                                            fontSize: 12,
                                            height: 24
                                        }} 
                                    />
                                </Box>
                            </Box>
                            {/* DESCRIPCIÓN */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <DescriptionIcon sx={{ color: '#FFD700', fontSize: 20 }} />
                                <Box>
                                    <Typography sx={{ color: '#FFD700', fontSize: 12, fontWeight: 600 }}>DESCRIPCIÓN</Typography>
                                    <Typography sx={{ color: '#fff', fontSize: 14 }}>{pedido.descripcion || '—'}</Typography>
                                </Box>
                            </Box>
                            {/* SOLO mostrar Sucursal destino y Transportista si NO es ingreso de proveedor */}
                            {!(pedido && (pedido.proveedor_nombre || pedido.proveedor_fk)) && (
                                <>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <StoreIcon sx={{ color: '#FFD700', fontSize: 20 }} />
                                        <Box>
                                            <Typography sx={{ color: '#FFD700', fontSize: 12, fontWeight: 600 }}>SUCURSAL DESTINO</Typography>
                                            <Typography sx={{ color: '#fff', fontSize: 14 }}>{pedido.sucursal_fk?.nombre_sucursal || pedido.sucursal_nombre || '—'}</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ShippingIcon sx={{ color: '#FFD700', fontSize: 20 }} />
                                        <Box>
                                            <Typography sx={{ color: '#FFD700', fontSize: 12, fontWeight: 600 }}>TRANSPORTISTA</Typography>
                                            <Typography sx={{ color: '#fff', fontSize: 14 }}>{pedido.personal_entrega_nombre || '—'}</Typography>
                                        </Box>
                                    </Box>
                                </>
                            )}
                        </Box>
                    </CardContent>
                </Card>

                {/* Productos del Pedido */}
                <Card sx={{ 
                    mb: 3, 
                    bgcolor: '#2A2A2A', 
                    border: '1px solid #FFD700',
                    boxShadow: '0 4px 20px rgba(255, 215, 0, 0.1)'
                }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ 
                            color: '#FFD700', 
                            fontWeight: 700, 
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                            <InventoryIcon />
                            Productos del Pedido
                        </Typography>
                        <TableContainer component={Paper}
                            sx={{
                                maxHeight: 300, 
                                width: "100%", 
                                background: "#1E1E1E",
                                border: '1px solid #333',
                                borderRadius: 2,
                                '& .MuiTableCell-root': { 
                                    color: 'white', 
                                    textAlign: 'center',
                                    borderColor: '#333'
                                },
                    }}
                >
                    <Table sx={{ minWidth: 250 }} aria-label="tabla productos" stickyHeader>
                                <TableHead sx={{ bgcolor: '#1E1E1E' }}>
                            <TableRow>
                                        <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#1E1E1E', borderColor: '#333' }}>Producto</TableCell>
                                        <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#1E1E1E', borderColor: '#333' }}>Código</TableCell>
                                        <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#1E1E1E', borderColor: '#333' }} align="right">Cantidad</TableCell>
                            </TableRow>
                        </TableHead>
                                <TableBody sx={{ background: "#1E1E1E" }}>
                                    {productos.map((p: any, idx: number) => (
                                        <TableRow key={p.id_solc_prod || p.id || idx} sx={{ '&:hover': { bgcolor: '#2A2A2A' } }}>
                                            <TableCell sx={{ borderColor: '#333' }}>{p.producto_nombre || p.nombre || '—'}</TableCell>
                                            <TableCell sx={{ borderColor: '#333' }}>{p.producto_codigo || p.codigo || '—'}</TableCell>
                                            <TableCell align="right" sx={{ borderColor: '#333' }}>{Number(p.cantidad)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                    </CardContent>
                </Card>

                {/* Timeline de Estados */}
                <Card sx={{ 
                    bgcolor: '#2A2A2A', 
                    border: '1px solid #FFD700',
                    boxShadow: '0 4px 20px rgba(255, 215, 0, 0.1)'
                }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ 
                            color: '#FFD700', 
                            fontWeight: 700, 
                            mb: 3,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                            <TimelineIcon />
                            Timeline de Cambios de Estado
                </Typography>
                        <Box sx={{ bgcolor: '#1E1E1E', borderRadius: 2, p: 3 }}>
                            {historialFiltrado.length === 0 ? (
                                <Typography sx={{ color: '#fff', textAlign: 'center', py: 4 }}>No hay historial de estados.</Typography>
                            ) : (
                                <Box sx={{ position: 'relative', pl: 4, borderLeft: '3px solid #FFD700', minHeight: 60 }}>
                                    {historialFiltrado.map((h: any, idx: number) => {
                                        const getStateIcon = (state: string) => {
                                            switch(state) {
                                                case 'Completado': return <CheckCircleIcon sx={{ color: '#4CAF50' }} />;
                                                case 'En camino': return <InTransitIcon sx={{ color: '#2196F3' }} />;
                                                case 'Pendiente': return <PendingIcon sx={{ color: '#FF9800' }} />;
                                                default: return <CheckCircleIcon sx={{ color: '#FFD700' }} />;
                                            }
                                        };
                                        
                                        const getStateColor = (state: string) => {
                                            switch(state) {
                                                case 'Completado': return '#4CAF50';
                                                case 'En camino': return '#2196F3';
                                                case 'Pendiente': return '#FF9800';
                                                default: return '#FFD700';
                                            }
                                        };

                                        return (
                                            <Box key={h.id_hist_ped || idx} sx={{ mb: 4, position: 'relative' }}>
                                                {/* Punto del timeline */}
                                                <Box sx={{
                                                    position: 'absolute',
                                                    left: -22,
                                                    top: 8,
                                                    width: 20,
                                                    height: 20,
                                                    bgcolor: getStateColor(h.estado_nuevo_nombre),
                                                    borderRadius: '50%',
                                                    border: '3px solid #FFD700',
                                                    zIndex: 2,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    {getStateIcon(h.estado_nuevo_nombre)}
                                                </Box>
                                                
                                                <Box sx={{ 
                                                    bgcolor: '#2A2A2A', 
                                                    borderRadius: 2, 
                                                    p: 2,
                                                    border: `1px solid ${getStateColor(h.estado_nuevo_nombre)}`,
                                                    boxShadow: `0 2px 8px rgba(0,0,0,0.3)`
                                                }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                                                        <Chip
                                                            label={h.estado_nuevo_nombre || h.estado_nuevo || '—'}
                                                            sx={{
                                                                bgcolor: getStateColor(h.estado_nuevo_nombre),
                                                                color: '#fff',
                                                                fontWeight: 700,
                                                                minWidth: 120,
                                                                fontSize: 12
                                                            }}
                                                        />
                                                        <Typography sx={{ color: '#FFD700', fontWeight: 600, fontSize: 14 }}>
                                                            {h.fecha ? new Date(h.fecha).toLocaleString('es-CL', { 
                                                                day: '2-digit', 
                                                                month: '2-digit', 
                                                                year: 'numeric', 
                                                                hour: '2-digit', 
                                                                minute: '2-digit' 
                                                            }) : '—'}
                                                        </Typography>
                                                    </Box>
                                                    
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                        <PersonIcon sx={{ color: '#FFD700', fontSize: 16 }} />
                                                        <Typography sx={{ color: '#fff', fontWeight: 500, fontSize: 14 }}>
                                                {h.usuario_nombre || h.usuario_fk || '—'}
                                            </Typography>
                                                    </Box>
                                                    
                                            {h.comentario && (
                                                        <Typography sx={{ 
                                                            color: '#FFD700', 
                                                            fontSize: 13, 
                                                            fontStyle: 'italic',
                                                            bgcolor: 'rgba(255, 215, 0, 0.1)',
                                                            p: 1,
                                                            borderRadius: 1,
                                                            border: '1px solid rgba(255, 215, 0, 0.3)'
                                                        }}>
                                                    "{h.comentario}"
                                                </Typography>
                                            )}
                                        </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                        )}
                    </Box>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
}

const Container = styled.div`
  position: fixed;
  height: 90vh;
  width: 50vw;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-radius: 8px;
  background: #1E1E1E;
  box-shadow: 0px 0px 40px rgba(36, 36, 36, 0.7);
  padding: 24px 32px 24px 32px;
  z-index: 100;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  justify-content: flex-start;
  overflow-y: auto;

  .cerr {
    margin-bottom: 10px;
    font-size: 22px;
    width: 100%;
    color: white;
    font-weight: bold;
    display: flex;
    justify-content: flex-end;
    cursor: pointer;
  }
  .contenido {
    width: 100%;
  }
  @media (max-width: 900px) {
    width: 95vw;
    padding: 10px 4px 12px 4px;
  }
`