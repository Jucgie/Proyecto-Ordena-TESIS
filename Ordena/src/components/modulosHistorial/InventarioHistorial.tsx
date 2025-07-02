import React from "react";
import styled from "styled-components";
import { useEffect, useState } from "react";
import { historialService } from "../../services/historialService";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Select, MenuItem, TextField, Button, Box, Typography, Chip, Card, CardContent,
    Grid, IconButton, Tooltip, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import {
    FilterAlt as FilterIcon,
    Refresh as RefreshIcon,
    FileDownload as ExportIcon,
    TrendingUp as TrendingUpIcon,
    Search as SearchIcon
} from "@mui/icons-material";
import { useAuthStore } from "../../store/useAuthStore";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
    setHistorial: () => void;
    bodegaId?: string;
    sucursalId?: string;
}

interface Movimiento {
    id_mvin: number;
    cantidad: number;
    fecha: string;
    producto_nombre: string;
    producto_codigo: string;
    usuario_nombre: string;
    tipo_movimiento: string;
    stock_actual: number;
    ubicacion: string;
    icono_movimiento: string;
    color_movimiento: string;
    descripcion_movimiento: string;
}

interface Estadisticas {
    total_movimientos: number;
    entradas: { cantidad: number; unidades: number };
    salidas: { cantidad: number; unidades: number };
    ajustes: { cantidad: number; unidades: number };
    balance: number;
}

