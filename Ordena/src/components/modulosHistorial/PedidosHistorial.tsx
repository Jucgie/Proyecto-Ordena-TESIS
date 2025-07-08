import React, { useEffect, useState, useMemo } from "react";
import styled from "styled-components";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Select, MenuItem, TextField, Button, Box, Typography, IconButton, Tooltip, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, Tabs, Tab, Grid, Chip
} from "@mui/material";
// Usar solo la importación de Grid desde @mui/material
import {
    FilterAlt as FilterIcon,
    TrendingUp as TrendingUpIcon,
    Refresh as RefreshIcon,
    FileDownload as ExportIcon,
    Search as SearchIcon,
    PictureAsPdf as PdfIcon,
    TableChart as ExcelIcon,
    Download as DownloadIcon
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
import { historialService } from "../../services/historialService";
import axios from 'axios';

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

// 2. AGREGAR función utilitaria para sumar cantidades de productos (mover al inicio)
function getCantidadTotalHistorial(pedido: any) {
    if (!pedido || !Array.isArray(pedido.productos)) return 0;
    return pedido.productos.reduce((acc: number, prod: any) => acc + Number(prod.cantidad || 0), 0);
}

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

export function PedidoHistorial({ setPedido }: Props) {
    const usuario = useAuthStore((state: any) => state.usuario);
    const isBodegaView = usuario?.bodega !== undefined;
    const [busqueda, setBusqueda] = useState("");
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<any>(null);
    const { pedidos, fetchPedidos, loading: loadingHistorial, error } = useHistorialStore();

    console.log('PEDIDOS DEL STORE:', pedidos);
    const [sucursalSeleccionada, setSucursalSeleccionada] = useState("");
    const [usuarioSeleccionada, setUsuarioSeleccionada] = useState("");
    const [showFiltros, setShowFiltros] = useState(false);
    const [showEstadisticas, setShowEstadisticas] = useState(true);
    const [showDetalle, setShowDetalle] = useState(false);
    const [tab, setTab] = useState<'salida' | 'ingreso'>('salida');
    const [timeline, setTimeline] = useState<any[]>([]);
    const [loadingTimeline, setLoadingTimeline] = useState(false);

    useEffect(() => {
        const params: any = {};
        if (usuario?.bodega) {
            params.bodega_id = usuario.bodega;
        } else if (usuario?.sucursal) {
            params.sucursal_id = usuario.sucursal;
        }
        fetchPedidos(params);
    }, [fetchPedidos, usuario]);

    // Filtrado y búsqueda
    const pedidosArray = Array.isArray(pedidos) ? pedidos : [];
    // Ordenar por fecha_entrega descendente (más reciente primero)
    const pedidosOrdenados = [...pedidosArray].sort((a, b) => {
        const fechaA = new Date(a.fecha_entrega).getTime();
        const fechaB = new Date(b.fecha_entrega).getTime();
        return fechaB - fechaA;
    });
    // --- Ajustar filtros para usar los nuevos campos de nombre y tipo ---
    const sucursalesBusqueda = useMemo(() => {
        // Solo strings válidos
        const nombres = pedidosOrdenados.map(p => p.sucursal_nombre).filter((x): x is string => !!x);
        return [...new Set(nombres)];
    }, [pedidosOrdenados]);
    const usuariosBusqueda = useMemo(() => {
        const nombresUs = pedidosOrdenados.map(p => p.usuario_nombre).filter((x): x is string => !!x);
        return [...new Set(nombresUs)];
    }, [pedidosOrdenados]);
    const tiposBusqueda = useMemo(() => {
        const tipos = pedidosOrdenados.map(p => p.tipo).filter(Boolean);
        return [...new Set(tipos)];
    }, [pedidosOrdenados]);

    const pedidosFiltros = useMemo(() => {
        const filtrados = pedidosOrdenados.filter(pedido => {
            const filtroSucursal = sucursalSeleccionada
                ? pedido.sucursal_nombre === sucursalSeleccionada
            : true;
            const filtroUsuario = usuarioSeleccionada
                ? pedido.usuario_nombre === usuarioSeleccionada
            : true;
            const filtroTipo = pedido.tipo === tab;
            const busquedaLower = busqueda.toLowerCase();
            const filtroBusqueda = busquedaLower === ""
            ? true
            : (
                    (pedido.sucursal_nombre || "").toLowerCase().includes(busquedaLower) ||
                (pedido.fecha_entrega || "").toLowerCase().includes(busquedaLower) ||
                    (pedido.usuario_nombre || "").toLowerCase().includes(busquedaLower) ||
                    (pedido.proveedor_nombre || "").toLowerCase().includes(busquedaLower)
                );
            return filtroSucursal && filtroBusqueda && filtroUsuario && filtroTipo;
        });
        console.log('PEDIDOS FILTRADOS:', filtrados);
        return filtrados;
    }, [sucursalSeleccionada, pedidosOrdenados, busqueda, usuarioSeleccionada, tab]);

    // Funciones de exportación mejoradas
    const exportarExcel = () => {
        const datosExportar = pedidosFiltros.map((pedido: any) => ({
            'ID': pedido.id_p,
            'Fecha': formatearFechaHora(pedido.fecha_entrega),
            'Tipo': tab === 'salida' ? 'Sucursal' : 'Proveedor',
            'Destino': tab === 'salida' ? (pedido.sucursal_nombre || '—') : (pedido.proveedor_nombre || '—'),
            'Usuario': pedido.usuario_nombre || '—',
            'Estado': mostrarEstado(pedido),
            'Cantidad Productos': Array.isArray(pedido.detalles_pedido) ? pedido.detalles_pedido.reduce((acc: number, d: any) => acc + Number(d.cantidad), 0) : 0,
            'Descripción': pedido.descripcion || '—'
        }));

        const ws = XLSX.utils.json_to_sheet(datosExportar);
        
        // Estilos mejorados para Excel
        ws['!cols'] = [
            { width: 8 },  // ID
            { width: 12 }, // Fecha
            { width: 12 }, // Tipo
            { width: 20 }, // Destino
            { width: 15 }, // Usuario
            { width: 12 }, // Estado
            { width: 15 }, // Cantidad
            { width: 30 }  // Descripción
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Historial Pedidos ${tab === 'salida' ? 'Salidas' : 'Ingresos'}`);
        XLSX.writeFile(wb, `historial_pedidos_${tab}_${new Date().toISOString().split('T')[0]}.xlsx`);
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
        doc.text(`${tab === 'salida' ? 'Salidas a Sucursales' : 'Ingresos de Proveedores'}`, 20, 30);
        
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
            tab === 'salida' ? (pedido.sucursal_nombre || '—') : (pedido.proveedor_nombre || '—'),
            pedido.usuario_nombre || '—',
            mostrarEstado(pedido),
            Array.isArray(pedido.detalles_pedido) ? pedido.detalles_pedido.reduce((acc: number, d: any) => acc + Number(d.cantidad), 0) : 0
        ]);

        autoTable(doc, {
            head: [['ID', 'Fecha', tab === 'salida' ? 'Sucursal' : 'Proveedor', 'Usuario', 'Estado', 'Cantidad']],
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

        doc.save(`historial_pedidos_${tab}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Nueva función para exportar ambas pestañas juntas
    const exportarAmbasPestanas = () => {
        // Obtener todos los pedidos (salidas e ingresos)
        const todosLosPedidos = pedidosArray.filter(p => p.tipo === 'salida' || p.tipo === 'ingreso');
        const pedidosSalidas = todosLosPedidos.filter(p => p.tipo === 'salida');
        const pedidosIngresos = todosLosPedidos.filter(p => p.tipo === 'ingreso');

        // Hoja TODOS
        const datosTodos = todosLosPedidos.map((pedido: any) => ({
            'ID': pedido.id_p,
            'Fecha': formatearFechaHora(pedido.fecha_entrega),
            'Tipo': pedido.tipo === 'salida' ? 'Salida a Sucursal' : 'Ingreso de Proveedor',
            'Destino': pedido.tipo === 'salida' ? (pedido.sucursal_nombre || '—') : (pedido.proveedor_nombre || '—'),
            'Usuario': pedido.usuario_nombre || '—',
            'Estado': mostrarEstado(pedido),
            'Cantidad Productos': Array.isArray(pedido.detalles_pedido) ? pedido.detalles_pedido.reduce((acc: number, d: any) => acc + Number(d.cantidad), 0) : 0,
            'Descripción': pedido.descripcion || '—'
        }));

        // Hoja SALIDAS
        const datosSalidas = pedidosSalidas.map((pedido: any) => ({
            'ID': pedido.id_p,
            'Fecha': formatearFechaHora(pedido.fecha_entrega),
            'Sucursal': pedido.sucursal_nombre || '—',
            'Usuario': pedido.usuario_nombre || '—',
            'Estado': mostrarEstado(pedido),
            'Cantidad Productos': Array.isArray(pedido.detalles_pedido) ? pedido.detalles_pedido.reduce((acc: number, d: any) => acc + Number(d.cantidad), 0) : 0,
            'Descripción': pedido.descripcion || '—'
        }));

        // Hoja INGRESOS
        const datosIngresos = pedidosIngresos.map((pedido: any) => ({
            'ID': pedido.id_p,
            'Fecha': formatearFechaHora(pedido.fecha_entrega),
            'Proveedor': pedido.proveedor_nombre || '—',
            'Usuario': pedido.usuario_nombre || '—',
            'Estado': mostrarEstado(pedido),
            'Cantidad Productos': Array.isArray(pedido.detalles_pedido) ? pedido.detalles_pedido.reduce((acc: number, d: any) => acc + Number(d.cantidad), 0) : 0,
            'Descripción': pedido.descripcion || '—'
        }));

        // Crear hojas
        const wsTodos = XLSX.utils.json_to_sheet(datosTodos);
        wsTodos['!cols'] = [
            { width: 8 },  // ID
            { width: 12 }, // Fecha
            { width: 20 }, // Tipo
            { width: 25 }, // Destino
            { width: 15 }, // Usuario
            { width: 12 }, // Estado
            { width: 15 }, // Cantidad
            { width: 30 }  // Descripción
        ];
        const wsSalidas = XLSX.utils.json_to_sheet(datosSalidas);
        wsSalidas['!cols'] = [
            { width: 8 },  // ID
            { width: 12 }, // Fecha
            { width: 25 }, // Sucursal
            { width: 15 }, // Usuario
            { width: 12 }, // Estado
            { width: 15 }, // Cantidad
            { width: 30 }  // Descripción
        ];
        const wsIngresos = XLSX.utils.json_to_sheet(datosIngresos);
        wsIngresos['!cols'] = [
            { width: 8 },  // ID
            { width: 12 }, // Fecha
            { width: 25 }, // Proveedor
            { width: 15 }, // Usuario
            { width: 12 }, // Estado
            { width: 15 }, // Cantidad
            { width: 30 }  // Descripción
        ];

        // Crear libro y agregar hojas
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, wsTodos, 'Todos');
        XLSX.utils.book_append_sheet(wb, wsSalidas, 'Salidas');
        XLSX.utils.book_append_sheet(wb, wsIngresos, 'Ingresos');
        XLSX.writeFile(wb, `historial_completo_pedidos_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportarAmbasPestanasPDF = () => {
        const doc = new jsPDF();
        
        // Título principal
        doc.setFontSize(20);
        doc.setTextColor(0, 0, 0);
        doc.text('Historial Completo de Pedidos', 20, 20);
        
        // Subtítulo
        doc.setFontSize(14);
        doc.setTextColor(100, 100, 100);
        doc.text('Salidas e Ingresos - Bodega', 20, 30);
        
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
        
        // Obtener todos los pedidos
        const todosLosPedidos = pedidosArray.filter(p => p.tipo === 'salida' || p.tipo === 'ingreso');
        
        // Estadísticas
        doc.setTextColor(0, 0, 0);
        doc.text(`Total de registros: ${todosLosPedidos.length}`, 20, 50);
        
        let currentY = 60;
        
        // SECCIÓN 1: SALIDAS A SUCURSALES
        const pedidosSalida = todosLosPedidos.filter(p => p.tipo === 'salida');
        if (pedidosSalida.length > 0) {
            // Título de sección
            doc.setFontSize(16);
            doc.setTextColor(0, 100, 200);
            doc.text('SALIDAS A SUCURSALES', 20, currentY);
            currentY += 10;
            
            // Estadísticas de la sección
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Total salidas: ${pedidosSalida.length}`, 20, currentY);
            currentY += 15;
            
            // Tabla de salidas
            const datosSalida = pedidosSalida.map((pedido: any) => [
                    pedido.id_p,
                formatearFechaHora(pedido.fecha_entrega),
                pedido.sucursal_nombre || '—',
                pedido.usuario_nombre || '—',
                mostrarEstado(pedido),
                Array.isArray(pedido.detalles_pedido) ? pedido.detalles_pedido.reduce((acc: number, d: any) => acc + Number(d.cantidad), 0) : 0
            ]);

        autoTable(doc, {
                head: [['ID', 'Fecha', 'Sucursal', 'Usuario', 'Estado', 'Cantidad']],
                body: datosSalida,
                startY: currentY,
                styles: {
                    headStyle: { 
                        fillColor: [0, 100, 200], 
                        textColor: [255, 255, 255],
                        fontStyle: 'bold',
                        fontSize: 11
                    },
                    bodyStyle: { 
                        textColor: [0, 0, 0],
                        fontSize: 10
                    }
                },
                alternateRowStyles: { fillColor: [240, 248, 255] },
                margin: { top: 5, right: 10, bottom: 10, left: 10 },
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
            
            // Obtener la posición Y después de la tabla
            currentY = (doc as any).lastAutoTable.finalY + 20;
        }
        
        // SECCIÓN 2: INGRESOS DE PROVEEDORES
        const pedidosIngreso = todosLosPedidos.filter(p => p.tipo === 'ingreso');
        if (pedidosIngreso.length > 0) {
            // Título de sección
            doc.setFontSize(16);
            doc.setTextColor(200, 100, 0);
            doc.text('INGRESOS DE PROVEEDORES', 20, currentY);
            currentY += 10;
            
            // Estadísticas de la sección
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Total ingresos: ${pedidosIngreso.length}`, 20, currentY);
            currentY += 15;
            
            // Tabla de ingresos
            const datosIngreso = pedidosIngreso.map((pedido: any) => [
                pedido.id_p,
                formatearFechaHora(pedido.fecha_entrega),
                pedido.proveedor_nombre || '—',
                pedido.usuario_nombre || '—',
                mostrarEstado(pedido),
                Array.isArray(pedido.detalles_pedido) ? pedido.detalles_pedido.reduce((acc: number, d: any) => acc + Number(d.cantidad), 0) : 0
            ]);

            autoTable(doc, {
                head: [['ID', 'Fecha', 'Proveedor', 'Usuario', 'Estado', 'Cantidad']],
                body: datosIngreso,
                startY: currentY,
                styles: {
                    headStyle: { 
                        fillColor: [200, 100, 0], 
                        textColor: [255, 255, 255],
                        fontStyle: 'bold',
                        fontSize: 11
                    },
                    bodyStyle: { 
                        textColor: [0, 0, 0],
                        fontSize: 10
                    }
                },
                alternateRowStyles: { fillColor: [255, 248, 240] },
                margin: { top: 5, right: 10, bottom: 10, left: 10 },
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
            
            // Obtener la posición Y después de la tabla
            currentY = (doc as any).lastAutoTable.finalY + 20;
        }
        
        // SECCIÓN 3: DETALLE DE PRODUCTOS POR PEDIDO
        doc.setFontSize(16);
        doc.setTextColor(0, 100, 0);
        doc.text('DETALLE DE PRODUCTOS POR PEDIDO', 20, currentY);
        currentY += 15;
        
        // Iterar por cada pedido para mostrar sus productos
        todosLosPedidos.forEach((pedido: any, index: number) => {
            if (Array.isArray(pedido.detalles_pedido) && pedido.detalles_pedido.length > 0) {
                // Título del pedido
                doc.setFontSize(12);
                doc.setTextColor(0, 0, 0);
                const tipoPedido = pedido.tipo === 'salida' ? 'SALIDA' : 'INGRESO';
                doc.text(`Pedido ID: ${pedido.id_p} (${tipoPedido}) - ${formatearFechaHora(pedido.fecha_entrega)}`, 20, currentY);
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
                        0: { cellWidth: 60 },
                        1: { cellWidth: 20 },
                        2: { cellWidth: 25 },
                        3: { cellWidth: 25 }
                    }
                });
                
                // Obtener la posición Y después de la tabla de productos
                currentY = (doc as any).lastAutoTable.finalY + 10;
                
                // Agregar espacio entre pedidos
                if (index < todosLosPedidos.length - 1) {
                    currentY += 5;
                }
            }
        });

        doc.save(`historial_completo_pedidos_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // --- Tabs visuales para alternar entre salidas e ingresos ---
    const pedidosTipo = pedidosArray.filter(p => p.tipo === tab);

    // --- Función para obtener el timeline de un pedido ---
    const fetchTimeline = async (pedidoId: number) => {
        setLoadingTimeline(true);
        try {
            const resp = await axios.get(`/api/pedidos/${pedidoId}/historial-estado/`);
            // Forzar a array aunque la respuesta sea objeto o null
            setTimeline(Array.isArray(resp.data) ? resp.data : []);
        } catch (e) {
            setTimeline([]);
        } finally {
            setLoadingTimeline(false);
        }
    };

    // Función para mostrar el estado visualmente corregido solo para ingresos en bodega
    const mostrarEstado = (pedido: any) => {
        if (tab === 'ingreso' && isBodegaView) {
            return 'Completado';
        }
        return pedido.estado_pedido_nombre || '—';
    };

    // --- Renderizado ---
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
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {/* Botones de exportar completos (solo para bodega) */}
                    {isBodegaView && (
                        <>
                            <Tooltip title="Exportar ambas pestañas a Excel">
                                <Button 
                                    onClick={exportarAmbasPestanas} 
                                    variant="contained" 
                                    startIcon={<ExcelIcon />}
                                    sx={{ 
                                        bgcolor: '#4CAF50', 
                                        color: '#fff',
                                        '&:hover': { bgcolor: '#45a049' },
                                        fontWeight: 600
                                    }}
                                >
                                    📊 Excel Completo
                    </Button>
                            </Tooltip>
                            <Tooltip title="Exportar ambas pestañas a PDF">
                                <Button 
                                    onClick={exportarAmbasPestanasPDF} 
                                    variant="contained" 
                                    startIcon={<PdfIcon />}
                                    sx={{ 
                                        bgcolor: '#F44336', 
                                        color: '#fff',
                                        '&:hover': { bgcolor: '#d32f2f' },
                                        fontWeight: 600
                                    }}
                                >
                                    📄 PDF Completo
                    </Button>
                            </Tooltip>
                        </>
                    )}
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
                                    <StatCard color="#FFD700" icon="📦" title="Total Pedidos" valor={pedidosFiltros.length} subtitulo="" />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <StatCard color="#4CAF50" icon="✅" title="Entregados" valor={pedidosFiltros.filter(p => typeof p.estado_pedido_fk === 'object' && p.estado_pedido_fk !== null && 'nombre' in p.estado_pedido_fk && (p.estado_pedido_fk.nombre === 'Entregado' || p.estado_pedido_fk.nombre === 'Completado')).length} subtitulo="" />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <StatCard color="#FF9800" icon="⏳" title="Pendientes" valor={pedidosFiltros.filter(p => typeof p.estado_pedido_fk === 'object' && p.estado_pedido_fk !== null && 'nombre' in p.estado_pedido_fk && p.estado_pedido_fk.nombre === 'Pendiente').length} subtitulo="" />
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
                            <Tooltip title="Mostrar/Ocultar Estadísticas">
                                <IconButton onClick={() => setShowEstadisticas(!showEstadisticas)} sx={{ color: "#FFD700" }}>
                                    <TrendingUpIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Exportar pestaña actual a Excel">
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
                            <Tooltip title="Exportar pestaña actual a PDF">
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
                                        {sucursalesBusqueda.map((sucursal: string) => (
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
                                        {usuariosBusqueda.map((usuario: string) => (
                                <MenuItem key={usuario} value={usuario}>{usuario}</MenuItem>
                            ))}
                                    </TextField>
                                </Grid>
                            </Grid>
                        </FiltrosCard>
                    )}

                    {/* --- Tabs visuales para alternar entre salidas e ingresos --- */}
                        <Tabs
                            value={tab}
                            onChange={(_, v) => setTab(v)}
                            TabIndicatorProps={{ style: { backgroundColor: '#FFD700', height: 4, borderRadius: 2 } }}
                        sx={{ mb: 3, '& .MuiTab-root': { color: '#fff', fontWeight: 400 }, '& .Mui-selected': { color: '#FFD700 !important', fontWeight: 700 } }}
                        >
                        <Tab label="Salidas" value="salida" />
                        <Tab label="Ingresos" value="ingreso" />
                        </Tabs>

                    {/* Tabla de pedidos */}
                        <TableContainer component={Paper} sx={{ bgcolor: '#232323', borderRadius: 2, maxHeight: '50vh' }}>
                            <Table stickyHeader>
                                <TableHead sx={{ bgcolor: '#232323' }}>
                                    <TableRow>
                                        <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#232323' }}>ID</TableCell>
                                        <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#232323' }}>Fecha</TableCell>
                                    {tab === 'salida' ? (
                                        <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#232323' }}>Sucursal</TableCell>
                                    ) : (
                                        <TableCell sx={{ color: "#FFD700", fontWeight: 700, background: '#232323' }}>Proveedor</TableCell>
                                    )}
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
                                            {tab === 'salida' ? (
                                                <TableCell sx={{ color: '#fff' }}>{pedido.sucursal_nombre || '—'}</TableCell>
                                            ) : (
                                                <TableCell sx={{ color: '#fff' }}>{pedido.proveedor_nombre || '—'}</TableCell>
                                            )}
                                            <TableCell sx={{ color: '#fff' }}>{pedido.usuario_nombre || '—'}</TableCell>
                                                <TableCell>
                                                <Chip
                                                    label={mostrarEstado(pedido)}
                                                    sx={{
                                                        bgcolor:
                                                            mostrarEstado(pedido) === 'Completado'
                                                                ? '#4CAF50'
                                                                : mostrarEstado(pedido) === 'En camino'
                                                                ? '#2196F3'
                                                                : mostrarEstado(pedido) === 'Pendiente'
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
                                                        fetchTimeline(pedido.id_p);
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