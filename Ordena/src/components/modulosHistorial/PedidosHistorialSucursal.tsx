import React, { useEffect, useState, useMemo } from "react";
import styled from "styled-components";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    TextField, Button, Box, Typography, IconButton, Tooltip, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, Chip, MenuItem
} from "@mui/material";
import { 
    FilterAlt as FilterIcon, 
    TrendingUp as TrendingUpIcon, 
    Search as SearchIcon, 
    Refresh as RefreshIcon, 
    FileDownload as ExportIcon,
    PictureAsPdf as PdfIcon,
    TableChart as ExcelIcon
} from "@mui/icons-material";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useHistorialStore } from "../../store/useHistorialStore";
import { useAuthStore } from "../../store/useAuthStore";
import { PedidoDetalle } from "./DetallePedido";

interface Props {
    setPedido: () => void;
}

const EstadisticasCard = styled.div`
  background: #2E2E2E;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #444;
`;

const ToolbarContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #2E2E2E;
  border-radius: 8px;
  border: 1px solid #444;
`;

const FiltrosCard = styled.div`
  background: #2E2E2E;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #444;
`;

// Función helper para formatear fecha y hora
function formatearFechaHora(fechaString: string | null | undefined): string {
    if (!fechaString) return '—';
    
    try {
        const fecha = new Date(fechaString);
        if (isNaN(fecha.getTime())) return '—';
        
        // Formato: DD/MM/YYYY HH:MM
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const año = fecha.getFullYear();
        const hora = fecha.getHours().toString().padStart(2, '0');
        const minutos = fecha.getMinutes().toString().padStart(2, '0');
        
        return `${dia}/${mes}/${año} ${hora}:${minutos}`;
    } catch (error) {
        return '—';
    }
}

export function PedidosHistorialSucursal({ setPedido }: Props) {
    const usuario = useAuthStore((state: any) => state.usuario);
    const [busqueda, setBusqueda] = useState("");
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<any>(null);
    const { pedidos, fetchPedidos, loading: loadingHistorial, error } = useHistorialStore();
    const [sucursalSeleccionada, setSucursalSeleccionada] = useState("");
    const [usuarioSeleccionada, setUsuarioSeleccionada] = useState("");
    const [showFiltros, setShowFiltros] = useState(false);
    const [showEstadisticas, setShowEstadisticas] = useState(true);
    const [showDetalle, setShowDetalle] = useState(false);

    useEffect(() => {
        const params: any = {};
        if (usuario?.sucursal) {
            params.sucursal_id = usuario.sucursal;
        }
        fetchPedidos(params);
    }, [fetchPedidos, usuario]);

    // Filtrado: mostrar todos los pedidos que van a la sucursal del usuario
    const pedidosArray = Array.isArray(pedidos) ? pedidos : [];
    console.log('PEDIDOS COMPLETOS:', pedidosArray);
    console.log('USUARIO SUCURSAL:', usuario.sucursal);
    
    // Debug: ver la estructura del primer pedido
    if (pedidosArray.length > 0) {
        console.log('ESTRUCTURA DEL PRIMER PEDIDO:', pedidosArray[0]);
        console.log('SUCURSAL_FK DEL PRIMER PEDIDO:', pedidosArray[0].sucursal_fk);
    }
    
    // Filtrar por sucursal - probar diferentes estructuras
    const pedidosOrdenados = [...pedidosArray]
        .filter(p => {
            // Probar si sucursal_fk es un número directo
            const sucursalId = typeof p.sucursal_fk === 'number' ? p.sucursal_fk : p.sucursal_fk?.id;
            const coincideSucursal = sucursalId && sucursalId.toString() === usuario.sucursal;
            console.log('Pedido:', p.id_p, 'sucursal_fk:', p.sucursal_fk, 'sucursalId:', sucursalId, 'coincideSucursal:', coincideSucursal);
            return coincideSucursal;
        })
        .sort((a, b) => new Date(b.fecha_entrega).getTime() - new Date(a.fecha_entrega).getTime());
    
    console.log('PEDIDOS FILTRADOS:', pedidosOrdenados);

    // Funciones de exportación mejoradas
    const exportarExcel = () => {
        const datosExportar = pedidosFiltros.map((pedido: any) => ({
            'ID': pedido.id_p,
            'Fecha': formatearFechaHora(pedido.fecha_entrega),
            'Sucursal': pedido.sucursal_nombre || '—',
            'Usuario': pedido.usuario_nombre || '—',
            'Estado': pedido.estado_pedido_nombre || '—',
            'Cantidad Productos': Array.isArray(pedido.detalles_pedido) ? pedido.detalles_pedido.reduce((acc: number, d: any) => acc + Number(d.cantidad), 0) : 0,
            'Descripción': pedido.descripcion || '—'
        }));

        const ws = XLSX.utils.json_to_sheet(datosExportar);
        
        // Estilos mejorados para Excel
        ws['!cols'] = [
            { width: 8 },  // ID
            { width: 12 }, // Fecha
            { width: 20 }, // Sucursal
            { width: 15 }, // Usuario
            { width: 12 }, // Estado
            { width: 15 }, // Cantidad
            { width: 30 }  // Descripción
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Historial Pedidos Sucursal');
        XLSX.writeFile(wb, `historial_pedidos_sucursal_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportarPDF = () => {
        const doc = new jsPDF();
        
        // Título principal
        doc.setFontSize(20);
        doc.setTextColor(0, 0, 0);
        doc.text('Historial de Pedidos', 20, 20);
        
        // Subtítulo
        doc.setFontSize(14);
        doc.setTextColor(100, 100, 100);
        doc.text('Sucursal - Ingresos', 20, 30);
        
        // Información de exportación
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text(`Exportado el: ${new Date().toLocaleDateString('es-CL', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`, 20, 40);
        
        // Estadísticas
        doc.setTextColor(0, 0, 0);
        doc.text(`Total de registros: ${pedidosFiltros.length}`, 20, 50);
        
        let currentY = 60;
        
        // Tabla principal de pedidos
        const datosTabla = pedidosFiltros.map((pedido: any) => [
            pedido.id_p,
            formatearFechaHora(pedido.fecha_entrega),
            pedido.sucursal_nombre || '—',
            pedido.usuario_nombre || '—',
            pedido.estado_pedido_nombre || '—',
            Array.isArray(pedido.detalles_pedido) ? pedido.detalles_pedido.reduce((acc: number, d: any) => acc + Number(d.cantidad), 0) : 0
        ]);

        autoTable(doc, {
            head: [['ID', 'Fecha', 'Sucursal', 'Usuario', 'Estado', 'Cantidad']],
            body: datosTabla,
            startY: currentY,
            styles: {
                headStyle: { 
                    fillColor: [70, 130, 180], 
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 11
                },
                bodyStyle: { 
                    textColor: [0, 0, 0],
                    fontSize: 10
                }
            },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { top: 10, right: 10, bottom: 10, left: 10 },
            tableWidth: 'auto',
            columnStyles: {
                0: { cellWidth: 15 },
                1: { cellWidth: 25 },
                2: { cellWidth: 40 },
                3: { cellWidth: 30 },
                4: { cellWidth: 25 },
                5: { cellWidth: 20 }
            }
        });
        
        // Obtener la posición Y después de la tabla principal
        currentY = (doc as any).lastAutoTable.finalY + 20;
        
        // SECCIÓN DE PRODUCTOS DETALLADOS
        doc.setFontSize(16);
        doc.setTextColor(0, 100, 0);
        doc.text('DETALLE DE PRODUCTOS POR PEDIDO', 20, currentY);
        currentY += 15;
        
        // Iterar por cada pedido para mostrar sus productos
        pedidosFiltros.forEach((pedido: any, index: number) => {
            if (Array.isArray(pedido.detalles_pedido) && pedido.detalles_pedido.length > 0) {
                // Título del pedido
                doc.setFontSize(12);
                doc.setTextColor(0, 0, 0);
                doc.text(`Pedido ID: ${pedido.id_p} - ${formatearFechaHora(pedido.fecha_entrega)}`, 20, currentY);
                currentY += 10;
                
                // Tabla de productos del pedido
                const productosPedido = pedido.detalles_pedido.map((detalle: any) => [
                    detalle.producto_nombre || '—',
                    detalle.cantidad || 0
                ]);
                
                autoTable(doc, {
                    head: [['Producto', 'Cantidad']],
                    body: productosPedido,
                    startY: currentY,
                    styles: {
                        headStyle: { 
                            fillColor: [0, 100, 0], 
                            textColor: [255, 255, 255],
                            fontStyle: 'bold',
                            fontSize: 10
                        },
                        bodyStyle: { 
                            textColor: [0, 0, 0],
                            fontSize: 9
                        }
                    },
                    alternateRowStyles: { fillColor: [240, 255, 240] },
                    margin: { top: 5, right: 10, bottom: 5, left: 10 },
                    tableWidth: 'auto',
                    columnStyles: {
                        0: { cellWidth: 100 },
                        1: { cellWidth: 30 }
                    }
                });
                
                // Obtener la posición Y después de la tabla de productos
                currentY = (doc as any).lastAutoTable.finalY + 10;
                
                // Agregar espacio entre pedidos
                if (index < pedidosFiltros.length - 1) {
                    currentY += 5;
                }
            }
        });

        doc.save(`historial_pedidos_sucursal_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const sucursalesBusqueda = useMemo(() => {
        const nombres = pedidosOrdenados.map(p => p.sucursal_nombre).filter((x): x is string => !!x);
        return [...new Set(nombres)];
    }, [pedidosOrdenados]);
    const usuariosBusqueda = useMemo(() => {
        const nombresUs = pedidosOrdenados.map(p => p.usuario_nombre).filter((x): x is string => !!x);
        return [...new Set(nombresUs)];
    }, [pedidosOrdenados]);

    const pedidosFiltros = useMemo(() => {
        return pedidosOrdenados.filter(pedido => {
            const filtroSucursal = sucursalSeleccionada ? pedido.sucursal_nombre === sucursalSeleccionada : true;
            const filtroUsuario = usuarioSeleccionada ? pedido.usuario_nombre === usuarioSeleccionada : true;
            const busquedaLower = busqueda.toLowerCase();
            const filtroBusqueda = busquedaLower === "" ? true : (
                (pedido.sucursal_nombre || "").toLowerCase().includes(busquedaLower) ||
                (pedido.fecha_entrega || "").toLowerCase().includes(busquedaLower) ||
                (pedido.usuario_nombre || "").toLowerCase().includes(busquedaLower) ||
                (pedido.proveedor_nombre || "").toLowerCase().includes(busquedaLower)
            );
            return filtroSucursal && filtroBusqueda && filtroUsuario;
        });
    }, [sucursalSeleccionada, pedidosOrdenados, busqueda, usuarioSeleccionada]);

    return (
        <Dialog
            open={true}
            onClose={setPedido}
            maxWidth="xl"
            fullWidth
            PaperProps={{
                sx: {
                    background: '#1E1E1E',
                    borderRadius: 3,
                    minHeight: '80vh',
                    maxHeight: '95vh',
                    boxShadow: 24,
                    p: 0,
                    overflow: 'hidden',
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#232323', color: '#FFD700', fontWeight: 700, fontSize: 24 }}>
                📦 Historial de Pedidos (Sucursal)
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button onClick={setPedido} variant="outlined" sx={{ color: "#FFD700", borderColor: "#FFD700" }}>
                        🠔 Volver
                    </Button>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 0, bgcolor: '#1E1E1E', overflow: 'auto' }}>
                <Box sx={{ p: 3 }}>
                    {/* Estadísticas */}
                    {showEstadisticas && (
                        <EstadisticasCard>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', alignItems: 'center' }}>
                                <Box sx={{ flex: '1 1 250px', minWidth: 200 }}>
                                    <StatCard color="#FFD700" icon="📦" title="Total Pedidos" valor={pedidosFiltros.length} subtitulo="" />
                                </Box>
                                <Box sx={{ flex: '1 1 150px', minWidth: 150 }}>
                                    <StatCard color="#4CAF50" icon="✅" title="Entregados" valor={pedidosFiltros.filter(p => typeof p.estado_pedido_fk === 'object' && p.estado_pedido_fk !== null && 'nombre' in p.estado_pedido_fk && (p.estado_pedido_fk.nombre === 'Entregado' || p.estado_pedido_fk.nombre === 'Completado')).length} subtitulo="" />
                                </Box>
                                <Box sx={{ flex: '1 1 150px', minWidth: 150 }}>
                                    <StatCard color="#FF9800" icon="⏳" title="Pendientes" valor={pedidosFiltros.filter(p => typeof p.estado_pedido_fk === 'object' && p.estado_pedido_fk !== null && 'nombre' in p.estado_pedido_fk && p.estado_pedido_fk.nombre === 'Pendiente').length} subtitulo="" />
                                </Box>
                            </Box>
                        </EstadisticasCard>
                    )}

                    {/* Barra de herramientas */}
                    <ToolbarContainer>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
                            <TextField
                                placeholder="Buscar por sucursal, usuario, transportista..."
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                                size="small"
                                sx={{ minWidth: 300 }}
                                InputProps={{
                                    startAdornment: <SearchIcon sx={{ color: '#666', mr: 1 }} />
                                }}
                            />
                            <Button
                                variant="outlined"
                                startIcon={<FilterIcon />}
                                onClick={() => setShowFiltros(!showFiltros)}
                                sx={{ color: "#FFD700", borderColor: "#FFD700" }}
                            >
                                Filtros
                            </Button>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Mostrar/Ocultar Estadísticas">
                                <IconButton onClick={() => setShowEstadisticas(!showEstadisticas)} sx={{ color: "#FFD700" }}>
                                    <TrendingUpIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Exportar a Excel">
                                <Button 
                                    onClick={exportarExcel} 
                                    variant="contained" 
                                    startIcon={<ExcelIcon />}
                                    size="small"
                                    sx={{ 
                                        bgcolor: '#4CAF50', 
                                        color: '#fff',
                                        '&:hover': { bgcolor: '#45a049' },
                                        fontWeight: 600,
                                        minWidth: 'auto',
                                        px: 2
                                    }}
                                >
                                    Excel
                                </Button>
                            </Tooltip>
                            <Tooltip title="Exportar a PDF">
                                <Button 
                                    onClick={exportarPDF} 
                                    variant="contained" 
                                    startIcon={<PdfIcon />}
                                    size="small"
                                    sx={{ 
                                        bgcolor: '#F44336', 
                                        color: '#fff',
                                        '&:hover': { bgcolor: '#d32f2f' },
                                        fontWeight: 600,
                                        minWidth: 'auto',
                                        px: 2
                                    }}
                                >
                                    PDF
                                </Button>
                            </Tooltip>
                        </Box>
                    </ToolbarContainer>

                    {/* Filtros avanzados */}
                    {showFiltros && (
                        <FiltrosCard>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                                    <TextField
                                        select
                                        label="Sucursal"
                                        value={sucursalSeleccionada}
                                        onChange={(e) => setSucursalSeleccionada(e.target.value)}
                                        size="small"
                                        fullWidth
                                    >
                                        <MenuItem value=""><em>Todas</em></MenuItem>
                                        {sucursalesBusqueda.map((sucursal: string) => (
                                            <MenuItem key={sucursal} value={sucursal}>{sucursal}</MenuItem>
                                        ))}
                                    </TextField>
                                </Box>
                                <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                                    <TextField
                                        select
                                        label="Usuario"
                                        value={usuarioSeleccionada}
                                        onChange={(e) => setUsuarioSeleccionada(e.target.value)}
                                        size="small"
                                        fullWidth
                                    >
                                        <MenuItem value=""><em>Todos</em></MenuItem>
                                        {usuariosBusqueda.map((usuario: string) => (
                                            <MenuItem key={usuario} value={usuario}>{usuario}</MenuItem>
                                        ))}
                                    </TextField>
                                </Box>
                            </Box>
                        </FiltrosCard>
                    )}

                    {/* Tab de ingresos */}
                    <Box sx={{ mb: 3, color: '#FFD700', fontWeight: 700, fontSize: 18 }}>Ingresos</Box>

                    {/* Tabla de pedidos */}
                    <TableContainer component={Paper} sx={{ bgcolor: '#232323', borderRadius: 2, maxHeight: '50vh' }}>
                        <Table stickyHeader>
                            <TableHead sx={{ bgcolor: '#232323' }}>
                                <TableRow>
                                    <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#232323' }}>ID</TableCell>
                                    <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#232323' }}>Fecha</TableCell>
                                    <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#232323' }}>Sucursal</TableCell>
                                    <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#232323' }}>Usuario</TableCell>
                                    <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#232323' }}>Estado</TableCell>
                                    <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#232323' }}>Cantidad Productos</TableCell>
                                    <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#232323' }}>Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loadingHistorial ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">
                                            <CircularProgress />
                                        </TableCell>
                                    </TableRow>
                                ) : pedidosFiltros.map((pedido: any, idx: number) => {
                                    const cantidadProductos = Array.isArray(pedido.detalles_pedido) ? pedido.detalles_pedido.reduce((acc: number, d: any) => acc + Number(d.cantidad), 0) : 0;
                                    return (
                                        <TableRow key={pedido.id_p || idx} hover>
                                            <TableCell sx={{ color: '#fff' }}>{pedido.id_p}</TableCell>
                                            <TableCell sx={{ color: '#fff' }}>{formatearFechaHora(pedido.fecha_entrega)}</TableCell>
                                            <TableCell sx={{ color: '#fff' }}>{pedido.sucursal_nombre || '—'}</TableCell>
                                            <TableCell sx={{ color: '#fff' }}>{pedido.usuario_nombre || '—'}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={pedido.estado_pedido_nombre || '—'}
                                                    sx={{
                                                        bgcolor:
                                                            pedido.estado_pedido_nombre === 'Completado'
                                                                ? '#4CAF50'
                                                                : pedido.estado_pedido_nombre === 'En camino'
                                                                ? '#2196F3'
                                                                : pedido.estado_pedido_nombre === 'Pendiente'
                                                                ? '#FF9800'
                                                                : '#FFD700',
                                                        color: '#232323',
                                                        fontWeight: 700,
                                                        minWidth: 100,
                                                        justifyContent: 'center'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ color: '#FFD700', fontWeight: 700 }}>{cantidadProductos || '—'}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{ color: "#FFD700", borderColor: "#FFD700" }}
                                                    onClick={() => {
                                                        setPedidoSeleccionado(pedido);
                                                        setShowDetalle(true);
                                                    }}
                                                >
                                                    Ver Detalle
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Modal de detalle de pedido con timeline */}
                    <Dialog
                        open={showDetalle && !!pedidoSeleccionado}
                        onClose={() => setShowDetalle(false)}
                        maxWidth="md"
                        fullWidth
                        PaperProps={{ sx: { borderRadius: 3, bgcolor: '#181818' } }}
                    >
                        {pedidoSeleccionado && (
                            <PedidoDetalle id={pedidoSeleccionado.id_p} setDetalle={() => setShowDetalle(false)} />
                        )}
                    </Dialog>

                    {/* Mensaje si no hay pedidos */}
                    {!loadingHistorial && pedidosFiltros.length === 0 && (
                        <Box sx={{ textAlign: 'center', p: 4, color: '#666' }}>
                            <Typography variant="h6">No se encontraron pedidos</Typography>
                            <Typography variant="body2">Intenta ajustar los filtros o recargar los datos</Typography>
                        </Box>
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    );
}

// Componente para tarjetas de estadísticas
function StatCard({ color, icon, title, valor, subtitulo }: {
    color: string; icon: string; title: string; valor: number; subtitulo: string;
}) {
    return (
        <Paper sx={{ bgcolor: '#232323', border: `2px solid ${color}`, borderRadius: 2, p: 2, minWidth: 160, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ color, mb: 1 }}>{icon}</Typography>
            <Typography variant="h4" sx={{ color: "#fff", fontWeight: 700, mb: 1 }}>
                {valor}
            </Typography>
            <Typography variant="h6" sx={{ color: "#FFD700", mb: 1 }}>
                {title}
            </Typography>
            <Typography variant="body2" sx={{ color: "#ccc" }}>
                {subtitulo}
            </Typography>
        </Paper>
    );
} 