export function InventarioHistorial({ setHistorial, bodegaId, sucursalId }: Props) {
    const usuario = useAuthStore((state: any) => state.usuario);
    const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
    const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Filtros
    const [filtros, setFiltros] = useState({
        tipo_movimiento: '',
        fecha_inicio: '',
        fecha_fin: '',
        cantidad_min: '',
        cantidad_max: '',
        search: ''
    });
    
    // Estados de UI
    const [showFiltros, setShowFiltros] = useState(false);
    const [showEstadisticas, setShowEstadisticas] = useState(true);

    const cargarMovimientos = async () => {
        setLoading(true);
        setError(null);
        try {
            // Prioriza bodega si el usuario tiene ambos
            const params = {
                ...filtros,
                bodega: usuario?.bodega || bodegaId || undefined,
                sucursal: (!usuario?.bodega && usuario?.sucursal) ? usuario.sucursal : (sucursalId || undefined),
            };
            const data = await historialService.getMovimientosInventario(params);
            setMovimientos(data.movimientos);
            setEstadisticas(data.estadisticas);
        } catch (err) {
            setError("Error al cargar movimientos");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarMovimientos();
    }, [bodegaId, sucursalId]);

    const handleFiltroChange = (campo: string, valor: string) => {
        setFiltros(prev => ({ ...prev, [campo]: valor }));
    };

    const aplicarFiltros = () => {
        cargarMovimientos();
        setShowFiltros(false);
    };

    const limpiarFiltros = () => {
        setFiltros({
            tipo_movimiento: '',
            fecha_inicio: '',
            fecha_fin: '',
            cantidad_min: '',
            cantidad_max: '',
            search: ''
        });
    };

    const exportarExcel = () => {
        // Prepara los datos para exportar
        const data = movimientosFiltrados.map(mov => ({
            ID: mov.id_mvin,
            Fecha: new Date(mov.fecha).toLocaleDateString(),
            Hora: new Date(mov.fecha).toLocaleTimeString(),
            Tipo: mov.tipo_movimiento,
            Producto: mov.producto_nombre,
            Código: mov.producto_codigo,
            Cantidad: mov.cantidad,
            'Stock Actual': mov.stock_actual,
            Usuario: mov.usuario_nombre,
            Ubicación: mov.ubicacion
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const header = ["ID", "Fecha", "Hora", "Tipo", "Producto", "Código", "Cantidad", "Stock Actual", "Usuario", "Ubicación"];
        XLSX.utils.sheet_add_aoa(ws, [header], { origin: "A1" });
        ws['!cols'] = [
            { wch: 6 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 22 }, { wch: 16 }, { wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 18 }
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Movimientos Inventario');
        XLSX.writeFile(wb, 'historial_inventario.xlsx');
    };

    const exportarPDF = () => {
        const doc = new jsPDF('l');
        doc.setFontSize(18);
        doc.text('Historial de Movimientos de Inventario', 14, 16);
        autoTable(doc, {
            startY: 22,
            head: [["ID", "Fecha", "Hora", "Tipo", "Producto", "Código", "Cantidad", "Stock Actual", "Usuario", "Ubicación"]],
            body: movimientosFiltrados.map(mov => [
                mov.id_mvin,
                new Date(mov.fecha).toLocaleDateString(),
                new Date(mov.fecha).toLocaleTimeString(),
                mov.tipo_movimiento,
                mov.producto_nombre,
                mov.producto_codigo,
                mov.cantidad,
                mov.stock_actual,
                mov.usuario_nombre,
                mov.ubicacion
            ]),
            headStyles: { fillColor: [255, 215, 0], textColor: [0, 0, 0], fontStyle: 'bold' },
            styles: { fontSize: 10 },
        });
        doc.save('historial_inventario.pdf');
    };

    const movimientosFiltrados = movimientos.filter(mov => 
        filtros.search === '' || 
        mov.producto_nombre.toLowerCase().includes(filtros.search.toLowerCase()) ||
        mov.producto_codigo.toLowerCase().includes(filtros.search.toLowerCase()) ||
        mov.usuario_nombre.toLowerCase().includes(filtros.search.toLowerCase())
    );

    return (
        <Dialog
            open={true}
            onClose={setHistorial}
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
                📊 Bitácora de Movimientos de Inventario
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button onClick={exportarExcel} variant="contained" sx={{ bgcolor: '#FFD700', color: '#232323', fontWeight: 700 }}>
                        Exportar Excel
                    </Button>
                    <Button onClick={exportarPDF} variant="contained" sx={{ bgcolor: '#FFD700', color: '#232323', fontWeight: 700 }}>
                        Exportar PDF
                    </Button>
                    <Button onClick={setHistorial} variant="outlined" sx={{ color: "#FFD700", borderColor: "#FFD700" }}>
                        🠔 Volver
                    </Button>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 0, bgcolor: '#1E1E1E', overflow: 'auto' }}>
                <Box sx={{ p: 3 }}>
                    {/* Estadísticas */}
                    {showEstadisticas && estadisticas && (
                        <EstadisticasCard>
                            <Grid container spacing={2} justifyContent="center" alignItems="center">
                                <Grid item xs={12} md={4}>
                                    <StatCard color="#4CAF50" icon="📥" title="Entradas" 
                                        valor={estadisticas.entradas.cantidad} subtitulo={`${estadisticas.entradas.unidades} unidades`} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <StatCard color="#F44336" icon="📤" title="Salidas" 
                                        valor={estadisticas.salidas.cantidad} subtitulo={`${estadisticas.salidas.unidades} unidades`} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <StatCard color={estadisticas.balance >= 0 ? "#4CAF50" : "#F44336"} 
                                        icon={estadisticas.balance >= 0 ? "📈" : "📉"} title="Balance" 
                                        valor={estadisticas.balance} subtitulo="unidades" />
                                </Grid>
                            </Grid>
                        </EstadisticasCard>
                    )}

                    {/* Barra de herramientas */}
                    <ToolbarContainer>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
                            <TextField
                                placeholder="Buscar por producto, código o usuario..."
                                value={filtros.search}
                                onChange={(e) => handleFiltroChange('search', e.target.value)}
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
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Tooltip title="Recargar">
                                <IconButton onClick={cargarMovimientos} sx={{ color: "#FFD700" }}>
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
                                <Grid item xs={12} md={2}>
                                    <TextField
                                        select
                                        label="Tipo de Movimiento"
                                        value={filtros.tipo_movimiento}
                                        onChange={(e) => handleFiltroChange('tipo_movimiento', e.target.value)}
                                        size="small"
                                        fullWidth
                                    >
                                        <MenuItem value="">Todos</MenuItem>
                                        <MenuItem value="ENTRADA">📥 Entradas</MenuItem>
                                        <MenuItem value="SALIDA">📤 Salidas</MenuItem>
                                        <MenuItem value="AJUSTE">⚙️ Ajustes</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <TextField
                                        label="Cantidad Mín"
                                        type="number"
                                        value={filtros.cantidad_min}
                                        onChange={(e) => handleFiltroChange('cantidad_min', e.target.value)}
                                        size="small"
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <TextField
                                        label="Cantidad Máx"
                                        type="number"
                                        value={filtros.cantidad_max}
                                        onChange={(e) => handleFiltroChange('cantidad_max', e.target.value)}
                                        size="small"
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <TextField
                                        label="Fecha Inicio"
                                        type="date"
                                        value={filtros.fecha_inicio}
                                        onChange={(e) => handleFiltroChange('fecha_inicio', e.target.value)}
                                        size="small"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <TextField
                                        label="Fecha Fin"
                                        type="date"
                                        value={filtros.fecha_fin}
                                        onChange={(e) => handleFiltroChange('fecha_fin', e.target.value)}
                                        size="small"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button variant="contained" onClick={aplicarFiltros} sx={{ bgcolor: "#FFD700", color: "#232323" }}>
                                            Aplicar
                                        </Button>
                                        <Button variant="outlined" onClick={limpiarFiltros} sx={{ color: "#FFD700", borderColor: "#FFD700" }}>
                                            Limpiar
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </FiltrosCard>
                    )}

                    {/* Tabla de movimientos */}
                    <TableContainerStyled>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                <CircularProgress sx={{ color: "#FFD700" }} />
                            </Box>
                        ) : error ? (
                            <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
                        ) : (
                            <TableContainer component={Paper} sx={{ bgcolor: '#2E2E2E', borderRadius: 2 }}>
                                <Table>
                        <TableHead>
                                        <TableRow sx={{ bgcolor: '#232323' }}>
                                            <TableCell sx={{ color: "#FFD700", fontWeight: 700 }}>Fecha</TableCell>
                                            <TableCell sx={{ color: "#FFD700", fontWeight: 700 }}>Hora</TableCell>
                                            <TableCell sx={{ color: "#FFD700", fontWeight: 700 }}>Tipo</TableCell>
                                            <TableCell sx={{ color: "#FFD700", fontWeight: 700 }}>Producto</TableCell>
                                            <TableCell sx={{ color: "#FFD700", fontWeight: 700 }}>Código</TableCell>
                                            <TableCell sx={{ color: "#FFD700", fontWeight: 700 }}>Cantidad</TableCell>
                                            <TableCell sx={{ color: "#FFD700", fontWeight: 700 }}>Stock Actual</TableCell>
                                            <TableCell sx={{ color: "#FFD700", fontWeight: 700 }}>Usuario</TableCell>
                                            <TableCell sx={{ color: "#FFD700", fontWeight: 700 }}>Ubicación</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                                        {movimientosFiltrados.map((mov) => {
                                            const fecha = new Date(mov.fecha);
                                            return (
                                <TableRow
                                                    key={mov.id_mvin}
                                                    sx={{ 
                                                        '&:hover': { bgcolor: '#3E3E3E' },
                                                        borderLeft: `4px solid ${mov.color_movimiento}`
                                                    }}
                                                >
                                                    <TableCell sx={{ color: "#fff" }}>
                                                        {fecha.toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell sx={{ color: "#fff" }}>
                                                        {fecha.toLocaleTimeString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={`${mov.icono_movimiento} ${mov.tipo_movimiento}`}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: mov.color_movimiento,
                                                                color: "#fff",
                                                                fontWeight: 600
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ color: "#fff", fontWeight: 500 }}>
                                                        {mov.producto_nombre}
                                                    </TableCell>
                                                    <TableCell sx={{ color: "#ccc", fontFamily: "monospace" }}>
                                                        {mov.producto_codigo}
                                                    </TableCell>
                                                    <TableCell sx={{ color: "#fff", fontWeight: 600 }}>
                                                        <span style={{ color: mov.cantidad > 0 ? "#4CAF50" : "#F44336" }}>
                                                            {mov.cantidad > 0 ? '+' : ''}{mov.cantidad}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell sx={{ color: "#fff" }}>
                                                        {mov.stock_actual}
                                                    </TableCell>
                                                    <TableCell sx={{ color: "#fff" }}>
                                                        {mov.usuario_nombre}
                                                    </TableCell>
                                                    <TableCell sx={{ color: "#ccc", fontSize: "0.875rem" }}>
                                                        {mov.ubicacion}
                                    </TableCell>
                                </TableRow>
                                            );
                                        })}
                        </TableBody>
                    </Table>
                </TableContainer>
                        )}
                    </TableContainerStyled>

                    {/* Mensaje si no hay movimientos */}
                    {!loading && !error && movimientosFiltrados.length === 0 && (
                        <Box sx={{ textAlign: 'center', p: 4, color: '#666' }}>
                            <Typography variant="h6">No se encontraron movimientos</Typography>
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
        <Card sx={{ bgcolor: '#2E2E2E', border: `2px solid ${color}`, borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
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
            </CardContent>
        </Card>
    );
}

// Estilos
const Container = styled.div`
  position: fixed;
  height: 90vh;
  width: 80%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-radius: 8px;
  background: #1E1E1E;
  box-shadow: -10px 15px 30px rgba(10, 9, 9, 0.4);
  padding: 20px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
`;

const Header = styled.div`
    display: flex;
  justify-content: space-between;
    align-items: center;
  padding-bottom: 16px;
  border-bottom: 2px solid #333;
`;

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

const TableContainerStyled = styled.div`
  flex: 1;
  overflow: auto;
  background: #2E2E2E;
  border-radius: 8px;
  border: 1px solid #444;
`;