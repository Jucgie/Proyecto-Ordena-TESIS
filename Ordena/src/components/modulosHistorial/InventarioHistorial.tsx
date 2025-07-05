import React from "react";
import styled from "styled-components";
import { useEffect, useState } from "react";
import { historialService } from "../../services/historialService";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Select, MenuItem, TextField, Button, Box, Typography, Chip, Card, CardContent,
    Grid, IconButton, Tooltip, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
    Collapse
} from "@mui/material";
import {
    FilterAlt as FilterIcon,
    Refresh as RefreshIcon,
    FileDownload as ExportIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Search as SearchIcon,
    History as HistoryIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Settings as SettingsIcon
} from "@mui/icons-material";
import { useAuthStore } from "../../store/useAuthStore";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatFechaChile } from '../../utils/formatFechaChile';
import ProductoHistorialDetalle from './ProductoHistorialDetalle';

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
    producto_id?: string;
    usuario_nombre: string;
    tipo_movimiento: string;
    stock_actual: number;
    stock_antes?: number;
    stock_despues?: number;
    motivo?: string;
    ubicacion: string;
    icono_movimiento: string;
    color_movimiento: string;
    descripcion_movimiento: string;
}

interface ProductoAgrupado {
    nombre: string;
    codigo: string;
    producto_id?: string;
    movimientos: Movimiento[];
    stock_actual: number;
    stock_minimo: number;
    stock_maximo: number;
    ubicacion: string;
    marca: string;
    categoria: string;
    estadisticas: {
        total_movimientos: number;
        entradas: number;
        salidas: number;
        ajustes: number;
        balance: number;
    };
    ultimo_movimiento: Movimiento;
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
    const [productosAgrupados, setProductosAgrupados] = useState<ProductoAgrupado[]>([]);
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
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    
    // Estado para historial detallado de productos
    const [historialProductoOpen, setHistorialProductoOpen] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState<string | null>(null);

