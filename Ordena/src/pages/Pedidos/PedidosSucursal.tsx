import React, { useState, useMemo } from "react";
import Layout from "../../components/layout/layout";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, TextField
} from "@mui/material";

export default function PedidosSucursal() {
    const [estado, setEstado] = useState("");
    const [fecha, setFecha] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<any>(null);

    // Simulación de pedidos asignados a la sucursal
    const [pedidos, setPedidos] = useState<any[]>([
        {
            id: 1,
            fecha: "2024-06-01",
            sucursalDestino: "Sucursal Norte",
            cantidad: 5,
            estado: "En proceso",
            responsable: "Juan Pérez",
            productos: [{ nombre: "Producto A", cantidad: 2 }, { nombre: "Producto B", cantidad: 3 }]
        }
    ]);

    const pedidosFiltrados = useMemo(() => {
        return pedidos.filter((row) => {
            if (estado && row.estado !== estado) return false;
            if (fecha && row.fecha !== fecha) return false;
            return true;
        });
    }, [pedidos, estado, fecha]);

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
            {/* Contenedor principal con padding uniforme */}
            <div style={{ padding: "24px",
                maxWidth: "1200px",
                margin: "0 auto",
                width: "100%",
                boxSizing: "border-box"}}>
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
                        {/* Estado */}
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
                                <MenuItem value="En proceso">En proceso</MenuItem>
                                <MenuItem value="Anulado">Anulado</MenuItem>
                            </Select>
                        </FormControl>
                        {/* Fecha */}
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
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Responsable</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>N° de productos</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Estado</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Acción</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {pedidosFiltrados.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" style={{ color: "#8A8A8A" }}>
                                        No hay registros para mostrar.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pedidosFiltrados.map((row: any) => (
                                    <TableRow key={row.id}>
                                        <TableCell style={{ color: "#fff" }}>{row.id}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>{row.fecha}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>{row.responsable}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>
                                            {Array.isArray(row.productos)
                                                ? row.productos.reduce((acc, prod) => acc + Number(prod.cantidad), 0)
                                                : row.cantidad || 0}
                                        </TableCell>
                                        <TableCell style={{ color: row.estado === "Completado" ? "#FFD700" : row.estado === "En proceso" ? "#8A8A8A" : "#FF4D4F" }}>
                                            {row.estado}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outlined"
                                                style={{ borderColor: "#FFD700", color: "#FFD700" }}
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
                <Dialog open={modalOpen} onClose={handleCloseModal}>
                    <DialogTitle>Detalles del pedido</DialogTitle>
                    <DialogContent>
                        {pedidoSeleccionado ? (
                            <div>
                                <div><b>ID:</b> {pedidoSeleccionado.id}</div>
                                <div><b>Fecha:</b> {pedidoSeleccionado.fecha}</div>
                                <div><b>Responsable:</b> {pedidoSeleccionado.responsable}</div>
                                <div><b>N° de productos:</b> {pedidoSeleccionado.cantidad}</div>
                                <div><b>Estado:</b> {pedidoSeleccionado.estado}</div>
                            </div>
                        ) : null}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseModal} style={{ color: "#FFD700" }}>Cerrar</Button>
                    </DialogActions>
                </Dialog>
            </div>
        </Layout>
    );
}