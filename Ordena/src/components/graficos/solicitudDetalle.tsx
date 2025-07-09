import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, Box, Typography, Chip, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow
} from "@mui/material";
import { formatFechaChile } from '../../utils/formatFechaChile';
import { generarOCI } from '../../utils/pdf/generarOCI';

interface SolicitudDetalleModalProps {
    open: boolean;
    onClose: () => void;
    solicitud: any;
}

export default function SolicitudDetalleModal({ open, onClose, solicitud }: SolicitudDetalleModalProps) {
    if (!solicitud) return null;

    const generarOCIFunction = async (solicitud: any) => {
        try {
            await generarOCI(solicitud);
        } catch (error) {
            alert("Error al generar el documento OCI");
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{
                background: "linear-gradient(135deg, #232323 0%, #1a1a1a 100%)",
                color: "#FFD700",
                borderBottom: "2px solid #FFD700",
                fontWeight: 600
            }}>
                📋 Detalles de Solicitud #{solicitud?.id_solc}
            </DialogTitle>
            <DialogContent sx={{ bgcolor: "#1a1a1a", color: "#fff" }}>
                {solicitud && (
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
                                label="N° OCI"
                                value={solicitud.id_solc}
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
                                label="Fecha de emisión"
                                value={formatFechaChile(solicitud.fecha_creacion)}
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
                                label="Sucursal solicitante"
                                value={solicitud.sucursal_nombre || 'N/A'}
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
                                label="Persona solicitante"
                                value={solicitud.usuario_nombre || 'N/A'}
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
                                Estado de la solicitud
                            </Typography>
                            <Chip
                                label={(solicitud.estado || "Pendiente").charAt(0).toUpperCase() + (solicitud.estado || "Pendiente").slice(1)}
                                sx={{
                                    bgcolor: solicitud.estado === "Aprobada" ? "#4CAF50" :
                                        solicitud.estado === "Denegada" ? "#f44336" :
                                            solicitud.estado === "En camino" ? "#2196F3" : "#FF9800",
                                    color: "#fff",
                                    fontWeight: 600,
                                    fontSize: "0.9rem"
                                }}
                            />
                        </Box>

                        {/* Productos */}
                        <Box sx={{ p: 2, bgcolor: "#232323", borderRadius: 2, border: "1px solid #333" }}>
                            <Typography variant="h6" sx={{ color: "#FFD700", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                                📦 Productos solicitados ({solicitud?.productos?.length || 0})
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ color: "#FFD700", fontWeight: 600 }}>Código</TableCell>
                                            <TableCell sx={{ color: "#FFD700", fontWeight: 600 }}>Producto</TableCell>
                                            <TableCell sx={{ color: "#FFD700", fontWeight: 600 }} align="right">Cantidad</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {solicitud?.productos?.map((prod: any, idx: number) => (
                                            <TableRow key={idx} sx={{ "&:hover": { bgcolor: "#2a2a2a" } }}>
                                                <TableCell sx={{ color: "#fff", fontFamily: "monospace" }}>{prod.producto_codigo || 'N/A'}</TableCell>
                                                <TableCell sx={{ color: "#fff" }}>{prod.producto_nombre || 'N/A'}</TableCell>
                                                <TableCell align="right" sx={{ color: "#FFD700", fontWeight: 600 }}>{prod.cantidad}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </>
                )}
            </DialogContent>
            <DialogActions sx={{ bgcolor: "#1a1a1a", borderTop: "1px solid #333", p: 2 }}>
                <Button onClick={onClose} sx={{ color: "#FFD700", borderColor: "#FFD700", "&:hover": { bgcolor: "rgba(255, 215, 0, 0.1)" } }} variant="outlined">
                    Cerrar
                </Button>
                <Button onClick={() => generarOCIFunction(solicitud)} sx={{ color: "#fff", background: "#4CAF50", fontWeight: 600, "&:hover": { background: "#45a049" } }} variant="contained" startIcon={<span>📄</span>}>
                    Generar OCI PDF
                </Button>
            </DialogActions>
        </Dialog>
    );
}

