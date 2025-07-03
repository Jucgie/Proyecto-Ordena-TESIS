import React, { useState, useMemo, useEffect } from "react";
import Layout from "../../components/layout/layout";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, IconButton, Box, Typography, Chip, TextField
} from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';

import { useBodegaStore } from "../../store/useBodegaStore";
import { generarOCI } from "../../utils/pdf/generarOCI";
import { useAuthStore } from "../../store/useAuthStore";
import { SUCURSALES } from "../../constants/ubicaciones";
import { solicitudesService } from "../../services/api";
import { useInventariosStore } from "../../store/useProductoStore";
import EstadoBadge from "../../components/EstadoBadge";
import { formatFechaChile } from '../../utils/formatFechaChile';

export default function SolicitudesBodega() {
    const {
        solicitudes,
        fetchSolicitudes,
        updateSolicitud,
        addPedido,
        setTransferencias,
        addSolicitudesTransferidas,
        paginaActual,
        totalSolicitudes,
    } = useBodegaStore();
    const usuario = useAuthStore(state => state.usuario);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalConfirmarEliminacion, setModalConfirmarEliminacion] = useState(false);
    const [solicitudAEliminar, setSolicitudAEliminar] = useState<any>(null);
    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [pagina, setPagina] = useState(1);
    
    // Estado para checks
    const [seleccionadas, setSeleccionadas] = useState<number[]>([]);
    // Estado local para cambios antes de confirmar
    const [cambios, setCambios] = useState<Record<number, "aprobada" | "denegada" | undefined>>({});

    const solicitudesFiltradas = useMemo(
    () => Array.isArray(solicitudes) ? solicitudes : [],
    [solicitudes]
    );

    const fetchProductos = useInventariosStore(state => state.fetchProductos);

    // Cargar solicitudes al montar el componente y al cambiar de página
    useEffect(() => {
        console.log('DEBUG - SolicitudesBodega: usuario?.bodega =', usuario?.bodega);
        if (usuario?.bodega) {
            console.log('DEBUG - SolicitudesBodega: Cargando solicitudes para bodega_id =', usuario.bodega.toString());
            setLoading(true);
            fetchSolicitudes({ bodega_id: usuario.bodega.toString(), limit: 20, offset: (pagina - 1) * 20 })
                .finally(() => setLoading(false));
        }
    }, [usuario?.bodega, fetchSolicitudes, pagina]);

    // Debug: verificar las solicitudes cargadas
    console.log('DEBUG - SolicitudesBodega: solicitudes =', solicitudes);
    console.log('DEBUG - SolicitudesBodega: solicitudesFiltradas =', solicitudesFiltradas);

    // Calcular total de páginas
    const totalPaginas = Math.max(1, Math.ceil((totalSolicitudes || solicitudesFiltradas.length) / 20));

    // Función para generar OCI con formato correcto
    const generarOCIFunction = async (solicitud: any) => {
        console.log("Generando OCI para solicitud:", solicitud);
        console.log("Datos de la solicitud recibidos del backend:");
        console.log("- ID:", solicitud.id_solc);
        console.log("- Fecha:", solicitud.fecha_creacion);
        console.log("- Sucursal nombre:", solicitud.sucursal_nombre);
        console.log("- Sucursal dirección:", solicitud.sucursal_direccion);
        console.log("- Sucursal RUT:", solicitud.sucursal_rut);
        console.log("- Usuario nombre:", solicitud.usuario_nombre);
        console.log("- Usuario rol:", solicitud.usuario_rol);
        console.log("- Observación:", solicitud.observacion);
        console.log("- Productos:", solicitud.productos);
        
        // Usar directamente los datos del backend que ya incluyen todos los campos necesarios
        try {
            await generarOCI(solicitud);
        } catch (error) {
            console.error('Error al generar OCI:', error);
            alert("Error al generar el documento OCI");
        }
    };

    // Selección de solicitudes (siempre pueden seleccionarse)
    const handleCheck = (id: number) => {
        setSeleccionadas(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const handleCheckAll = (checked: boolean) => {
        if (checked) {
            setSeleccionadas(solicitudesFiltradas.map(s => s.id_solc));
        } else {
            setSeleccionadas([]);
        }
    };

    // Marcar acción localmente (sin cambiar el estado real hasta confirmar)
    const handleAccion = (tipo: "aprobada" | "denegada") => {
        const nuevosCambios = { ...cambios };
        seleccionadas.forEach(id => {
            nuevosCambios[id] = tipo;
        });
        setCambios(nuevosCambios);
    };

    const handleConfirmar = async () => {
        try {
            // Actualizar solicitudes en el backend
            for (const id of seleccionadas) {
                if (cambios[id]) {
                    await updateSolicitud(id, { estado: cambios[id] });
                }
            }

            // Refrescar inventario de la bodega después de aprobar
            await fetchProductos("bodega_central");

            let transferidasArr: any[] = [];
            seleccionadas.forEach(id => {
                if (cambios[id] === "aprobada") {
                    const solicitud = solicitudes.find(s => s.id_solc === id);
                    if (solicitud) {
                        // Mapeo compatible con PedidosBodega
                        const solicitudTransferida = {
                            id: solicitud.id_solc,
                            fecha: solicitud.fecha_creacion,
                            responsable: solicitud.usuario_nombre,
                            productos: solicitud.productos.map((p: any) => ({
                                nombre: p.producto_nombre,
                                cantidad: p.cantidad
                            })),
                            estado: "pendiente",
                            sucursal: solicitud.sucursal_nombre,
                            observacion: solicitud.observacion || "",
                            sucursalDestino: solicitud.sucursal_nombre,
                        };
                        transferidasArr.push(solicitudTransferida);
                    }
                }
            });

            if (transferidasArr.length > 0) {
                addSolicitudesTransferidas(transferidasArr);
                setTransferencias(transferidasArr.length);
            }

            setCambios({});
            setSeleccionadas([]);
        } catch (error) {
            console.error('Error al confirmar cambios:', error);
        }
    };

    const handleOpenModal = (solicitud: any) => {
        setSolicitudSeleccionada(solicitud);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSolicitudSeleccionada(null);
    };

    const handleEliminarSolicitud = (solicitud: any) => {
        setSolicitudAEliminar(solicitud);
        setModalConfirmarEliminacion(true);
    };

    const handleConfirmarEliminacion = async () => {
        if (!solicitudAEliminar) return;

        try {
            console.log('DEBUG - Eliminando solicitud:', solicitudAEliminar.id_solc);
            await solicitudesService.deleteSolicitud(solicitudAEliminar.id_solc.toString());
            
            // Refrescar la lista de solicitudes
            if (usuario?.bodega) {
                fetchSolicitudes({ bodega_id: usuario.bodega.toString() });
            }
            
            // Cerrar modal y limpiar
            setModalConfirmarEliminacion(false);
            setSolicitudAEliminar(null);
            
            alert("Solicitud eliminada exitosamente junto con todos sus derivados.");
        } catch (error) {
            console.error("Error al eliminar la solicitud:", error);
            alert("Hubo un error al eliminar la solicitud. Por favor, intente de nuevo.");
        }
    };

    const handleCancelarEliminacion = () => {
        setModalConfirmarEliminacion(false);
        setSolicitudAEliminar(null);
    };

    // El botón de confirmar solo se habilita si hay al menos una solicitud seleccionada con cambio pendiente
    const hayCambios = seleccionadas.some(id => cambios[id]);

    return (
        <Layout>
            <div style={{ padding: "24px",
                maxWidth: "1200px",
                margin: "0 auto",
                width: "100%",
                boxSizing: "border-box" }}>
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
                    <h2 style={{ color: "#FFD700", margin: 0 }}>Solicitudes de sucursales</h2>
                    <div style={{ display: "flex", gap: "12px" }}>
                        <Button
                            variant="contained"
                            startIcon={<CheckIcon />}
                            style={{
                                background: "#4CAF50",
                                color: "#fff",
                                fontWeight: 600
                            }}
                            disabled={seleccionadas.length === 0}
                            onClick={() => handleAccion("aprobada")}
                        >
                            Aceptar
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<CloseIcon />}
                            style={{
                                background: "#FF4D4F",
                                color: "#fff",
                                fontWeight: 600
                            }}
                            disabled={seleccionadas.length === 0}
                            onClick={() => handleAccion("denegada")}
                        >
                            Denegar
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<DoneAllIcon />}
                            style={{
                                background: "#FFD700",
                                color: "#121212",
                                fontWeight: 600,
                                opacity: hayCambios ? 1 : 0.5
                            }}
                            disabled={!hayCambios}
                            onClick={handleConfirmar}
                        >
                            Confirmar
                        </Button>
                    </div>
                </div>
                <TableContainer component={Paper} style={{ background: "#181818" }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={
                                            seleccionadas.length > 0 &&
                                            solicitudesFiltradas.every(s => seleccionadas.includes(s.id_solc))
                                        }
                                        indeterminate={
                                            seleccionadas.length > 0 &&
                                            !solicitudesFiltradas.every(s => seleccionadas.includes(s.id_solc))
                                        }
                                        onChange={e => handleCheckAll(e.target.checked)}
                                        sx={{ color: "#FFD700" }}
                                    />
                                </TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>ID</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Fecha</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Sucursal</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Responsable</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>N° de productos</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Estado</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Acción</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" style={{ color: "#FFD700", fontWeight: 700 }}>
                                        Cargando solicitudes...
                                    </TableCell>
                                </TableRow>
                            ) : solicitudesFiltradas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" style={{ color: "#8A8A8A" }}>
                                        No hay solicitudes para mostrar.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                solicitudesFiltradas.map((row: any) => (
                                    <TableRow key={row.id_solc}>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={seleccionadas.includes(row.id_solc)}
                                                onChange={() => handleCheck(row.id_solc)}
                                                sx={{ color: "#FFD700" }}
                                            />
                                        </TableCell>
                                        <TableCell style={{ color: "#fff" }}>{row.id_solc}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>
                                            {formatFechaChile(row.fecha_creacion)}
                                        </TableCell>
                                        <TableCell style={{ color: "#fff" }}>
                                        {row.sucursal_nombre || "-"}
                                        </TableCell>
                                        <TableCell style={{ color: "#fff" }}>{row.usuario_nombre}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>
                                            {Array.isArray(row.productos)
                                                ? row.productos.reduce((acc: number, prod: any) => acc + Number(prod.cantidad), 0)
                                                : 0}
                                        </TableCell>
                                        <TableCell>
                                            <EstadoBadge 
                                                estado={cambios[row.id_solc] || row.estado || "pendiente"} 
                                                tipo="solicitud"
                                            />
                                            {cambios[row.id_solc] && (
                                                <span style={{ 
                                                    fontSize: "10px", 
                                                    color: "#FFD700", 
                                                    marginLeft: "4px",
                                                    fontStyle: "italic"
                                                }}>
                                                    (sin confirmar)
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outlined"
                                                startIcon={<VisibilityIcon />}
                                                style={{ borderColor: "#FFD700", color: "#FFD700", marginRight: 8 }}
                                                onClick={() => handleOpenModal(row)}
                                            >
                                                Ver detalles
                                            </Button>
                                            <IconButton
                                                color="error"
                                                onClick={() => handleEliminarSolicitud(row)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {/* Controles de paginación (ahora abajo) */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 16, gap: 16 }}>
                    <Button
                        variant="outlined"
                        sx={{ color: '#FFD700', borderColor: '#FFD700' }}
                        disabled={pagina === 1}
                        onClick={() => setPagina(p => Math.max(1, p - 1))}
                    >
                        Anterior
                    </Button>
                    <span style={{ color: '#FFD700', fontWeight: 600 }}>
                        Página {pagina} de {totalPaginas}
                    </span>
                    <Button
                        variant="outlined"
                        sx={{ color: '#FFD700', borderColor: '#FFD700' }}
                        disabled={pagina === totalPaginas}
                        onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                    >
                        Siguiente
                    </Button>
                </div>
                {/* Modal de detalles */}
                <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
                    <DialogTitle sx={{ 
                        background: "linear-gradient(135deg, #232323 0%, #1a1a1a 100%)",
                        color: "#FFD700",
                        borderBottom: "2px solid #FFD700",
                        fontWeight: 600
                    }}>
                        📋 Detalles de Solicitud #{solicitudSeleccionada?.id_solc}
                    </DialogTitle>
                    <DialogContent sx={{ bgcolor: "#1a1a1a", color: "#fff" }}>
                        {solicitudSeleccionada && (
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
                                        value={solicitudSeleccionada.id_solc}
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
                                        value={formatFechaChile(solicitudSeleccionada.fecha_creacion)}
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
                                        value={solicitudSeleccionada.sucursal_nombre || 'N/A'}
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
                                        value={solicitudSeleccionada.usuario_nombre || 'N/A'}
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

                                {/* Información de sucursal */}
                                <Box sx={{ mb: 3, p: 2, bgcolor: "#232323", borderRadius: 2, border: "1px solid #333" }}>
                                    <Typography variant="subtitle2" sx={{ color: "#ccc", mb: 1 }}>
                                        📍 Información de la sucursal
                                    </Typography>
                                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                                        <TextField
                                            label="Dirección"
                                            value={solicitudSeleccionada.sucursal?.direccion || solicitudSeleccionada.sucursal_direccion || 'N/A'}
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
                                            label="RUT"
                                            value={solicitudSeleccionada.sucursal?.rut || solicitudSeleccionada.sucursal_rut || 'N/A'}
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

                                {/* Estado con badge */}
                                <Box sx={{ mb: 3, p: 2, bgcolor: "#232323", borderRadius: 2, border: "1px solid #333" }}>
                                    <Typography variant="subtitle2" sx={{ color: "#ccc", mb: 1 }}>
                                        Estado de la solicitud
                                    </Typography>
                                    <Chip
                                        label={(solicitudSeleccionada.estado || "Pendiente").charAt(0).toUpperCase() + (solicitudSeleccionada.estado || "Pendiente").slice(1)}
                                        sx={{
                                            bgcolor: solicitudSeleccionada.estado === "Aprobada" ? "#4CAF50" : 
                                                    solicitudSeleccionada.estado === "Denegada" ? "#f44336" : 
                                                    solicitudSeleccionada.estado === "En camino" ? "#2196F3" : "#FF9800",
                                            color: "#fff",
                                            fontWeight: 600,
                                            fontSize: "0.9rem"
                                        }}
                                    />
                                </Box>

                                {/* Observación */}
                                {solicitudSeleccionada.observacion && (
                                    <Box sx={{ mb: 3, p: 2, bgcolor: "#232323", borderRadius: 2, border: "1px solid #333" }}>
                                        <Typography variant="subtitle2" sx={{ color: "#ccc", mb: 1 }}>
                                            Observaciones
                                        </Typography>
                                        <Typography sx={{ color: "#fff", fontStyle: "italic" }}>
                                            {solicitudSeleccionada.observacion}
                                        </Typography>
                                    </Box>
                                )}

                                {/* Productos */}
                                <Box sx={{ p: 2, bgcolor: "#232323", borderRadius: 2, border: "1px solid #333" }}>
                                    <Typography variant="h6" sx={{ color: "#FFD700", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                                        📦 Productos solicitados ({solicitudSeleccionada?.productos?.length || 0})
                                    </Typography>
                                    
                                    {!solicitudSeleccionada?.productos || solicitudSeleccionada.productos.length === 0 ? (
                                        <Box sx={{ 
                                            textAlign: "center", 
                                            py: 3, 
                                            color: "#8A8A8A",
                                            fontStyle: "italic"
                                        }}>
                                            No hay productos en esta solicitud
                                        </Box>
                                    ) : (
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
                                                    {solicitudSeleccionada.productos.map((prod: any, idx: number) => (
                                                        <TableRow key={idx} sx={{ "&:hover": { bgcolor: "#2a2a2a" } }}>
                                                            <TableCell sx={{ color: "#fff", fontFamily: "monospace" }}>
                                                                {prod.producto_codigo || 'N/A'}
                                                            </TableCell>
                                                            <TableCell sx={{ color: "#fff" }}>
                                                                {prod.producto_nombre || 'N/A'}
                                                            </TableCell>
                                                            <TableCell align="right" sx={{ color: "#FFD700", fontWeight: 600 }}>
                                                                {prod.cantidad}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}
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
                        <Button
                            onClick={() => {
                                if (solicitudSeleccionada) {
                                    generarOCIFunction(solicitudSeleccionada);
                                }
                            }}
                            sx={{ 
                                color: "#fff", 
                                background: "#4CAF50", 
                                fontWeight: 600,
                                "&:hover": {
                                    background: "#45a049"
                                }
                            }}
                            variant="contained"
                            startIcon={<span>📄</span>}
                        >
                            Generar OCI PDF
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Modal de confirmación de eliminación */}
                <Dialog open={modalConfirmarEliminacion} onClose={handleCancelarEliminacion}>
                    <DialogTitle>Confirmar eliminación</DialogTitle>
                    <DialogContent>
                        <p>¿Está seguro de que desea eliminar la solicitud #{solicitudAEliminar?.id_solc}?</p>
                        <p style={{ color: '#ff6b6b', fontWeight: 'bold' }}>
                            Esta acción eliminará permanentemente:
                        </p>
                        <ul>
                            <li>La solicitud y todos sus productos asociados</li>
                            <li>Los pedidos relacionados con esta solicitud</li>
                            <li>Los detalles de pedidos asociados</li>
                            <li>Las notificaciones relacionadas</li>
                            <li>El historial asociado</li>
                        </ul>
                        <p style={{ color: '#ff6b6b', fontWeight: 'bold' }}>
                            Esta acción no se puede deshacer.
                        </p>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCancelarEliminacion} style={{ color: "#FFD700" }}>
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleConfirmarEliminacion} 
                            style={{ color: "#ffffff", background: "#ff6b6b", fontWeight: 600 }}
                        >
                            Eliminar definitivamente
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </Layout>
    );
}