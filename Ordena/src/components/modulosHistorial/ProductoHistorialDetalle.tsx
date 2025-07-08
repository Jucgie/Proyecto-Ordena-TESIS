import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
    Card, CardContent, Grid, Chip, CircularProgress, Alert, IconButton,
    Paper, Divider
} from '@mui/material';
import {
    Close, TrendingUp, TrendingDown, Settings, History, CheckCircle,
    Warning, Info, ArrowUpward, ArrowDownward
} from '@mui/icons-material';
import { productoService } from '../../services/productoService';
import { formatFechaChile } from '../../utils/formatFechaChile';

interface ProductoHistorialDetalleProps {
    open: boolean;
    productoId: string | null;
    onClose: () => void;
}

interface TimelineItem {
    fecha: string;
    tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
    cantidad: number;
    motivo: string;
    usuario: string;
    stock_antes: number;
    stock_despues: number;
    icono: string;
    color: string;
}

interface ProductoInfo {
    id_prodc: number;
    nombre_prodc: string;
    codigo_interno: string;
    descripcion_prodc: string;
    marca: string;
    categoria: string;
    fecha_creacion: string;
    ubicacion: string;
    stock_actual: number;
    stock_minimo: number;
    stock_maximo: number;
}

interface Estadisticas {
    total_movimientos: number;
    entradas: { cantidad: number; unidades: number };
    salidas: { cantidad: number; unidades: number };
    ajustes: { cantidad: number; unidades: number };
    balance_total: number;
    promedio_movimientos_mes: number;
}

