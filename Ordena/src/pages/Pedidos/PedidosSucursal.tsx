import React, { useState, useMemo, useEffect, useRef } from "react";
import Layout from "../../components/layout/layout";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, TextField,
    Box, Typography, Chip
} from "@mui/material";
import VisibilityIcon from '@mui/icons-material/Visibility';
import DescriptionIcon from '@mui/icons-material/Description';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useBodegaStore } from "../../store/useBodegaStore";
import { generarGuiaDespacho } from "../../utils/pdf/generarGuiaDespacho";
import { useAuthStore } from "../../store/useAuthStore";
import { SUCURSALES } from "../../constants/ubicaciones";
import { generarActaRecepcion } from "../../utils/pdf/generarActaRecepcion";
import { generarOCI } from "../../utils/pdf/generarOCI";
import EstadoBadge from "../../components/EstadoBadge";
import { pedidosService } from "../../services/api";
import { useInventariosStore } from "../../store/useProductoStore";

export default function PedidosSucursal() {
    const { pedidos, updatePedido, addPedido, clearPedidos } = useBodegaStore();
    const usuario = useAuthStore(state => state.usuario);
    const [estado, setEstado] = useState("");
    const [fecha, setFecha] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const hasLoaded = useRef(false);
    const fetchProductos = useInventariosStore(state => state.fetchProductos);

    const sucursalActualId = usuario?.sucursal || "";
    
    
    // Cargar pedidos desde la base de datos al montar el componente
    useEffect(() => {
        
        // Evitar cargas múltiples
        if (hasLoaded.current || !sucursalActualId) {
            return;
        }
        
        fetchPedidosSucursal();
    }, [sucursalActualId]);

    const fetchPedidosSucursal = async () => {
        
        if (!sucursalActualId) {
            setLoading(false);
            return;
        }

        // Marcar como cargado para evitar cargas múltiples
        hasLoaded.current = true;

        try {
            setLoading(true);
            
            // Limpiar el store antes de cargar nuevos pedidos
            clearPedidos();
            
            // Obtener pedidos desde la base de datos filtrados por sucursal destino
            const pedidosDB = await pedidosService.getPedidos({ 
                sucursal_id: sucursalActualId.toString() 
            });
            
            // Transformar los datos de la BD al formato esperado por el frontend
            const pedidosTransformados = pedidosDB.map((pedidoDB: any) => {
                const productos = pedidoDB.detalles_pedido?.map((detalle: any) => {
                    return {
                        nombre: detalle.producto_nombre || "Producto",
                        cantidad: detalle.cantidad,
                        codigo: detalle.producto_codigo || ""
                    };
                }) || [];
                
                return {
                    id: pedidoDB.id_p,
                    tipo: "salida",
                    fecha: new Date(pedidoDB.fecha_entrega).toISOString().slice(0, 10),
                    responsable: pedidoDB.usuario_nombre || "Responsable Bodega",
                    productos: productos,
                    sucursalDestino: pedidoDB.sucursal_fk?.toString() || "",
                    cantidad: productos.reduce((acc: number, prod: any) => acc + Number(prod.cantidad), 0),
                    asignado: pedidoDB.personal_entrega_nombre || "Sin asignar",
                    estado: pedidoDB.estado_pedido_nombre || "Pendiente",
                    observaciones: pedidoDB.descripcion || "",
                    ociAsociada: pedidoDB.solicitud_id?.toString() || "",
                    bodegaOrigen: pedidoDB.bodega_nombre || "Bodega Central",
                    direccionBodega: pedidoDB.bodega_direccion || "",
                    direccionSucursal: pedidoDB.sucursal_direccion || "",
                    patenteVehiculo: pedidoDB.personal_entrega_patente || "N/A"
                };
            });
            
            // Agregar todos los pedidos al store de una vez
            pedidosTransformados.forEach((pedido: any, index: number) => {
                addPedido(pedido);
            });
            
        } catch (error) {
            console.error("Error al cargar pedidos de la sucursal:", error);
        } finally {
            setLoading(false);
        }
    };

    // Función temporal para limpiar localStorage
    const handleLimpiarLocalStorage = () => {
        limpiarLocalStorageBodega();
        verificarLocalStorage();
        // Recargar la página para aplicar los cambios
        window.location.reload();
    };
    
    const pedidosFiltrados = useMemo(() => {
        
        const filtrados = pedidos.filter((row) => {
            const esSalida = row.tipo === "salida";
            const coincideSucursal = String(row.sucursalDestino) === String(sucursalActualId);
            const coincideEstado = estado === "" || row.estado === estado;
            const coincideFecha = fecha === "" || row.fecha === fecha;
            
            return esSalida && coincideSucursal && coincideEstado && coincideFecha;
        });
        return filtrados;
    }, [pedidos, sucursalActualId, estado, fecha]);

    const handleConfirmarRecepcion = async (id: number) => {
        try {
            // Confirmar recepción usando el nuevo endpoint
            const resultado = await pedidosService.confirmarRecepcion(id.toString());
            
        const pedido = pedidos.find((p: any) => p.id === id);
        if (pedido) {
            // Buscar sucursal receptora
            const sucursal = SUCURSALES.find(s => s.id === pedido.sucursalDestino);
            // Generar productos recibidos
            const productos = (pedido.productos || []).map((prod: any, idx: number) => ({
                codigo: prod.codigo || `P${idx + 1}`,
                descripcion: prod.nombre || prod.descripcion || "-",
                cantidad: prod.cantidad || 0,
            }));

            generarActaRecepcion({
                numeroActa: String(pedido.id),
                fechaRecepcion: pedido.fecha,
                sucursal: {
                    nombre: sucursal?.nombre || pedido.sucursalDestino || "-",
                    direccion: sucursal?.direccion || pedido.direccionSucursal || "-",
                },
                personaRecibe: {
                    nombre: usuario?.nombre || "-",
                    cargo: usuario?.rol || "-",
                },
                productos,
                observaciones: pedido.observacion || pedido.observaciones || "",
                conformidad: "Recibido conforme",
                responsable: usuario?.nombre || "-",
            });
        }
            
            // Mostrar mensaje de éxito con los productos agregados
            if (resultado.productos_agregados && resultado.productos_agregados.length > 0) {
                const productosText = resultado.productos_agregados
                    .map((p: any) => `${p.producto}: ${p.cantidad} unidades`)
                    .join('\n');
                alert(`¡Recepción confirmada exitosamente!\n\nProductos agregados al inventario:\n${productosText}`);
            } else {
                alert("¡Recepción confirmada exitosamente!");
            }
            
            // Actualizar el estado local
        updatePedido(id, { estado: "Completado" });
            
            // Recargar pedidos para sincronizar
            await fetchPedidosSucursal();
            // Refrescar inventario de la sucursal
            if (sucursalActualId) {
                console.log("🔍 DEBUG - PedidosSucursal - Llamando a fetchProductos con sucursalActualId:", sucursalActualId);
                await fetchProductos(sucursalActualId.toString());
                console.log("🔍 DEBUG - PedidosSucursal - fetchProductos completado");
            } else {
                console.log("🔍 DEBUG - PedidosSucursal - No hay sucursalActualId, no se refresca inventario");
            }
            
        } catch (error: any) {
            console.error("Error al confirmar recepción:", error);
            const mensaje = error.response?.data?.error || "Error al confirmar la recepción. Por favor, intente de nuevo.";
            alert(mensaje);
        }
    };
    
    const handleOpenModal = (pedido: any) => {
        setPedidoSeleccionado(pedido);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setPedidoSeleccionado(null);
    };

    if (loading) {
        return (
            <Layout>
                <div style={{
                    padding: "24px",
                    maxWidth: "1200px",
                    margin: "0 auto",
                    width: "100%",
                    boxSizing: "border-box",
                    textAlign: "center"
                }}>
                    <h2 style={{ color: "#FFD700" }}>Cargando pedidos...</h2>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div style={{
                padding: "24px",
                maxWidth: "1200px",
                margin: "0 auto",
                width: "100%",
                boxSizing: "border-box"
            }}>
                {/* Barra superior de la tabla */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "24px",
                        borderBottom: "1.5px solid #232323",
                        paddingBottom: "8px"
                    }}
                >
                    <h2 style={{ color: "#FFD700", margin: 0 }}>Pedidos asignados a mi sucursal</h2>
                    {/* Filtros */}
                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                        {/* Botón temporal para limpiar localStorage */}
                        <Button
                            variant="outlined"
                            onClick={handleLimpiarLocalStorage}
                            style={{
                                borderColor: "#ff4444",
                                color: "#ff4444",
                                fontWeight: 600
                            }}
                        >
                            Limpiar Cache
                        </Button>
                        <FormControl
                            size="small"
                            variant="outlined"
                            sx={{
                                minWidth: 120,
                                height: 40,
                                fontWeight: 600,
                                '& .MuiOutlinedInput-root': {
                                    color: "#FFFFFF",
                                    fontWeight: 600,
                                    '& fieldset': {
                                        borderColor: "#949494",
                                        borderWidth: 1.5,
                                    },
                                },
                                '& .MuiInputLabel-root': {
                                    color: "#FFFFFF",
                                    fontWeight: 600,
                                },
                                '& .MuiSvgIcon-root': {
                                    color: "#FFFFFF",
                                }
                            }}
                        >
                            <InputLabel>Estado</InputLabel>
                            <Select
                                label="Estado"
                                value={estado}
                                onChange={e => setEstado(e.target.value)}
                            >
                                <MenuItem value=""><em>Todos</em></MenuItem>
                                <MenuItem value="Completado">Completado</MenuItem>
                                <MenuItem value="En camino">En camino</MenuItem>
                                <MenuItem value="Pendiente">Pendiente</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            size="small"
                            label="Fecha"
                            type="date"
                            value={fecha}
                            onChange={e => setFecha(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                minWidth: 140,
                                '& .MuiOutlinedInput-root': {
                                    color: "#FFFFFF",
                                    fontWeight: 600,
                                    '& fieldset': {
                                        borderColor: "#949494",
                                        borderWidth: 1.5,
                                    },
                                },
                                '& .MuiInputLabel-root': {
                                    color: "#FFFFFF",
                                    fontWeight: 600,
                                },
                            }}
                        />
                        <Button
                            variant="outlined"
                            onClick={fetchPedidosSucursal}
                            style={{
                                borderColor: "#FFD700",
                                color: "#FFD700",
                                fontWeight: 600
                            }}
                        >
                            Actualizar
                        </Button>
                    </div>
                </div>
                <TableContainer component={Paper} style={{ background: "#181818" }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>ID</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Fecha</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Asignado a entrega</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Sucursal destino</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>N° de productos</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Estado</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Acción</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {pedidosFiltrados.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" style={{ color: "#8A8A8A" }}>
                                        No hay registros para mostrar.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pedidosFiltrados.map((row: any, index: number) => (
                                    <TableRow key={`${row.id}-${row.fecha}-${index}`}>
                                        <TableCell style={{ color: "#fff" }}>{row.id}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>{row.fecha}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>{row.asignado || "-"}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>
                                            {SUCURSALES.find(s => s.id === row.sucursalDestino)?.nombre || row.sucursalDestino || "-"}
                                        </TableCell>
                                        <TableCell style={{ color: "#fff" }}>
                                            {Array.isArray(row.productos)
                                                ? row.productos.reduce((acc: any, prod: any) => acc + Number(prod.cantidad), 0)
                                                : row.cantidad || 0}
                                        </TableCell>
                                        <TableCell>
                                            <EstadoBadge 
                                                estado={row.estado || "pendiente"} 
                                                tipo="pedido"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {row.estado === "En camino" && (
                                                <Button
                                                    variant="contained"
                                                    color="success"
                                                    style={{ background: "#FFD700", color: "#232323", fontWeight: 600 }}
                                                    onClick={() => handleConfirmarRecepcion(row.id)}
                                                >
                                                    Confirmar recepción
                                                </Button>
                                            )}
                                            {row.estado === "Completado" && (
                                                <span style={{ color: "#FFD700", fontWeight: 600 }}>Recibido</span>
                                            )}
                                            <Button
                                                variant="outlined"
                                                startIcon={<VisibilityIcon />}
                                                style={{ borderColor: "#FFD700", color: "#FFD700", marginLeft: 8 }}
                                                onClick={() => handleOpenModal(row)}
                                            >
                                                Ver detalles
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {/* Modal de detalles */}
                <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
                    <DialogTitle sx={{ 
                        background: "linear-gradient(135deg, #232323 0%, #1a1a1a 100%)",
                        color: "#FFD700",
                        borderBottom: "2px solid #FFD700",
                        fontWeight: 600
                    }}>
                        📋 Detalles del Pedido #{pedidoSeleccionado?.id}
                    </DialogTitle>
                    <DialogContent sx={{ bgcolor: "#1a1a1a", color: "#fff" }}>
                        {pedidoSeleccionado && (
                            <>
                                {/* Información principal */}
                                <Box sx={{ 
                                    display: "grid", 
                                    gridTemplateColumns: "1fr 1fr", 
                                    gap: 2, 
                                    mb: 3,
                                    p: 2,
                                    bgcolor: "#232323",
                                    borderRadius: 2,
                                    border: "1px solid #333"
                                }}>
                                <TextField
                                        label="ID del Pedido"
                                    value={pedidoSeleccionado.id}
                                        InputProps={{ 
                                            readOnly: true,
                                            sx: { color: "#FFD700", fontWeight: 600 }
                                        }}
                                    size="small"
                                        sx={{
                                            "& .MuiInputLabel-root": { color: "#ccc" },
                                            "& .MuiOutlinedInput-root": {
                                                "& fieldset": { borderColor: "#444" },
                                                "&:hover fieldset": { borderColor: "#FFD700" }
                                            }
                                        }}
                                />
                                <TextField
                                        label="Fecha de entrega"
                                    value={pedidoSeleccionado.fecha}
                                        InputProps={{ 
                                            readOnly: true,
                                            sx: { color: "#fff" }
                                        }}
                                    size="small"
                                        sx={{
                                            "& .MuiInputLabel-root": { color: "#ccc" },
                                            "& .MuiOutlinedInput-root": {
                                                "& fieldset": { borderColor: "#444" },
                                                "&:hover fieldset": { borderColor: "#FFD700" }
                                            }
                                        }}
                                />
                                <TextField
                                        label="Responsable de bodega"
                                    value={pedidoSeleccionado.responsable}
                                        InputProps={{ 
                                            readOnly: true,
                                            sx: { color: "#fff" }
                                        }}
                                    size="small"
                                        sx={{
                                            "& .MuiInputLabel-root": { color: "#ccc" },
                                            "& .MuiOutlinedInput-root": {
                                                "& fieldset": { borderColor: "#444" },
                                                "&:hover fieldset": { borderColor: "#FFD700" }
                                            }
                                        }}
                                />
                                <TextField
                                        label="Bodega de origen"
                                        value={pedidoSeleccionado.bodegaOrigen || "Bodega Central"}
                                        InputProps={{ 
                                            readOnly: true,
                                            sx: { color: "#fff" }
                                        }}
                                    size="small"
                                        sx={{
                                            "& .MuiInputLabel-root": { color: "#ccc" },
                                            "& .MuiOutlinedInput-root": {
                                                "& fieldset": { borderColor: "#444" },
                                                "&:hover fieldset": { borderColor: "#FFD700" }
                                            }
                                        }}
                                    />
                                </Box>

                                {/* Estado con badge */}
                                <Box sx={{ mb: 3, p: 2, bgcolor: "#232323", borderRadius: 2, border: "1px solid #333" }}>
                                    <Typography variant="subtitle2" sx={{ color: "#ccc", mb: 1 }}>
                                        Estado del pedido
                                    </Typography>
                                    <Chip
                                        label={pedidoSeleccionado.estado || "Pendiente"}
                                        sx={{
                                            bgcolor: pedidoSeleccionado.estado === "Completado" ? "#4CAF50" : 
                                                    pedidoSeleccionado.estado === "En camino" ? "#2196F3" : 
                                                    pedidoSeleccionado.estado === "Cancelado" ? "#f44336" : "#FF9800",
                                            color: "#fff",
                                            fontWeight: 600,
                                            fontSize: "0.9rem"
                                        }}
                                    />
                                </Box>

                                {/* Información de entrega */}
                                <Box sx={{ mb: 3, p: 2, bgcolor: "#232323", borderRadius: 2, border: "1px solid #333" }}>
                                    <Typography variant="subtitle2" sx={{ color: "#ccc", mb: 1 }}>
                                        🚚 Información de entrega
                                    </Typography>
                                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                                        <TextField
                                            label="Transportista asignado"
                                            value={pedidoSeleccionado.asignado || "Sin asignar"}
                                    InputProps={{
                                                readOnly: true,
                                                sx: { color: "#fff" }
                                            }}
                                            size="small"
                                            sx={{
                                                "& .MuiInputLabel-root": { color: "#ccc" },
                                                "& .MuiOutlinedInput-root": {
                                                    "& fieldset": { borderColor: "#444" },
                                                    "&:hover fieldset": { borderColor: "#FFD700" }
                                                }
                                            }}
                                />
                                <TextField
                                            label="Patente del vehículo"
                                            value={pedidoSeleccionado.patenteVehiculo || "N/A"}
                                            InputProps={{ 
                                                readOnly: true,
                                                sx: { color: "#fff" }
                                            }}
                                    size="small"
                                            sx={{
                                                "& .MuiInputLabel-root": { color: "#ccc" },
                                                "& .MuiOutlinedInput-root": {
                                                    "& fieldset": { borderColor: "#444" },
                                                    "&:hover fieldset": { borderColor: "#FFD700" }
                                                }
                                            }}
                                        />
                                    </Box>
                                </Box>

                                {/* Productos */}
                                <Box sx={{ p: 2, bgcolor: "#232323", borderRadius: 2, border: "1px solid #333" }}>
                                    <Typography variant="h6" sx={{ color: "#FFD700", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                                        📦 Productos del pedido ({pedidoSeleccionado.productos?.length || 0})
                                    </Typography>
                                    
                                    {!pedidoSeleccionado.productos || pedidoSeleccionado.productos.length === 0 ? (
                                        <Box sx={{ 
                                            textAlign: "center", 
                                            py: 3, 
                                            color: "#8A8A8A",
                                            fontStyle: "italic"
                                        }}>
                                            No hay productos en este pedido
                                        </Box>
                                    ) : (
                                        <>
                                            <TableContainer>
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{ color: "#FFD700", fontWeight: 600 }}>Producto</TableCell>
                                                            <TableCell sx={{ color: "#FFD700", fontWeight: 600 }} align="right">Cantidad</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {pedidoSeleccionado.productos.map((prod: any, idx: number) => (
                                                            <TableRow key={idx} sx={{ "&:hover": { bgcolor: "#2a2a2a" } }}>
                                                                <TableCell sx={{ color: "#fff" }}>
                                                                    {prod.nombre || 'N/A'}
                                                                </TableCell>
                                                                <TableCell align="right" sx={{ color: "#FFD700", fontWeight: 600 }}>
                                                                    {prod.cantidad || 0}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                            
                                            {/* Total */}
                                            <Box sx={{ 
                                                mt: 2, 
                                                pt: 2, 
                                                borderTop: "1px solid #444",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center"
                                            }}>
                                                <Typography sx={{ color: "#FFD700", fontWeight: 600, fontSize: "1.1rem" }}>
                                                    Total de productos
                                                </Typography>
                                                <Typography sx={{ color: "#FFD700", fontWeight: 600, fontSize: "1.1rem" }}>
                                                    {pedidoSeleccionado.productos.length} productos • {
                                                        (() => {
                                                            if (!pedidoSeleccionado.productos || !Array.isArray(pedidoSeleccionado.productos)) return 0;
                                                            const total = pedidoSeleccionado.productos.reduce((sum: number, p: any) => {
                                                                const cantidad = Number(p.cantidad || 0);
                                                                return sum + (isNaN(cantidad) ? 0 : cantidad);
                                                            }, 0);
                                                            return isNaN(total) ? 0 : Math.round(total);
                                                        })()
                                                    } unidades
                                                </Typography>
                                            </Box>
                                        </>
                                    )}
                                </Box>

                                {/* Documentos del pedido */}
                                <Box sx={{ p: 2, bgcolor: "#232323", borderRadius: 2, border: "1px solid #333" }}>
                                    <Typography variant="h6" sx={{ color: "#FFD700", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                                        📄 Documentos disponibles
                                    </Typography>
                                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                                        <Button
                                            variant="outlined"
                                            startIcon={<DescriptionIcon />}
                                            sx={{ 
                                                borderColor: "#FFD700", 
                                                color: "#FFD700", 
                                                fontWeight: 600,
                                                "&:hover": {
                                                    borderColor: "#FFD700",
                                                    bgcolor: "rgba(255, 215, 0, 0.1)"
                                                }
                                            }}
                                            onClick={() => generarGuiaDespacho(pedidoSeleccionado)}
                                        >
                                            Guía de Despacho
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            startIcon={<AssignmentTurnedInIcon />}
                                            sx={{ 
                                                borderColor: "#4CAF50", 
                                                color: "#4CAF50", 
                                                fontWeight: 600,
                                                "&:hover": {
                                                    borderColor: "#4CAF50",
                                                    bgcolor: "rgba(76, 175, 80, 0.1)"
                                                }
                                            }}
                                            onClick={() => generarActaRecepcion({
                                                numeroActa: String(pedidoSeleccionado.id),
                                                fechaRecepcion: pedidoSeleccionado.fecha,
                                                sucursal: {
                                                    nombre: SUCURSALES.find(s => s.id === pedidoSeleccionado.sucursalDestino)?.nombre || pedidoSeleccionado.sucursalDestino || "-",
                                                    direccion: SUCURSALES.find(s => s.id === pedidoSeleccionado.sucursalDestino)?.direccion || pedidoSeleccionado.direccionSucursal || "-",
                                                },
                                                personaRecibe: {
                                                    nombre: usuario?.nombre || "-",
                                                    cargo: usuario?.rol || "-",
                                                },
                                                productos: (pedidoSeleccionado.productos || []).map((prod: any, idx: number) => ({
                                                    codigo: prod.codigo || `P${idx + 1}`,
                                                    descripcion: prod.nombre || prod.descripcion || "-",
                                                    cantidad: prod.cantidad || 0,
                                                })),
                                                observaciones: pedidoSeleccionado.observacion || pedidoSeleccionado.observaciones || "",
                                                conformidad: "Recibido conforme",
                                                responsable: usuario?.nombre || "-",
                                            })}
                                        >
                                            Acta de Recepción
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            startIcon={<LocalShippingIcon />}
                                            sx={{ 
                                                borderColor: "#2196F3", 
                                                color: "#2196F3", 
                                                fontWeight: 600,
                                                "&:hover": {
                                                    borderColor: "#2196F3",
                                                    bgcolor: "rgba(33, 150, 243, 0.1)"
                                                }
                                            }}
                                            onClick={() => {
                                                generarOCI({
                                                    numeroOCI: String(pedidoSeleccionado.ociAsociada || pedidoSeleccionado.id),
                                                    fecha: pedidoSeleccionado.fecha,
                                                    sucursal: {
                                                        nombre: SUCURSALES.find(s => s.id === pedidoSeleccionado.sucursalDestino)?.nombre || pedidoSeleccionado.sucursalDestino || "-",
                                                        direccion: SUCURSALES.find(s => s.id === pedidoSeleccionado.sucursalDestino)?.direccion || pedidoSeleccionado.direccionSucursal || "-",
                                                    },
                                                    responsable: pedidoSeleccionado.responsable || "-",
                                                    productos: (pedidoSeleccionado.productos || []).map((prod: any, idx: number) => ({
                                                        codigo: prod.codigo || `P${idx + 1}`,
                                                        descripcion: prod.nombre || prod.descripcion || "-",
                                                        cantidad: prod.cantidad || 0,
                                                    })),
                                                    observaciones: pedidoSeleccionado.observacion || pedidoSeleccionado.observaciones || "",
                                                });
                                            }}
                                        >
                                            Orden de Compra Interna (OCI)
                                        </Button>
                                    </Box>
                                </Box>
                            </>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ 
                        bgcolor: "#1a1a1a", 
                        borderTop: "1px solid #333",
                        p: 2
                    }}>
                        <Button 
                            onClick={handleCloseModal} 
                            sx={{ 
                                color: "#FFD700",
                                borderColor: "#FFD700",
                                "&:hover": {
                                    borderColor: "#FFD700",
                                    bgcolor: "rgba(255, 215, 0, 0.1)"
                                }
                            }}
                            variant="outlined"
                        >
                            Cerrar
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </Layout>
    );
}