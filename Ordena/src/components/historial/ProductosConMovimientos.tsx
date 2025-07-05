import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';
import { productoService } from '../../services/productoService';
import ProductoHistorialDetalle from '../modulosHistorial/ProductoHistorialDetalle';

interface ProductoConMovimientos {
    id_prodc: number;
    nombre_prodc: string;
    codigo_interno: string;
    marca: string;
    categoria: string;
    ubicacion: string;
    stock_actual: number;
    stock_minimo: number;
    stock_maximo: number;
    estadisticas_periodo: {
        entradas: number;
        salidas: number;
        balance: number;
        total_movimientos: number;
    };
    ultimo_movimiento: {
        fecha: string;
        tipo: string;
        cantidad: number;
        usuario: string;
        motivo: string;
    };
    movimientos_recientes: any[];
}

interface Props {
    ubicacionId?: string;
}

export function ProductosConMovimientos({ ubicacionId }: Props) {
    const [productos, setProductos] = useState<ProductoConMovimientos[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoConMovimientos | null>(null);
    const [showHistorialDetalle, setShowHistorialDetalle] = useState(false);

    useEffect(() => {
        cargarProductosConMovimientos();
    }, [ubicacionId]);

    const cargarProductosConMovimientos = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const data = await productoService.getProductosConMovimientosRecientes(ubicacionId, 7, 20);
            setProductos(data.productos || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    const formatFecha = (fecha: string) => {
        return new Date(fecha).toLocaleString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTipoIcono = (tipo: string) => {
        switch (tipo) {
            case 'ENTRADA': return '📥';
            case 'SALIDA': return '📤';
            case 'AJUSTE': return '⚙️';
            default: return '📋';
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

    const abrirHistorialDetalle = (producto: ProductoConMovimientos) => {
        setProductoSeleccionado(producto);
        setShowHistorialDetalle(true);
    };

    if (loading) {
        return (
            <Container>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div>Cargando productos con movimientos recientes...</div>
                </div>
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <div style={{ textAlign: 'center', padding: '20px', color: '#F44336' }}>
                    <div>Error: {error}</div>
                    <button onClick={cargarProductosConMovimientos} style={{ marginTop: '10px' }}>
                        Reintentar
                    </button>
                </div>
            </Container>
        );
    }

    if (productos.length === 0) {
        return (
            <Container>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div>No hay productos con movimientos recientes</div>
                </div>
            </Container>
        );
    }

    return (
        <>
            <Container>
                <Header>
                    <h2>Productos con Movimientos Recientes</h2>
                    <p>Últimos 7 días - {productos.length} productos</p>
                </Header>

                <ProductosGrid>
                    {productos.map((producto) => {
                        const stockStatus = getStockStatus(producto.stock_actual, producto.stock_minimo, producto.stock_maximo);
                        
                        return (
                            <ProductoCard key={producto.id_prodc}>
                                <ProductoHeader>
                                    <ProductoInfo>
                                        <ProductoNombre>{producto.nombre_prodc}</ProductoNombre>
                                        <ProductoCodigo>{producto.codigo_interno}</ProductoCodigo>
                                        <ProductoDetalles>
                                            <span>{producto.marca}</span>
                                            <span>•</span>
                                            <span>{producto.categoria}</span>
                                        </ProductoDetalles>
                                    </ProductoInfo>
                                    <StockStatus color={stockStatus.color}>
                                        {stockStatus.status}
                                    </StockStatus>
                                </ProductoHeader>

                                <ProductoStats>
                                    <StatItem>
                                        <StatLabel>Stock Actual</StatLabel>
                                        <StatValue>{producto.stock_actual}</StatValue>
                                    </StatItem>
                                    <StatItem>
                                        <StatLabel>Ubicación</StatLabel>
                                        <StatValue>{producto.ubicacion}</StatValue>
                                    </StatItem>
                                </ProductoStats>

                                <MovimientosResumen>
                                    <MovimientoItem>
                                        <span>📥 Entradas: {producto.estadisticas_periodo.entradas}</span>
                                    </MovimientoItem>
                                    <MovimientoItem>
                                        <span>📤 Salidas: {producto.estadisticas_periodo.salidas}</span>
                                    </MovimientoItem>
                                    <MovimientoItem>
                                        <span>📊 Balance: {producto.estadisticas_periodo.balance}</span>
                                    </MovimientoItem>
                                </MovimientosResumen>

                                {producto.ultimo_movimiento.fecha && (
                                    <UltimoMovimiento>
                                        <UltimoMovimientoHeader>
                                            <span>Último movimiento:</span>
                                            <span style={{ color: getTipoColor(producto.ultimo_movimiento.tipo) }}>
                                                {getTipoIcono(producto.ultimo_movimiento.tipo)} {producto.ultimo_movimiento.tipo}
                                            </span>
                                        </UltimoMovimientoHeader>
                                        <UltimoMovimientoDetalles>
                                            <span>{producto.ultimo_movimiento.cantidad} unidades</span>
                                            <span>•</span>
                                            <span>{producto.ultimo_movimiento.usuario}</span>
                                            <span>•</span>
                                            <span>{formatFecha(producto.ultimo_movimiento.fecha)}</span>
                                        </UltimoMovimientoDetalles>
                                        {producto.ultimo_movimiento.motivo && (
                                            <UltimoMovimientoMotivo>
                                                Motivo: {producto.ultimo_movimiento.motivo}
                                            </UltimoMovimientoMotivo>
                                        )}
                                    </UltimoMovimiento>
                                )}

                                <Acciones>
                                    <VerHistorialButton onClick={() => abrirHistorialDetalle(producto)}>
                                        Ver Historial Completo
                                    </VerHistorialButton>
                                </Acciones>
                            </ProductoCard>
                        );
                    })}
                </ProductosGrid>
            </Container>

            {showHistorialDetalle && productoSeleccionado && (
                <ProductoHistorialDetalle
                    productoId={productoSeleccionado.id_prodc.toString()}
                    onClose={() => {
                        setShowHistorialDetalle(false);
                        setProductoSeleccionado(null);
                    }}
                />
            )}
        </>
    );
}

const Container = styled.div`
    padding: 20px;
    background: #1E1E1E;
    min-height: 100vh;
`;

const Header = styled.div`
    margin-bottom: 30px;
    text-align: center;
    
    h2 {
        color: ${COLORS.primary};
        margin-bottom: 10px;
        font-size: 28px;
    }
    
    p {
        color: #888;
        font-size: 16px;
    }
`;

const ProductosGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
`;

const ProductoCard = styled.div`
    background: #272626;
    border: 1px solid #191616;
    border-radius: 15px;
    padding: 20px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }
`;

const ProductoHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 15px;
`;

const ProductoInfo = styled.div`
    flex: 1;
`;

const ProductoNombre = styled.h3`
    color: ${COLORS.primary};
    margin: 0 0 5px 0;
    font-size: 18px;
    font-weight: 600;
`;

const ProductoCodigo = styled.div`
    color: #888;
    font-size: 14px;
    margin-bottom: 5px;
`;

const ProductoDetalles = styled.div`
    color: #aaa;
    font-size: 12px;
    display: flex;
    gap: 5px;
    align-items: center;
`;

const StockStatus = styled.div<{ color: string }>`
    background: ${props => props.color}20;
    color: ${props => props.color};
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    border: 1px solid ${props => props.color}40;
`;

const ProductoStats = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 15px;
`;

const StatItem = styled.div`
    text-align: center;
`;

const StatLabel = styled.div`
    color: #888;
    font-size: 12px;
    margin-bottom: 5px;
`;

const StatValue = styled.div`
    color: ${COLORS.primary};
    font-size: 16px;
    font-weight: 600;
`;

const MovimientosResumen = styled.div`
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
    padding: 10px;
    background: #1E1E1E;
    border-radius: 8px;
`;

const MovimientoItem = styled.div`
    color: #aaa;
    font-size: 12px;
    text-align: center;
`;

const UltimoMovimiento = styled.div`
    background: #1E1E1E;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 15px;
`;

const UltimoMovimientoHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 600;
`;

const UltimoMovimientoDetalles = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
    color: #aaa;
    font-size: 12px;
    margin-bottom: 5px;
`;

const UltimoMovimientoMotivo = styled.div`
    color: #888;
    font-size: 11px;
    font-style: italic;
`;

const Acciones = styled.div`
    display: flex;
    justify-content: center;
`;

const VerHistorialButton = styled.button`
    background: ${COLORS.primary};
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background 0.2s ease;
    
    &:hover {
        background: ${COLORS.primaryDark};
    }
`; 