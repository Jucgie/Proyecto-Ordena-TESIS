import React, { useEffect, useState, useMemo } from "react";
import styled from "styled-components";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Select, MenuItem, TextField, Button, Box, Typography, Grid, IconButton, Tooltip, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, Tabs, Tab
} from "@mui/material";
import {
    FilterAlt as FilterIcon,
    TrendingUp as TrendingUpIcon,
    Refresh as RefreshIcon,
    FileDownload as ExportIcon,
    Search as SearchIcon
} from "@mui/icons-material";
import { BtnAct } from "../button/ButtonHist";
import ordena from "../../assets/ordena.svg";
import { useHistorialStore } from "../../store/useHistorialStore";
import { useAuthStore } from "../../store/useAuthStore";
import { PedidoDetalle } from "./DetallePedido";
import { DespachoDetalle } from "./DetalleDespacho";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
    setPedido: () => void;
}

// Estilos
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

export function PedidoHistorial({ setPedido }: Props) {
    const usuario = useAuthStore((state: any) => state.usuario);
    const [busqueda, setBusqueda] = useState("");
    const [detalle, setDetalle] = useState(false);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<number | null>(null);
    const { pedidos, fetchPedidos, loading, error } = useHistorialStore();
    const [sucursalSeleccionada, setSucursalSeleccionada] = useState("");
    const [usuarioSeleccionada, setUsuarioSeleccionada] = useState("");
    const [showFiltros, setShowFiltros] = useState(false);
    const [showEstadisticas, setShowEstadisticas] = useState(true);
    const [showDetalle, setShowDetalle] = useState(false);
    const [tab, setTab] = useState<'ingresos' | 'salidas'>('salidas');

    useEffect(() => {
        // Prioriza bodega si el usuario tiene ambos
        const params: any = {};
        if (usuario?.bodega) {
            params.bodega_id = usuario.bodega;
        } else if (usuario?.sucursal) {
            params.sucursal_id = usuario.sucursal;
        }
        fetchPedidos(params);
    }, [fetchPedidos, usuario]);

    // Siempre trabajar con un array seguro
    const pedidosArray = Array.isArray(pedidos) ? pedidos : [];

    // Estadísticas simples
    const totalPedidos = pedidosArray.length;
    const totalEntregados = pedidosArray.filter(p => p.estado_pedido_fk === 2).length; // Ajusta el valor según tu sistema
    const totalPendientes = pedidosArray.filter(p => p.estado_pedido_fk === 1).length;
    const totalProductos = pedidosArray.reduce((acc, p) => acc + (p.solicitud_fk?.productos?.reduce((a, prod) => a + Number(prod.cantidad), 0) || 0), 0);
    
    const sucursalesBusqueda = useMemo(() => {
        const nombres = pedidosArray.map(p => p.sucursal_fk?.nombre_sucursal).filter(Boolean);
        return [...new Set(nombres)];
    }, [pedidosArray]);

    const usuariosBusqueda = useMemo(() => {
        const nombresUs = pedidosArray.map(p => p.solicitud_fk?.usuario_nombre).filter(Boolean);
        return [...new Set(nombresUs)];
    }, [pedidosArray]);

    const pedidosFiltros = useMemo(() => {
        return pedidosArray.filter(pedido => {
            const filtroSucursal = sucursalSeleccionada
            ? pedido.sucursal_fk?.nombre_sucursal === sucursalSeleccionada
            : true;
            const filtroUsuario = usuarioSeleccionada
            ? pedido.solicitud_fk?.usuario_nombre === usuarioSeleccionada
            : true;
            const busquedaLower = busqueda.toLowerCase();
            const filtroBusqueda = busquedaLower === ""
            ? true
            : (
                (pedido.sucursal_fk?.nombre_sucursal || pedido.sucursal_nombre || "").toLowerCase().includes(busquedaLower) ||
                (pedido.fecha_entrega || "").toLowerCase().includes(busquedaLower) ||
                (pedido.personal_entrega_fk?.nombre_psn || pedido.personal_entrega_nombre || "").toLowerCase().includes(busquedaLower) ||
                (pedido.solicitud_fk?.usuario_nombre || pedido.usuario_nombre || "").toLowerCase().includes(busquedaLower) ||
                (Array.isArray(pedido.solicitud_fk?.productos) ? String(pedido.solicitud_fk.productos.length) : "0").includes(busquedaLower)
            );
            return filtroSucursal && filtroBusqueda && filtroUsuario;
        });
    }, [sucursalSeleccionada, pedidosArray, busqueda, usuarioSeleccionada]);

    // Separar ingresos y salidas
    const ingresos = pedidosFiltros.filter(p => !!p.proveedor_fk || !!p.proveedor_nombre);
    const salidas = pedidosFiltros.filter(p => !!p.sucursal_fk || !!p.sucursal_nombre);

    // Función de exportación Excel profesional
    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();
        // Salidas
        const salidasData = salidas.map(pedido => {
            const detalles = pedido.detalles_pedido || [];
            const cantidadTotal = detalles.reduce((a, d) => a + Number(d.cantidad || 0), 0);
            return {
                ID: pedido.id_p,
                Fecha: pedido.fecha_entrega?.split('T')[0] || '',
                Sucursal: pedido.sucursal_nombre || '',
                Usuario: pedido.usuario_nombre || '',
                'Cantidad (total)': cantidadTotal,
                Transportista: pedido.personal_entrega_nombre || '',
            };
        });
        const wsSalidas = XLSX.utils.json_to_sheet(salidasData);
        // Cabeceras doradas y negrita
        const salidasHeader = ["ID", "Fecha", "Sucursal", "Usuario", "Cantidad (total)", "Transportista"];
        XLSX.utils.sheet_add_aoa(wsSalidas, [salidasHeader], { origin: "A1" });
        // Ajuste de ancho
        wsSalidas['!cols'] = [
            { wch: 6 }, { wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 16 }, { wch: 22 }
        ];
        // Totales
        XLSX.utils.sheet_add_aoa(wsSalidas, [["", "", "", "Total", salidasData.reduce((a, d) => a + Number(d["Cantidad (total)"] || 0), 0), ""]], { origin: -1 });
        XLSX.utils.book_append_sheet(wb, wsSalidas, 'Salidas');
        // Ingresos
        const ingresosData = ingresos.map(pedido => {
            const detalles = pedido.detalles_pedido || [];
            const cantidadTotal = detalles.reduce((a, d) => a + Number(d.cantidad || 0), 0);
            return {
                ID: pedido.id_p,
                Fecha: pedido.fecha_entrega?.split('T')[0] || '',
                Proveedor: pedido.proveedor_nombre || '',
                Usuario: pedido.usuario_nombre || '',
                'Cantidad (total)': cantidadTotal,
            };
        });
        const wsIngresos = XLSX.utils.json_to_sheet(ingresosData);
        const ingresosHeader = ["ID", "Fecha", "Proveedor", "Usuario", "Cantidad (total)"];
        XLSX.utils.sheet_add_aoa(wsIngresos, [ingresosHeader], { origin: "A1" });
        wsIngresos['!cols'] = [
            { wch: 6 }, { wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 16 }
        ];
        XLSX.utils.sheet_add_aoa(wsIngresos, [["", "", "Total", "", ingresosData.reduce((a, d) => a + Number(d["Cantidad (total)"] || 0), 0)]], { origin: -1 });
        XLSX.utils.book_append_sheet(wb, wsIngresos, 'Ingresos');
        XLSX.writeFile(wb, 'historial_pedidos_profesional.xlsx');
    };

    // Función de exportación PDF profesional
    const handleExportPDF = () => {
        const doc = new jsPDF('l');
        doc.setFontSize(18);
        doc.text('Historial de Pedidos - Salidas', 14, 16);
        // Salidas
        autoTable(doc, {
            startY: 22,
            head: [["ID", "Fecha", "Sucursal", "Usuario", "Cantidad (total)", "Transportista"]],
            body: salidas.map(pedido => {
                const detalles = pedido.detalles_pedido || [];
                const cantidadTotal = detalles.reduce((a, d) => a + Number(d.cantidad || 0), 0);
                return [
                    pedido.id_p,
                    pedido.fecha_entrega?.split('T')[0] || '',
                    pedido.sucursal_nombre || '',
                    pedido.usuario_nombre || '',
                    cantidadTotal,
                    pedido.personal_entrega_nombre || ''
                ];
            }),
            headStyles: { fillColor: [255, 215, 0], textColor: [0, 0, 0], fontStyle: 'bold' },
            styles: { fontSize: 10 },
            foot: [["", "", "Total", "", salidas.reduce((a, p) => a + (p.detalles_pedido || []).reduce((b, d) => b + Number(d.cantidad || 0), 0), 0), ""]],
            footStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold' },
        });
        // Ingresos
        let y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 40;
        doc.setFontSize(18);
        doc.text('Historial de Pedidos - Ingresos', 14, y);
        autoTable(doc, {
            startY: y + 6,
            head: [["ID", "Fecha", "Proveedor", "Usuario", "Cantidad (total)"]],
            body: ingresos.map(pedido => {
                const detalles = pedido.detalles_pedido || [];
                const cantidadTotal = detalles.reduce((a, d) => a + Number(d.cantidad || 0), 0);
                return [
                    pedido.id_p,
                    pedido.fecha_entrega?.split('T')[0] || '',
                    pedido.proveedor_nombre || '',
                    pedido.usuario_nombre || '',
                    cantidadTotal
                ];
            }),
            headStyles: { fillColor: [255, 215, 0], textColor: [0, 0, 0], fontStyle: 'bold' },
            styles: { fontSize: 10 },
            foot: [["", "Total", "", "", ingresos.reduce((a, p) => a + (p.detalles_pedido || []).reduce((b, d) => b + Number(d.cantidad || 0), 0), 0)]],
            footStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold' },
        });
        doc.save('historial_pedidos_profesional.pdf');
    };

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
                📦 Historial de Pedidos
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button onClick={handleExportExcel} variant="contained" sx={{ bgcolor: '#FFD700', color: '#232323', fontWeight: 700 }}>
                        Exportar Excel
                    </Button>
                    <Button onClick={handleExportPDF} variant="contained" sx={{ bgcolor: '#FFD700', color: '#232323', fontWeight: 700 }}>
                        Exportar PDF
                    </Button>
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
                            <Grid container spacing={2} justifyContent="center" alignItems="center">
                                <Grid item xs={12} md={6}>
                                    <StatCard color="#FFD700" icon="📦" title="Total Pedidos" valor={totalPedidos} subtitulo="" />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <StatCard color="#4CAF50" icon="✅" title="Entregados" valor={totalEntregados} subtitulo="" />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <StatCard color="#FF9800" icon="⏳" title="Pendientes" valor={totalPendientes} subtitulo="" />
                                </Grid>
                            </Grid>
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
                            <Tooltip title="Recargar">
                                <IconButton onClick={fetchPedidos} sx={{ color: "#FFD700" }}>
                                    <RefreshIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Mostrar/Ocultar Estadísticas">
                                <IconButton onClick={() => setShowEstadisticas(!showEstadisticas)} sx={{ color: "#FFD700" }}>
                                    <TrendingUpIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </ToolbarContainer>

                    {/* Filtros avanzados */}
                    {showFiltros && (
                        <FiltrosCard>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        select
                                        label="Sucursal"
                            value={sucursalSeleccionada}
                            onChange={(e) => setSucursalSeleccionada(e.target.value)}
                                        size="small"
                                        fullWidth
                                    >
                                        <MenuItem value=""><em>Todas</em></MenuItem>
                                        {sucursalesBusqueda.map((sucursal) => (
                                            <MenuItem key={sucursal} value={sucursal}>{sucursal}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        select
                                        label="Usuario"
                            value={usuarioSeleccionada}
                            onChange={(e) => setUsuarioSeleccionada(e.target.value)}
                                        size="small"
                                        fullWidth
                          >
                                        <MenuItem value=""><em>Todos</em></MenuItem>
                                        {usuariosBusqueda.map((usuario) => (
                                <MenuItem key={usuario} value={usuario}>{usuario}</MenuItem>
                            ))}
                                    </TextField>
                                </Grid>
                                {/* Puedes agregar más filtros aquí si lo deseas */}
                            </Grid>
                        </FiltrosCard>
                    )}

                    {/* Tabs para ingresos/salidas */}
                    <Tabs
                        value={tab}
                        onChange={(_, v) => setTab(v)}
                        TabIndicatorProps={{ style: { backgroundColor: '#FFD700', height: 4, borderRadius: 2 } }}
                        sx={{ mb: 3, 
                            '& .MuiTab-root': { color: '#fff', fontWeight: 400 },
                            '& .Mui-selected': { color: '#FFD700 !important', fontWeight: 700 },
                        }}
                    >
                        <Tab value="salidas" label="Salidas a sucursal" />
                        <Tab value="ingresos" label="Ingresos de proveedor" />
                    </Tabs>

                    {/* Tabla de salidas */}
                    {tab === 'salidas' && (
                        <TableContainer component={Paper} sx={{ bgcolor: '#232323', borderRadius: 2, maxHeight: '50vh' }}>
                            <Table stickyHeader>
                                <TableHead sx={{ bgcolor: '#232323' }}>
                                    <TableRow>
                                        <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#232323' }}>ID</TableCell>
                                        <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#232323' }}>Fecha</TableCell>
                                        <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#232323' }}>Sucursal</TableCell>
                                        <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#232323' }}>Usuario</TableCell>
                                        <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#232323' }}>Cantidad (total)</TableCell>
                                        <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#232323' }}>Transportista</TableCell>
                                        <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#232323' }}>Acciones</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {salidas.map((pedido) => {
                                        const detalles = pedido.detalles_pedido || [];
                                        const cantidadTotal = detalles.reduce((a: number, d: any) => a + Number(d.cantidad || 0), 0);
                                        return (
                                            <TableRow key={pedido.id_p} hover>
                                                <TableCell sx={{ color: '#fff' }}>{pedido.id_p}</TableCell>
                                                <TableCell sx={{ color: '#fff' }}>{pedido.fecha_entrega?.split('T')[0] || '—'}</TableCell>
                                                <TableCell sx={{ color: '#fff' }}>{pedido.sucursal_nombre || '—'}</TableCell>
                                                <TableCell sx={{ color: '#fff' }}>{pedido.usuario_nombre || '—'}</TableCell>
                                                <TableCell sx={{ color: '#FFD700', fontWeight: 700 }}>{cantidadTotal || '—'}</TableCell>
                                                <TableCell sx={{ color: '#fff' }}>{pedido.personal_entrega_nombre || '—'}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ color: "#FFD700", borderColor: "#FFD700" }}
                                                        onClick={() => {
                                                            setPedidoSeleccionado(pedido.id_p);
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
                    )}

                    {/* Tabla de ingresos */}
                    {tab === 'ingresos' && (
                        <TableContainer component={Paper} sx={{ bgcolor: '#232323', borderRadius: 2, maxHeight: '50vh' }}>
                            <Table stickyHeader>
                                <TableHead sx={{ bgcolor: '#232323' }}>
                                    <TableRow>
                                        <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#232323' }}>ID</TableCell>
                                        <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#232323' }}>Fecha</TableCell>
                                        <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#232323' }}>Proveedor</TableCell>
                                        <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#232323' }}>Usuario</TableCell>
                                        <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#232323' }}>Cantidad (total)</TableCell>
                                        <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#232323' }}>Acciones</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {ingresos.map((pedido) => {
                                        const detalles = pedido.detalles_pedido || [];
                                        const cantidadTotal = detalles.reduce((a: number, d: any) => a + Number(d.cantidad || 0), 0);
                                        return (
                                            <TableRow key={pedido.id_p} hover>
                                                <TableCell sx={{ color: '#fff' }}>{pedido.id_p}</TableCell>
                                                <TableCell sx={{ color: '#fff' }}>{pedido.fecha_entrega?.split('T')[0] || '—'}</TableCell>
                                                <TableCell sx={{ color: '#fff' }}>{pedido.proveedor_nombre || '—'}</TableCell>
                                                <TableCell sx={{ color: '#fff' }}>{pedido.usuario_nombre || '—'}</TableCell>
                                                <TableCell sx={{ color: '#FFD700', fontWeight: 700 }}>{cantidadTotal || '—'}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ color: "#FFD700", borderColor: "#FFD700" }}
                                            onClick={() => {
                                                setPedidoSeleccionado(pedido.id_p);
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
                    )}

                    {/* Modal de detalle de pedido */}
                    <Dialog
                        open={showDetalle}
                        onClose={() => setShowDetalle(false)}
                        maxWidth="md"
                        fullWidth
                        PaperProps={{ sx: { borderRadius: 3, bgcolor: '#181818' } }}
                    >
                        <DialogTitle sx={{ color: '#FFD700', fontWeight: 700, fontSize: 22 }}>
                            Detalle del Pedido
                        </DialogTitle>
                        <DialogContent>
                            {(() => {
                                const pedido = pedidosArray.find((p) => p.id_p === pedidoSeleccionado);
                                if (!pedido) return <Typography>No se encontró el pedido.</Typography>;
                                const detalles = pedido.detalles_pedido || [];
                                // Detectar tipo de pedido
                                const esIngreso = !!pedido.proveedor_fk || !!pedido.proveedor_nombre;
                                const esSalida = !!pedido.sucursal_fk || !!pedido.sucursal_nombre;
                                return (
                                    <Box>
                                        {/* Info general */}
                                        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ color: '#FFD700' }}>ID:</Typography>
                                                <Typography sx={{ color: '#fff' }}>{pedido.id_p}</Typography>
                                            </Box>
                                            {esIngreso && (
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ color: '#FFD700' }}>Proveedor:</Typography>
                                                    <Typography sx={{ color: '#fff' }}>{pedido.proveedor_nombre || 'No aplica'}</Typography>
                                                </Box>
                                            )}
                                            {esSalida && (
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ color: '#FFD700' }}>Sucursal:</Typography>
                                                    <Typography sx={{ color: '#fff' }}>{pedido.sucursal_nombre || 'No aplica'}</Typography>
                                                </Box>
                                            )}
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ color: '#FFD700' }}>Usuario:</Typography>
                                                <Typography sx={{ color: '#fff' }}>{pedido.usuario_nombre || '—'}</Typography>
                                            </Box>
                                            {esSalida && (
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ color: '#FFD700' }}>Transportista:</Typography>
                                                    <Typography sx={{ color: '#fff' }}>{pedido.personal_entrega_nombre || 'No aplica'}</Typography>
                                                </Box>
                                            )}
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ color: '#FFD700' }}>Fecha Entrega:</Typography>
                                                <Typography sx={{ color: '#fff' }}>{pedido.fecha_entrega?.split('T')[0] || '—'}</Typography>
                                            </Box>
                                        </Box>
                                        {/* Tabla de productos */}
                                        <Typography variant="h6" sx={{ color: '#FFD700', mb: 1 }}>Productos del pedido</Typography>
                                        <TableContainer component={Paper} sx={{ bgcolor: '#232323', borderRadius: 2, mb: 2 }}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{ color: '#FFD700', fontWeight: 700 }}>Producto</TableCell>
                                                        <TableCell sx={{ color: '#FFD700', fontWeight: 700 }}>Cantidad</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {detalles.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={2} sx={{ color: '#fff', textAlign: 'center' }}>No hay productos en este pedido.</TableCell>
                                                        </TableRow>
                                                    ) : detalles.map((d: any) => (
                                                        <TableRow key={d.id}>
                                                            <TableCell sx={{ color: '#fff' }}>{d.producto_nombre || '—'}</TableCell>
                                                            <TableCell sx={{ color: '#FFD700', fontWeight: 700 }}>{d.cantidad || '—'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                                    </Box>
                                );
                            })()}
                        </DialogContent>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
                            <Button onClick={() => setShowDetalle(false)} variant="contained" sx={{ bgcolor: '#FFD700', color: '#232323', fontWeight: 700 }}>
                                Cerrar
                            </Button>
                        </Box>
                    </Dialog>

                    {/* Mensaje si no hay pedidos */}
                    {!loading && !error && pedidosFiltros.length === 0 && (
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