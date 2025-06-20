import React, { useState, useMemo } from "react";
import Layout from "../../components/layout/layout";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, TextField
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

export default function PedidosSucursal() {
    const { pedidos, updatePedido } = useBodegaStore();
    const usuario = useAuthStore(state => state.usuario);
    const [estado, setEstado] = useState("");
    const [fecha, setFecha] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<any>(null);

    const sucursalActualId = usuario?.sucursal?.id || "";
    
    const pedidosFiltrados = useMemo(() => {
        return pedidos.filter((row) =>
            row.tipo === "salida" &&
            String(row.sucursalDestino) === String(sucursalActualId) &&
            (estado === "" || row.estado === estado) &&
            (fecha === "" || row.fecha === fecha)
        );
    }, [pedidos, sucursalActualId, estado, fecha]);

    const handleConfirmarRecepcion = (id: number) => {
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
                observaciones: pedido.observaciones || "",
                conformidad: "Recibido conforme",
                responsable: usuario?.nombre || "-",
            });
        }
        updatePedido(id, { estado: "Completado" });
    };
    
    const handleOpenModal = (pedido: any) => {
        setPedidoSeleccionado(pedido);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setPedidoSeleccionado(null);
    };


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
                                <MenuItem value="Anulado">Anulado</MenuItem>
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
                                pedidosFiltrados.map((row: any) => (
                                    <TableRow key={row.id}>
                                        <TableCell style={{ color: "#fff" }}>{row.id}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>{row.fecha}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>{row.asignado || "-"}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>
                                            {SUCURSALES.find(s => s.id === row.sucursalDestino)?.nombre || row.sucursalDestino || "-"}
                                        </TableCell>
                                        <TableCell style={{ color: "#fff" }}>
                                            {Array.isArray(row.productos)
                                                ? row.productos.reduce((acc, prod) => acc + Number(prod.cantidad), 0)
                                                : row.cantidad || 0}
                                        </TableCell>
                                        <TableCell style={{ color: row.estado === "Completado" ? "#FFD700" : row.estado === "En camino" ? "#8A8A8A" : "#FF4D4F" }}>
                                            {row.estado}
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
                <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                    <DialogTitle style={{ color: "#B0B0B0", background: "#232323" }}>
                        Detalles del pedido
                    </DialogTitle>
                    <DialogContent style={{ background: "#181818" }}>
                        {pedidoSeleccionado && (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "16px",
                                    marginTop: "8px"
                                }}
                            >
                                <TextField
                                    label="ID"
                                    value={pedidoSeleccionado.id}
                                    variant="filled"
                                    disabled
                                    size="small"
                                    InputProps={{
                                        disableUnderline: true,
                                        style: { color: "#B0B0B0", fontWeight: 600, background: "#232323" }
                                    }}
                                    InputLabelProps={{ style: { color: "#B0B0B0" } }}
                                />
                                <TextField
                                    label="Fecha"
                                    value={pedidoSeleccionado.fecha}
                                    variant="filled"
                                    disabled
                                    size="small"
                                    InputProps={{
                                        disableUnderline: true,
                                        style: { color: "#B0B0B0", fontWeight: 600, background: "#232323" }
                                    }}
                                    InputLabelProps={{ style: { color: "#B0B0B0" } }}
                                />
                                <TextField
                                    label="Responsable"
                                    value={pedidoSeleccionado.responsable}
                                    variant="filled"
                                    disabled
                                    size="small"
                                    InputProps={{
                                        disableUnderline: true,
                                        style: { color: "#B0B0B0", fontWeight: 600, background: "#232323" }
                                    }}
                                    InputLabelProps={{ style: { color: "#B0B0B0" } }}
                                />
                                <TextField
                                    label="N° de productos"
                                    value={pedidoSeleccionado.cantidad}
                                    variant="filled"
                                    disabled
                                    size="small"
                                    InputProps={{
                                        disableUnderline: true,
                                        style: { color: "#B0B0B0", fontWeight: 600, background: "#232323" }
                                    }}
                                    InputLabelProps={{ style: { color: "#B0B0B0" } }}
                                />
                                <TextField
                                    label="Estado"
                                    value={pedidoSeleccionado.estado}
                                    variant="filled"
                                    disabled
                                    size="small"
                                    InputProps={{
                                        disableUnderline: true,
                                        style: { color: "#B0B0B0", fontWeight: 600, background: "#232323" }
                                    }}
                                    InputLabelProps={{ style: { color: "#B0B0B0" } }}
                                />
                                {/* Apartado de documentos */}
                                <div
                                    style={{
                                        background: "#232323",
                                        borderRadius: "8px",
                                        padding: "16px",
                                        marginBottom: "8px",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                                    }}
                                >
                                    <b style={{ color: "#FFD700", fontSize: 16 }}>Documentos del pedido</b>
                                    <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
                                        <Button
                                            variant="outlined"
                                            startIcon={<DescriptionIcon />}
                                            style={{ borderColor: "#FFD700", color: "#FFD700", fontWeight: 600 }}
                                            onClick={() => generarGuiaDespacho(pedidoSeleccionado)}
                                        >
                                            Guía de Despacho
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            startIcon={<AssignmentTurnedInIcon />}
                                            style={{ borderColor: "#4CAF50", color: "#4CAF50", fontWeight: 600 }}
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
                                                observaciones: pedidoSeleccionado.observaciones || "",
                                                conformidad: "Recibido conforme",
                                                responsable: usuario?.nombre || "-",
                                            })}
                                        >
                                            Acta de Recepción
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            startIcon={<LocalShippingIcon />}
                                            style={{ borderColor: "#2196F3", color: "#2196F3", fontWeight: 600 }}
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
                                                    observaciones: pedidoSeleccionado.observaciones || "",
                                                });
                                            }}
                                        >
                                            Orden de Compra Interna (OCI)
                                        </Button>
                                    </div>
                                </div>
                                <div style={{ marginTop: "12px" }}>
                                    <b style={{ color: "#B0B0B0" }}>Productos del pedido:</b>
                                    <ul style={{ color: "#B0B0B0", marginTop: 8 }}>
                                        {pedidoSeleccionado.productos && pedidoSeleccionado.productos.length > 0 ? (
                                            pedidoSeleccionado.productos.map((prod: any, idx: number) => (
                                                <li key={idx}>{prod.nombre} — {prod.cantidad}</li>
                                            ))
                                        ) : (
                                            <li>No hay productos en este pedido.</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                    <DialogActions style={{ background: "#232323" }}>
                        <Button onClick={handleCloseModal} style={{ color: "#B0B0B0" }}>Cerrar</Button>
                    </DialogActions>
                </Dialog>
            </div>
        </Layout>
    );
}