import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, Box, Typography, Chip, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow
} from "@mui/material";

// Helper function to format date safely
function formatFechaLegible(fecha: string) {
    if (!fecha) return '-';
    // Avoid invalid date error
    try {
        const d = new Date(fecha);
        if (isNaN(d.getTime())) return fecha.split('T')[0] || '-'; // Fallback for partial dates
        return d.toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
        return fecha; // Return original string if parsing fails
    }
}

interface PedidoDetalleModalProps {
    open: boolean;
    onClose: () => void;
    pedido: any; // Usamos 'any' para flexibilidad entre diferentes fuentes de datos
}

export default function PedidoDetalleModal({ open, onClose, pedido }: PedidoDetalleModalProps) {
    if (!pedido) return null;

    // Unificamos el acceso a los datos del pedido para que funcione en cualquier página
    const id = pedido.id || pedido.id_p;
    const fecha = pedido.fecha || pedido.fecha_entrega;
    const responsable = pedido.responsable || pedido.usuario_nombre || pedido.personal_entrega_nombre || '-';
    const estado = pedido.estado || pedido.estado_pedido_nombre || "Pendiente";
    const proveedor = pedido.proveedor?.nombre || pedido.proveedor_nombre || '-';
    const sucursal = pedido.sucursal_nombre || pedido.sucursalDestino || '-';
    const esIngreso = !!(pedido.proveedor_fk || pedido.proveedor_nombre);
    const productos = pedido.productos || pedido.detalles_pedido || [];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{
                background: "linear-gradient(135deg, #232323 0%, #1a1a1a 100%)",
                color: "#FFD700",
                borderBottom: "2px solid #FFD700",
                fontWeight: 600
            }}>
                📋 Detalles del Pedido #{id}
            </DialogTitle>
            <DialogContent sx={{ bgcolor: "#1a1a1a", color: "#fff", p: 3 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 3, p: 2, bgcolor: "#232323", borderRadius: 2,color:'white' }}>
                    <TextField label="ID del Pedido" value={id} InputProps={{ readOnly: true, sx: {color: "#FFD700" } }} 
                    sx={{"& .MuiInputLabel-root": { color: "#ccc" }, "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: "#444" }, "&:hover fieldset": { borderColor: "#FFD700" } } }}/>
                    <TextField label="Fecha" value={formatFechaLegible(fecha)} InputProps={{ readOnly: true, sx: { color: "#fff" } }} 
                    sx={{"& .MuiInputLabel-root": { color: "#ccc" }, "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: "#444" }, "&:hover fieldset": { borderColor: "#FFD700" } }}} />
                    <TextField label="Responsable" value={responsable} InputProps={{ readOnly: true, sx: { color: "#fff" } }} 
                    sx={{"& .MuiInputLabel-root": { color: "#ccc" }, "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: "#444" }, "&:hover fieldset": { borderColor: "#FFD700" } }}}/>
                    <TextField
                        label={esIngreso ? "Proveedor" : "Sucursal destino"}
                        value={esIngreso ? proveedor : sucursal}
                        InputProps={{ readOnly: true, sx: { color: "#fff" } }}
                    sx={{"& .MuiInputLabel-root": { color: "#ccc" }, "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: "#444" }, "&:hover fieldset": { borderColor: "#FFD700" } }}}
                    />
                </Box>

                <Box sx={{ mb: 3, p: 2, bgcolor: "#232323", borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: "#ccc", mb: 1 }}>Estado del pedido</Typography>
                    <Chip
                        label={estado}
                        sx={{
                            bgcolor: estado === "Completado" ? "#4CAF50" :
                                     estado === "En camino" ? "#2196F3" :
                                     estado === "Cancelado" ? "#f44336" : "#FF9800",
                            color: "#fff", fontWeight: 600
                        }}
                    />
                </Box>

                <Box sx={{ p: 2, bgcolor: "#232323", borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ color: "#FFD700", mb: 2 }}>
                        📦 Productos del pedido ({productos.length})
                    </Typography>
                    {productos.length === 0 ? (
                        <Typography sx={{ color: "#8A8A8A", fontStyle: "italic", textAlign: "center" }}>
                            No hay productos en este pedido.
                        </Typography>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ color: "#FFD700", fontWeight: 600 }}>Producto</TableCell>
                                        <TableCell sx={{ color: "#FFD700", fontWeight: 600 }} align="right">Cantidad</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {productos.map((prod: any, idx: number) => (
                                        <TableRow key={idx} sx={{ "&:hover": { bgcolor: "#2a2a2a" } }}>
                                            <TableCell sx={{ color: "#fff" }}>
                                                {prod.nombre || prod.producto_nombre || 'N/A'}
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: "#FFD700", fontWeight: 600 }}>
                                                {prod.cantidad || prod.cantidad_solicitada || 0}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ bgcolor: "#1a1a1a", borderTop: "1px solid #333", p: 2 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    sx={{ color: "#FFD700", borderColor: "#FFD700", "&:hover": { bgcolor: "rgba(255, 215, 0, 0.1)" } }}
                >
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
}