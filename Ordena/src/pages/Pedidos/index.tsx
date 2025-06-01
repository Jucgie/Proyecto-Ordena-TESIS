import React, { useState, useMemo } from "react";
import Layout from "../../components/layout/layout";
import {
    Select, MenuItem, FormControl, InputLabel, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button,
    Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import ModalFormularioPedido from "../../components/pedidos/modalform";


// Componente reutilizable para los botones de acción
function BotonAccion({ children, ...props }: { children: React.ReactNode, [key: string]: any }) {
    return (
        <button
            style={{
                background: "#FFD700",
                color: "#121212",
                border: "none",
                borderRadius: "6px",
                width: "160px",
                height: "45px",
                fontWeight: 600,
                fontSize: "16px",
                cursor: "pointer"
            }}
            {...props}
        >
            {children}
        </button>
    );
}


export default function Pedidos() {
    const [opcion, setOpcion] = useState<"ingresos" | "salidas">("ingresos");
    const [producto, setProducto] = useState("");
    const [estado, setEstado] = useState("");
    const [sucursal, setSucursal] = useState("");
    const [fecha, setFecha] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<any>(null);
    const [orden, setOrden] = useState<"" | "desc" | "asc">("");
    const handleOrdenClick = () => {
        setOrden((prev) => (prev === "desc" ? "asc" : "desc"));
    };
    const [pedidos, setPedidos] = useState<any[]>([
    ]);

    // Filtros aplicados a los datos
    const pedidosFiltrados = useMemo(() => {
        let datos = pedidos.filter((row) => {
            if (opcion === "ingresos" && row.tipo !== "ingreso") return false;
            if (opcion === "salidas" && row.tipo !== "salida") return false;
            if (producto && row.producto !== producto) return false;
            if (estado && row.estado !== estado) return false;
            if (sucursal && row.sucursal !== sucursal) return false;
            if (fecha && row.fecha !== fecha) return false;
            return true;
        });
        if (orden === "desc") {
            datos = [...datos].sort((a, b) => b.cantidad - a.cantidad);
        } else if (orden === "asc") {
            datos = [...datos].sort((a, b) => a.cantidad - b.cantidad);
        }
        return datos;
    }, [pedidos, producto, estado, sucursal, fecha, opcion, orden]);

    const handleOpenModal = (pedido: any) => {
        setPedidoSeleccionado(pedido);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setPedidoSeleccionado(null);
    };

    const [modalTipo, setModalTipo] = useState<"ingreso" | "salida" | null>(null);

    return (
        <Layout>
            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "16px",
                    marginBottom: "24px",
                    marginLeft: "1100px",
                }}
            >
                <BotonAccion onClick={() => setModalTipo("ingreso")}>Nuevo Ingreso</BotonAccion>
                <BotonAccion onClick={() => setModalTipo("salida")}>Nueva Salida</BotonAccion>

                <ModalFormularioPedido
                    open={!!modalTipo}
                    onClose={() => setModalTipo(null)}
                    tipo={modalTipo as "ingreso" | "salida"}
                    onSubmit={data => {
                        setPedidos(prev => [
                            ...prev,
                            {
                                ...data,
                                id: prev.length ? prev[prev.length - 1].id + 1 : 1, // autoincrementa el id
                                tipo: modalTipo, // guarda el tipo para filtrar después
                            }
                        ]);
                        setModalTipo(null);
                    }}
                />
            </div>

            {/* Barra superior de la tabla */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "24px",
                    borderBottom: "1.5px solid #232323",
                    paddingBottom: "8px",
                    marginLeft: "100px",
                }}
            >
                {/* Opciones Ingresos/Salidas */}
                <div style={{ display: "flex", gap: "32px" }}>
                    <span
                        onClick={() => setOpcion("ingresos")}
                        style={{
                            cursor: "pointer",
                            color: opcion === "ingresos" ? "#FFD700" : "#8A8A8A",
                            fontWeight: 600,
                            fontSize: "18px",
                            borderBottom: opcion === "ingresos" ? "3px solid #FFD700" : "3px solid transparent",
                            paddingBottom: "4px",
                            transition: "border-color 0.2s"
                        }}
                    >
                        Ingresos al almacén
                    </span>
                    <span
                        onClick={() => setOpcion("salidas")}
                        style={{
                            cursor: "pointer",
                            color: opcion === "salidas" ? "#FFD700" : "#8A8A8A",
                            fontWeight: 600,
                            fontSize: "18px",
                            borderBottom: opcion === "salidas" ? "3px solid #FFD700" : "3px solid transparent",
                            paddingBottom: "4px",
                            transition: "border-color 0.2s"
                        }}
                    >
                        Salidas del almacén
                    </span>
                </div>

                {/* Filtros */}
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    {/* Botón de orden de productos */}
                    <Button
                        variant="outlined"
                        sx={{
                            borderColor: "#949494",
                            color: "#FFFFFF",
                            borderWidth: 1.5,
                            minWidth: 120,
                            height: 40,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            fontWeight: 600,
                            '&:hover': {
                                borderColor: "#FFD700",
                                color: "#FFD700",
                            }
                        }}
                        onClick={handleOrdenClick}
                    >
                        Productos
                        {orden === "desc" ? (
                            <ArrowDropDownIcon sx={{ color: "#FFFFFF" }} />
                        ) : (
                            <ArrowDropUpIcon sx={{ color: "#FFFFFF" }} />
                        )}
                    </Button>

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

                    {/* Sucursal */}
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
                        <InputLabel>Sucursal</InputLabel>
                        <Select
                            label="Sucursal"
                            value={sucursal}
                            onChange={e => setSucursal(e.target.value)}
                        >
                            <MenuItem value=""><em>Todas</em></MenuItem>
                            <MenuItem value="bodega">Bodega Central</MenuItem>
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
            <div
                style={{marginLeft: "100px", marginRight: "100px", marginBottom: "24px"}}>
                <TableContainer component={Paper} style={{ background: "#181818" }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>ID</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Fecha</TableCell>
                                {opcion === "salidas" && (
                                    <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Asignado a entrega</TableCell>
                                )}
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>
                                    {opcion === "ingresos" ? "Proveedor" : "Sucursal destino"}
                                </TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>N° de productos</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Estado</TableCell>
                                <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Acción</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {pedidosFiltrados.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" style={{ color: "#8A8A8A" }}>
                                        No hay registros para mostrar.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pedidosFiltrados.map((row: any) => (
                                    <TableRow key={row.id}>
                                        <TableCell style={{ color: "#fff" }}>{row.id}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>{row.fecha}</TableCell>
                                        {opcion === "salidas" && (
                                            <TableCell style={{ color: "#fff" }}>{row.asignado}</TableCell>
                                        )}
                                        <TableCell style={{ color: "#fff" }}>
                                            {opcion === "ingresos" ? row.proveedor : row.sucursalDestino}
                                        </TableCell>
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
                                <div>
                                    <b>{opcion === "ingresos" ? "Proveedor" : "Sucursal destino"}:</b>{" "}
                                    {opcion === "ingresos" ? pedidoSeleccionado.proveedor : pedidoSeleccionado.sucursalDestino}
                                </div>
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