export default function ProductoHistorialDetalle({ open, productoId, onClose }: ProductoHistorialDetalleProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<{
        producto: ProductoInfo;
        timeline: TimelineItem[];
        estadisticas: Estadisticas;
    } | null>(null);

    useEffect(() => {
        if (open && productoId) {
            cargarHistorial();
        }
    }, [open, productoId]);

    const cargarHistorial = async () => {
        if (!productoId) return;
        
        setLoading(true);
        setError(null);
        try {
            console.log('🔄 Cargando historial para producto:', productoId);
            const response = await productoService.getHistorialProducto(productoId);
            console.log('✅ Historial cargado:', response);
            setData(response);
        } catch (err: any) {
            console.error('❌ Error cargando historial:', err);
            setError(err.response?.data?.error || 'Error al cargar el historial');
        } finally {
            setLoading(false);
        }
    };

    const getStockStatus = (stock: number, minimo: number, maximo: number) => {
        if (stock === 0) return { status: 'Sin stock', color: '#F44336', icon: <Warning /> };
        if (stock < minimo) return { status: 'Stock bajo', color: '#FF9800', icon: <Warning /> };
        if (stock > maximo) return { status: 'Stock alto', color: '#2196F3', icon: <Info /> };
        return { status: 'Stock normal', color: '#4CAF50', icon: <CheckCircle /> };
    };

    const getTipoIcon = (tipo: string) => {
        switch (tipo) {
            case 'ENTRADA': return <ArrowUpward sx={{ color: '#4CAF50' }} />;
            case 'SALIDA': return <ArrowDownward sx={{ color: '#F44336' }} />;
            case 'AJUSTE': return <Settings sx={{ color: '#FF9800' }} />;
            default: return <Info />;
        }
    };

    if (!open) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
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
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                bgcolor: '#232323',
                color: '#FFD700',
                fontWeight: 700,
                fontSize: 24,
                p: 3
            }}>
                📊 Historial Detallado del Producto
                <IconButton onClick={onClose} sx={{ color: '#FFD700' }}>
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ bgcolor: '#1E1E1E', color: '#fff', p: 3, overflow: 'auto' }}>
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress sx={{ color: '#FFD700' }} />
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {data && (
                    <Box>
                        {/* Información del Producto */}
                        <Card sx={{ bgcolor: '#2A2A2A', mb: 3, border: '1px solid #333' }}>
                            <CardContent>
                                <Typography variant="h5" sx={{ color: '#FFD700', mb: 2, fontWeight: 700 }}>
                                    {data.producto.nombre_prodc}
                                </Typography>
                                
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
                                            Código: <span style={{ color: '#fff' }}>{data.producto.codigo_interno}</span>
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
                                            Marca: <span style={{ color: '#fff' }}>{data.producto.marca}</span>
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
                                            Categoría: <span style={{ color: '#fff' }}>{data.producto.categoria}</span>
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
                                            Ubicación: <span style={{ color: '#fff' }}>{data.producto.ubicacion}</span>
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            {getStockStatus(data.producto.stock_actual, data.producto.stock_minimo, data.producto.stock_maximo).icon}
                                            <Typography variant="h6" sx={{ ml: 1, color: getStockStatus(data.producto.stock_actual, data.producto.stock_minimo, data.producto.stock_maximo).color }}>
                                                Stock: {data.producto.stock_actual}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
                                            Mínimo: <span style={{ color: '#fff' }}>{data.producto.stock_minimo}</span>
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
                                            Máximo: <span style={{ color: '#fff' }}>{data.producto.stock_maximo}</span>
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#aaa' }}>
                                            Creado: <span style={{ color: '#fff' }}>{formatFechaChile(data.producto.fecha_creacion)}</span>
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Estadísticas */}
                        <Card sx={{ bgcolor: '#2A2A2A', mb: 3, border: '1px solid #333' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ color: '#FFD700', mb: 2, fontWeight: 600 }}>
                                    📈 Estadísticas del Producto
                                </Typography>
                                
                                <Grid container spacing={2}>
                                    <Grid item xs={6} md={3}>
                                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#333', borderRadius: 2 }}>
                                            <Typography variant="h4" sx={{ color: '#4CAF50', fontWeight: 700 }}>
                                                {data.estadisticas.total_movimientos}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#aaa' }}>
                                                Total Movimientos
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#333', borderRadius: 2 }}>
                                            <Typography variant="h4" sx={{ color: '#4CAF50', fontWeight: 700 }}>
                                                {data.estadisticas.entradas.cantidad}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#aaa' }}>
                                                Entradas
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#333', borderRadius: 2 }}>
                                            <Typography variant="h4" sx={{ color: '#F44336', fontWeight: 700 }}>
                                                {data.estadisticas.salidas.cantidad}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#aaa' }}>
                                                Salidas
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#333', borderRadius: 2 }}>
                                            <Typography variant="h4" sx={{ color: '#FF9800', fontWeight: 700 }}>
                                                {data.estadisticas.ajustes.cantidad}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#aaa' }}>
                                                Ajustes
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>

                                <Box sx={{ mt: 3, p: 2, bgcolor: '#333', borderRadius: 2 }}>
                                    <Typography variant="body1" sx={{ color: '#fff', mb: 1 }}>
                                        Balance Total: <span style={{ color: data.estadisticas.balance_total >= 0 ? '#4CAF50' : '#F44336', fontWeight: 600 }}>
                                            {data.estadisticas.balance_total >= 0 ? '+' : ''}{data.estadisticas.balance_total} unidades
                                        </span>
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                                        Promedio de movimientos por mes: {data.estadisticas.promedio_movimientos_mes.toFixed(1)}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Timeline de Movimientos */}
                        <Card sx={{ bgcolor: '#2A2A2A', border: '1px solid #333' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ color: '#FFD700', mb: 2, fontWeight: 600 }}>
                                    📅 Timeline de Movimientos ({data.timeline.length} movimientos)
                                </Typography>

                                {data.timeline.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', p: 4 }}>
                                        <History sx={{ fontSize: 48, color: '#666', mb: 2 }} />
                                        <Typography variant="body1" sx={{ color: '#666' }}>
                                            No hay movimientos registrados para este producto
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{ p: 0 }}>
                                        {data.timeline.map((item, index) => (
                                            <Box key={index} sx={{ mb: 3, display: 'flex', alignItems: 'flex-start' }}>
                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    flexDirection: 'column', 
                                                    alignItems: 'center', 
                                                    mr: 2,
                                                    mt: 1
                                                }}>
                                                    <Box sx={{ 
                                                        width: 40, 
                                                        height: 40, 
                                                        borderRadius: '50%', 
                                                        bgcolor: item.color,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        mb: 1
                                                    }}>
                                                        {getTipoIcon(item.tipo)}
                                                    </Box>
                                                    {index < data.timeline.length - 1 && (
                                                        <Box sx={{ 
                                                            width: 2, 
                                                            height: 40, 
                                                            bgcolor: '#444',
                                                            mb: 1
                                                        }} />
                                                    )}
                                                </Box>
                                                <Paper sx={{ bgcolor: '#333', p: 3, borderRadius: 2, flex: 1 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                                                            {item.tipo} - {item.cantidad} unidades
                                                        </Typography>
                                                        <Chip
                                                            label={formatFechaChile(item.fecha)}
                                                            size="small"
                                                            sx={{ bgcolor: '#555', color: '#fff' }}
                                                        />
                                                    </Box>
                                                    
                                                    <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
                                                        <strong>Motivo:</strong> {item.motivo}
                                                    </Typography>
                                                    
                                                    <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
                                                        <strong>Usuario:</strong> {item.usuario}
                                                    </Typography>
                                                    
                                                    <Divider sx={{ bgcolor: '#555', mb: 2 }} />
                                                    
                                                    <Box sx={{ display: 'flex', gap: 3 }}>
                                                        <Box>
                                                            <Typography variant="body2" sx={{ color: '#888', mb: 0.5 }}>
                                                                Stock antes:
                                                            </Typography>
                                                            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                                                                {item.stock_antes}
                                                            </Typography>
                                                        </Box>
                                                        <Box>
                                                            <Typography variant="body2" sx={{ color: '#888', mb: 0.5 }}>
                                                                Stock después:
                                                            </Typography>
                                                            <Typography variant="h6" sx={{ color: item.tipo === 'ENTRADA' ? '#4CAF50' : item.tipo === 'SALIDA' ? '#F44336' : '#FF9800', fontWeight: 600 }}>
                                                                {item.stock_despues}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Paper>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ bgcolor: '#232323', p: 2 }}>
                <Button onClick={onClose} sx={{ color: '#fff', fontWeight: 600 }}>
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
} 