    const cargarMovimientos = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                ...filtros,
                bodega: usuario?.bodega || bodegaId || undefined,
                sucursal: (!usuario?.bodega && usuario?.sucursal) ? usuario.sucursal : (sucursalId || undefined),
            };
            const data = await historialService.getMovimientosInventario(params);
            setMovimientos(data.movimientos);
            setEstadisticas(data.estadisticas);
            agruparProductos(data.movimientos);
        } catch (err) {
            setError("Error al cargar movimientos");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const agruparProductos = (movimientosData: Movimiento[]) => {
        const agrupados = new Map<string, ProductoAgrupado>();

        // Ordenar movimientos por fecha (más reciente primero)
        const movimientosOrdenados = [...movimientosData].sort((a, b) => 
            new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );

        movimientosOrdenados.forEach(mov => {
            const key = `${mov.producto_nombre}-${mov.producto_codigo}`;
            
            if (!agrupados.has(key)) {
                agrupados.set(key, {
                    nombre: mov.producto_nombre,
                    codigo: mov.producto_codigo,
                    producto_id: mov.producto_id,
                    movimientos: [],
                    stock_actual: mov.stock_actual,
                    stock_minimo: 5, // Valor por defecto
                    stock_maximo: 100, // Valor por defecto
                    ubicacion: mov.ubicacion,
                    marca: '', // Se puede obtener de otro lugar si es necesario
                    categoria: '', // Se puede obtener de otro lugar si es necesario
                    estadisticas: {
                        total_movimientos: 0,
                        entradas: 0,
                        salidas: 0,
                        ajustes: 0,
                        balance: 0
                    },
                    ultimo_movimiento: mov
                });
            }

            const grupo = agrupados.get(key)!;
            grupo.movimientos.push(mov);
            grupo.estadisticas.total_movimientos++;
            
            if (mov.tipo_movimiento === 'ENTRADA') {
                grupo.estadisticas.entradas++;
                grupo.estadisticas.balance += mov.cantidad;
            } else if (mov.tipo_movimiento === 'SALIDA') {
                grupo.estadisticas.salidas++;
                grupo.estadisticas.balance -= mov.cantidad;
            } else if (mov.tipo_movimiento === 'AJUSTE') {
                grupo.estadisticas.ajustes++;
                grupo.estadisticas.balance += mov.cantidad;
            }

            // Actualizar stock actual con el más reciente
            grupo.stock_actual = mov.stock_actual;
            
            // Actualizar último movimiento (como ya están ordenados por fecha descendente, 
            // el primer movimiento que encontremos será el más reciente)
            if (!grupo.ultimo_movimiento || new Date(mov.fecha).getTime() > new Date(grupo.ultimo_movimiento.fecha).getTime()) {
                grupo.ultimo_movimiento = mov;
            }
        });

        // Convertir a array y ordenar por fecha del último movimiento
        const gruposArray = Array.from(agrupados.values()).sort((a, b) => 
            new Date(b.ultimo_movimiento.fecha).getTime() - new Date(a.ultimo_movimiento.fecha).getTime()
        );

        // Ordenar los movimientos de cada grupo por fecha descendente (más reciente primero)
        gruposArray.forEach(grupo => {
            grupo.movimientos.sort((a, b) => 
                new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
            );
        });

        setProductosAgrupados(gruposArray);
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

    const toggleExpandedRow = (key: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(key)) {
            newExpanded.delete(key);
        } else {
            newExpanded.add(key);
        }
        setExpandedRows(newExpanded);
    };

    const abrirHistorialProducto = (productoId: string) => {
        setProductoSeleccionado(productoId);
        setHistorialProductoOpen(true);
    };

    const cerrarHistorialProducto = () => {
        setHistorialProductoOpen(false);
        setProductoSeleccionado(null);
    };

    const getTipoIcono = (tipo: string) => {
        switch (tipo) {
            case 'ENTRADA': return <TrendingUpIcon />;
            case 'SALIDA': return <TrendingDownIcon />;
            case 'AJUSTE': return <SettingsIcon />;
            default: return <TrendingUpIcon />;
        }
    };

    const getTipoColor = (tipo: string) => {
        switch (tipo) {
            case 'ENTRADA': return '#4CAF50';
            case 'SALIDA': return '#F44336';
            case 'AJUSTE': return '#FF9800';
            default: return '#757575';
        }
    };

    const getStockStatus = (stock: number, minimo: number, maximo: number) => {
        if (stock <= minimo) return { status: 'CRÍTICO', color: '#F44336' };
        if (stock >= maximo) return { status: 'MÁXIMO', color: '#FF9800' };
        return { status: 'NORMAL', color: '#4CAF50' };
    };

    const productosFiltrados = productosAgrupados.filter(producto => 
        filtros.search === '' || 
        producto.nombre.toLowerCase().includes(filtros.search.toLowerCase()) ||
        producto.codigo.toLowerCase().includes(filtros.search.toLowerCase())
    );

    const exportarExcel = () => {
        const data = movimientos.map(mov => ({
            ID: mov.id_mvin,
            Fecha: formatFechaChile(mov.fecha),
            Hora: formatFechaChile(mov.fecha),
            Tipo: mov.tipo_movimiento,
            Producto: mov.producto_nombre,
            Código: mov.producto_codigo,
            Cantidad: mov.cantidad,
            'Stock Antes': mov.stock_antes !== undefined ? mov.stock_antes : '',
            'Stock Después': mov.stock_despues !== undefined ? mov.stock_despues : mov.stock_actual,
            Motivo: mov.motivo || '',
            Usuario: mov.usuario_nombre,
            Ubicación: mov.ubicacion
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const header = ["ID", "Fecha", "Hora", "Tipo", "Producto", "Código", "Cantidad", "Stock Antes", "Stock Después", "Motivo", "Usuario", "Ubicación"];
        XLSX.utils.sheet_add_aoa(ws, [header], { origin: "A1" });
        ws['!cols'] = [
            { wch: 6 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 22 }, { wch: 16 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 18 }, { wch: 18 }
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
            head: [["ID", "Fecha", "Hora", "Tipo", "Producto", "Código", "Cantidad", "Stock Antes", "Stock Después", "Motivo", "Usuario", "Ubicación"]],
            body: movimientos.map(mov => [
                mov.id_mvin,
                formatFechaChile(mov.fecha),
                formatFechaChile(mov.fecha),
                mov.tipo_movimiento,
                mov.producto_nombre,
                mov.producto_codigo,
                mov.cantidad,
                mov.stock_antes !== undefined ? mov.stock_antes : '',
                mov.stock_despues !== undefined ? mov.stock_despues : mov.stock_actual,
                mov.motivo || '',
                mov.usuario_nombre,
                mov.ubicacion
            ]),
            headStyles: { fillColor: [255, 215, 0], textColor: [0, 0, 0], fontStyle: 'bold' },
            styles: { fontSize: 10 },
        });
        doc.save('historial_inventario.pdf');
    };

    return (
        <>
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
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                                    <Box sx={{ flex: '1 1 300px', maxWidth: '400px' }}>
                                        <StatCard color="#4CAF50" icon="📥" title="Entradas" 
                                            valor={estadisticas.entradas.cantidad} subtitulo={`${estadisticas.entradas.unidades} unidades`} />
                                    </Box>
                                    <Box sx={{ flex: '1 1 300px', maxWidth: '400px' }}>
                                        <StatCard color="#F44336" icon="📤" title="Salidas" 
                                            valor={estadisticas.salidas.cantidad} subtitulo={`${estadisticas.salidas.unidades} unidades`} />
                                    </Box>
                                    <Box sx={{ flex: '1 1 300px', maxWidth: '400px' }}>
                                        <StatCard color={estadisticas.balance >= 0 ? "#4CAF50" : "#F44336"} 
                                            icon={estadisticas.balance >= 0 ? "📈" : "📉"} title="Balance" 
                                            valor={estadisticas.balance} subtitulo="unidades" />
                                    </Box>
                                </Box>
                            </EstadisticasCard>
                        )}

                        {/* Barra de herramientas */}
                        <ToolbarContainer>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
                                <TextField
                                    placeholder="Buscar por producto o código..."
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
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                                    <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
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
                                    </Box>
                                    <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                                        <TextField
                                            label="Cantidad Mín"
                                            type="number"
                                            value={filtros.cantidad_min}
                                            onChange={(e) => handleFiltroChange('cantidad_min', e.target.value)}
                                            size="small"
                                            fullWidth
                                        />
                                    </Box>
                                    <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                                        <TextField
                                            label="Cantidad Máx"
                                            type="number"
                                            value={filtros.cantidad_max}
                                            onChange={(e) => handleFiltroChange('cantidad_max', e.target.value)}
                                            size="small"
                                            fullWidth
                                        />
                                    </Box>
                                    <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                                        <TextField
                                            label="Fecha Inicio"
                                            type="date"
                                            value={filtros.fecha_inicio}
                                            onChange={(e) => handleFiltroChange('fecha_inicio', e.target.value)}
                                            size="small"
                                            fullWidth
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Box>
                                    <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                                        <TextField
                                            label="Fecha Fin"
                                            type="date"
                                            value={filtros.fecha_fin}
                                            onChange={(e) => handleFiltroChange('fecha_fin', e.target.value)}
                                            size="small"
                                            fullWidth
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Box>
                                    <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button variant="contained" onClick={aplicarFiltros} sx={{ bgcolor: "#FFD700", color: "#232323" }}>
                                                Aplicar
                                            </Button>
                                            <Button variant="outlined" onClick={limpiarFiltros} sx={{ color: "#FFD700", borderColor: "#FFD700" }}>
                                                Limpiar
                                            </Button>
                                        </Box>
                                    </Box>
                                </Box>
                            </FiltrosCard>
                        )}

                        {/* Tabla de productos agrupados */}
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
                                                <TableCell sx={{ color: "#FFD700", fontWeight: 700, fontSize: 16 }}>Producto</TableCell>
                                                <TableCell sx={{ color: "#FFD700", fontWeight: 700, fontSize: 16 }}>Código</TableCell>
                                                <TableCell sx={{ color: "#FFD700", fontWeight: 700, fontSize: 16 }}>Stock</TableCell>
                                                <TableCell sx={{ color: "#FFD700", fontWeight: 700, fontSize: 16 }}>Movimientos</TableCell>
                                                <TableCell sx={{ color: "#FFD700", fontWeight: 700, fontSize: 16 }}>Último Movimiento</TableCell>
                                                <TableCell sx={{ color: "#FFD700", fontWeight: 700, fontSize: 16 }}>Acciones</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                            {productosFiltrados.map((producto) => {
                                                const key = `${producto.nombre}-${producto.codigo}`;
                                                const isExpanded = expandedRows.has(key);
                                                const stockStatus = getStockStatus(producto.stock_actual, producto.stock_minimo, producto.stock_maximo);

                                                    return (
                                                    <React.Fragment key={key}>
                                                        <TableRow sx={{ 
                                                            bgcolor: '#2A2A2A', 
                                                            '&:hover': { bgcolor: '#333' },
                                                            borderBottom: '1px solid #444'
                                                        }}>
                                                            <TableCell sx={{ color: '#fff' }}>
                                                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                                    {producto.nombre}
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ color: '#888' }}>
                                                                    {producto.ubicacion}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell sx={{ color: '#FFD700', fontFamily: 'monospace', fontWeight: 600 }}>
                                                                {producto.codigo}
                                                            </TableCell>
                                                            <TableCell sx={{ color: '#fff' }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                                        {producto.stock_actual}
                                                                    </Typography>
                                                                    <Chip 
                                                                        label={stockStatus.status} 
                                                                        size="small"
                                                            sx={{ 
                                                                            bgcolor: stockStatus.color + '20',
                                                                            color: stockStatus.color,
                                                                            border: `1px solid ${stockStatus.color}40`
                                                                        }}
                                                                    />
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell sx={{ color: '#fff' }}>
                                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <TrendingUpIcon sx={{ color: '#4CAF50', fontSize: 16 }} />
                                                                        <Typography variant="body2" sx={{ color: '#4CAF50' }}>
                                                                            +{producto.estadisticas.entradas}
                                                                        </Typography>
                                                                    </Box>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <TrendingDownIcon sx={{ color: '#F44336', fontSize: 16 }} />
                                                                        <Typography variant="body2" sx={{ color: '#F44336' }}>
                                                                            -{producto.estadisticas.salidas}
                                                                        </Typography>
                                                                    </Box>
                                                                    <Typography variant="body2" sx={{ 
                                                                        color: producto.estadisticas.balance >= 0 ? '#4CAF50' : '#F44336',
                                                                        fontWeight: 600
                                                                    }}>
                                                                        Balance: {producto.estadisticas.balance >= 0 ? '+' : ''}{producto.estadisticas.balance}
                                                                    </Typography>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell sx={{ color: '#fff' }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <Box sx={{ color: getTipoColor(producto.ultimo_movimiento.tipo_movimiento) }}>
                                                                        {getTipoIcono(producto.ultimo_movimiento.tipo_movimiento)}
                                                                    </Box>
                                                                    <Box>
                                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                            {producto.ultimo_movimiento.tipo_movimiento}
                                                                        </Typography>
                                                                        <Typography variant="caption" sx={{ color: '#888' }}>
                                                                            {formatFechaChile(producto.ultimo_movimiento.fecha)}
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                                    <Tooltip title="Ver detalles de movimientos">
                                                                        <IconButton 
                                                                            onClick={() => toggleExpandedRow(key)}
                                                                            sx={{ color: '#FFD700' }}
                                                                        >
                                                                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title="Ver historial detallado del producto">
                                                                        <IconButton 
                                                                            onClick={() => abrirHistorialProducto(producto.producto_id || '')}
                                                                            disabled={!producto.producto_id}
                                                                            sx={{ color: '#FFD700' }}
                                                                        >
                                                                            <HistoryIcon />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </Box>
                                                            </TableCell>
                                                        </TableRow>
                                                        
                                                        {/* Fila expandida con movimientos */}
                                                        <TableRow>
                                                            <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
                                                                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                                                    <Box sx={{ bgcolor: '#1E1E1E', p: 2 }}>
                                                                        <Typography variant="h6" sx={{ color: '#FFD700', mb: 2 }}>
                                                                            Movimientos de {producto.nombre} ({producto.codigo})
                                                                        </Typography>
                                                                        <TableContainer component={Paper} sx={{ bgcolor: '#2A2A2A' }}>
                                                                            <Table size="small">
                                                                                <TableHead>
                                                                                    <TableRow sx={{ bgcolor: '#1E1E1E' }}>
                                                                                        <TableCell sx={{ color: '#FFD700', fontWeight: 600 }}>Fecha</TableCell>
                                                                                        <TableCell sx={{ color: '#FFD700', fontWeight: 600 }}>Tipo</TableCell>
                                                                                        <TableCell sx={{ color: '#FFD700', fontWeight: 600 }}>Cantidad</TableCell>
                                                                                        <TableCell sx={{ color: '#FFD700', fontWeight: 600 }}>Stock Antes</TableCell>
                                                                                        <TableCell sx={{ color: '#FFD700', fontWeight: 600 }}>Stock Después</TableCell>
                                                                                        <TableCell sx={{ color: '#FFD700', fontWeight: 600 }}>Motivo</TableCell>
                                                                                        <TableCell sx={{ color: '#FFD700', fontWeight: 600 }}>Usuario</TableCell>
                                                                                    </TableRow>
                                                                                </TableHead>
                                                                                <TableBody>
                                                                                    {producto.movimientos.map((mov) => (
                                                                                        <TableRow key={mov.id_mvin} sx={{ '&:hover': { bgcolor: '#333' } }}>
                                                                                            <TableCell sx={{ color: '#fff' }}>
                                                                {formatFechaChile(mov.fecha)}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                                                    label={mov.tipo_movimiento}
                                                                    size="small"
                                                                    sx={{
                                                                                                        bgcolor: getTipoColor(mov.tipo_movimiento),
                                                                        color: "#fff",
                                                                        fontWeight: 600
                                                                    }}
                                                                />
                                                            </TableCell>
                                                                                            <TableCell sx={{ color: '#fff', fontWeight: 600 }}>
                                                                <span style={{ color: mov.cantidad > 0 ? "#4CAF50" : "#F44336" }}>
                                                                    {mov.cantidad > 0 ? '+' : ''}{mov.cantidad}
                                                                </span>
                                                            </TableCell>
                                                                                            <TableCell sx={{ color: '#fff' }}>
                                                                {mov.stock_antes !== undefined ? mov.stock_antes : ''}
                                                            </TableCell>
                                                                                                                                                                                        <TableCell sx={{ color: '#fff' }}>
                                                                                                {mov.stock_despues !== undefined ? mov.stock_despues : mov.stock_actual}
                                                            </TableCell>
                                                                                            <TableCell sx={{ color: '#fff' }}>
                                                                {mov.motivo || ''}
                                                            </TableCell>
                                                                                            <TableCell sx={{ color: '#fff' }}>
                                                                {mov.usuario_nombre}
                                                            </TableCell>
                                                                                        </TableRow>
                                                                                    ))}
                                                                                </TableBody>
                                                                            </Table>
                                                                        </TableContainer>
                                                                    </Box>
                                                                </Collapse>
                                                            </TableCell>
                                                        </TableRow>
                                                    </React.Fragment>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}

                            {/* Mensaje si no hay productos */}
                            {!loading && !error && productosFiltrados.length === 0 && (
                                    <Box sx={{ textAlign: 'center', p: 4, color: '#666' }}>
                                    <Typography variant="h6">No se encontraron productos con movimientos</Typography>
                                        <Typography variant="body2">Intenta ajustar los filtros o recargar los datos</Typography>
                                    </Box>
                                )}
                            </TableContainerStyled>
                    </Box>
                </DialogContent>
            </Dialog>
            
            {/* Modal de historial detallado de producto */}
            <ProductoHistorialDetalle 
                open={historialProductoOpen}
                productoId={productoSeleccionado}
                onClose={cerrarHistorialProducto}
            />
        </>
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