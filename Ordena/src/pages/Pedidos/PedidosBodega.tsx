import React, { useState, useMemo, useEffect, useRef } from "react";
import Layout from "../../components/layout/layout";
import {
    Select, MenuItem, FormControl, InputLabel, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, Snackbar
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import OutboundIcon from '@mui/icons-material/Outbound';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DescriptionIcon from '@mui/icons-material/Description';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { generarActaRecepcion } from "../../utils/pdf/generarActaRecepcion";
import { generarOCI } from "../../utils/pdf/generarOCI";
import { generarGuiaDespacho } from "../../utils/pdf/generarGuiaDespacho";
import { useAuthStore } from "../../store/useAuthStore"; 
import { SUCURSALES } from "../../constants/ubicaciones";
import { useBodegaStore } from "../../store/useBodegaStore";
import ModalFormularioPedido from "../../components/pedidos/modalform";
import { useUsuariosStore } from "../../store/useUsuarioStore";
import { useProveedoresStore } from "../../store/useProveedorStore";
import { useInventariosStore } from "../../store/useProductoStore";
import { usuarioService } from "../../services/usuarioService";

// Interfaces
interface Producto {
    nombre: string;
    cantidad: number;
    codigo?: string;
    descripcion?: string;
}

interface Proveedor {
    nombre: string;
    rut: string;
    contacto: string;
}

interface Pedido {
    id: number;
    tipo: "ingreso" | "salida";
    fecha: string;
    numRem: string;
    numFactura: string;
    numOrden: string;
    proveedor: Proveedor;
    productos: Producto[];
    cantidad: number;
    estado: string;
    responsable: string;
    sucursalDestino?: string;
    asignado?: string;
    observaciones?: string;
    ociAsociada?: string;
    sucursal?: string;
    bodegaOrigen?: string;
    direccionBodega?: string;
    direccionSucursal?: string;
    patenteVehiculo?: string;
}

interface Usuario {
    id: string;
    nombre: string;
    rol: string;
    bodega?: {
        id: string;
        nombre: string;
    };
    sucursal?: {
        id: string;
        nombre: string;
    };
}

// Componente reutilizable para los botones de acción
function BotonAccion({ children, startIcon, ...props }: { children: React.ReactNode, startIcon?: React.ReactNode, [key: string]: any }) {
    return (
        <Button
            variant="contained"
            startIcon={startIcon}
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
        </Button>
    );
}

export default function PedidosBodega() {
    const { pedidos, setPedidos, clearPedidos, transferencias, setTransferencias, solicitudesTransferidas, addPedido, removeSolicitudTransferida } = useBodegaStore() as {
        pedidos: Pedido[];
        setPedidos: (pedidos: Pedido[]) => void;
        clearPedidos: () => void;
        transferencias: number;
        setTransferencias: (cantidad: number) => void;
        solicitudesTransferidas: any[];
        addPedido: (pedido: Pedido) => void;
        removeSolicitudTransferida: (id: number) => void;
    };

    const usuario = useAuthStore((state: any) => state.usuario);
    const { addProveedor } = useProveedoresStore.getState() as { addProveedor: (proveedor: Proveedor) => void };
    const [showSnackbar, setShowSnackbar] = useState(transferencias > 0);
    const { usuarios, setUsuarios } = useUsuariosStore() as { usuarios: Usuario[], setUsuarios: (usuarios: Usuario[]) => void };
    const bodegaIdActual = usuario?.bodega?.id;
    const transportistas = usuarios.filter(
        (u: Usuario) =>
            u.rol === "transportista" &&
            (u.bodega?.id === bodegaIdActual || u.sucursal?.id === bodegaIdActual)
    );

    const pedidosArray = Array.isArray(pedidos) ? pedidos : [];

    const [modalDespachoOpen, setModalDespachoOpen] = useState(false);
    const [solicitudADespachar, setSolicitudADespachar] = useState<any>(null);
    const [transportistaSeleccionado, setTransportistaSeleccionado] = useState<string>("");
    const marcas = useMemo(() => {
        return useInventariosStore.getState().marcas["bodega-central"] || [];
    }, []);
    
    const categorias = useMemo(() => {
        return useInventariosStore.getState().categorias["bodega-central"] || [];
    }, []);

    useEffect(() => {
        if (transferencias > 0) {
            setShowSnackbar(true);
        }
    }, [transferencias]);

    useEffect(() => {
      usuarioService.getUsuarios().then(setUsuarios);
    }, [setUsuarios]);

    const handleSnackbarClick = () => {
        setShowSnackbar(false);
        setTransferencias(0);
        setTimeout(() => {
            tablaTransferidasRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === "clickaway") return;
        setShowSnackbar(false);
        setTransferencias(0);
    };

    const despacharSolicitud = (solicitud: any) => {
        let sucursalId = "";
        if (solicitud.sucursal?.id) {
            sucursalId = solicitud.sucursal.id;
        } else if (typeof solicitud.sucursal === "string") {
            const sucursalObj = SUCURSALES.find(s => s.nombre === solicitud.sucursal);
            sucursalId = sucursalObj?.id || solicitud.sucursal;
        } else if (solicitud.sucursalDestino) {
            const sucursalObj = SUCURSALES.find(s => s.nombre === solicitud.sucursalDestino);
            sucursalId = sucursalObj?.id || solicitud.sucursalDestino;
        } else if (solicitud.sucursal?.nombre) {
            const sucursalObj = SUCURSALES.find(s => s.nombre === solicitud.sucursal.nombre);
            sucursalId = sucursalObj?.id || "";
        }

        console.log('Creando pedido de salida con sucursalId:', sucursalId);

        const nuevoPedido: Pedido = {
            id: Date.now(),
            fecha: new Date().toISOString().slice(0, 10),
            responsable: usuario?.nombre || "Responsable Bodega",
            productos: solicitud.productos,
            sucursalDestino: sucursalId,
            cantidad: solicitud.productos.reduce((acc: number, p: any) => acc + p.cantidad, 0),
            tipo: "salida" as const,
            asignado: solicitud.asignado || usuario?.nombre || solicitud.responsable,
            ociAsociada: solicitud.id,
            observaciones: solicitud.observaciones,
            bodegaOrigen: usuario?.bodega?.nombre || "Bodega Central",
            direccionBodega: usuario?.bodega?.direccion || "Camino a Penco 2500, Concepción",
            direccionSucursal: solicitud.direccion || "-",
            patenteVehiculo: solicitud.patenteVehiculo || "-",
            estado: "En camino",
            numRem: "",
            numFactura: "",
            numOrden: "",
            proveedor: {
                nombre: "",
                rut: "",
                contacto: ""
            }
        };

        console.log('Nuevo pedido de salida a agregar:', nuevoPedido);
        
        addPedido(nuevoPedido);
        removeSolicitudTransferida(solicitud.id);
        
        // Generar la guía de despacho
        generarGuiaDespacho({
            id: nuevoPedido.id,
            fecha: nuevoPedido.fecha,
            responsable: nuevoPedido.responsable,
            productos: nuevoPedido.productos,
            sucursalDestino: nuevoPedido.sucursalDestino,
            ociAsociada: nuevoPedido.ociAsociada,
            observaciones: nuevoPedido.observaciones,
            bodegaOrigen: nuevoPedido.bodegaOrigen,
            direccionBodega: nuevoPedido.direccionBodega,
            direccionSucursal: nuevoPedido.direccionSucursal,
            patenteVehiculo: nuevoPedido.patenteVehiculo
        });
    };

    const tablaTransferidasRef = useRef<HTMLDivElement>(null);

    // Modal para detalles de pedido
    const [openDetailModal, setOpenDetailModal] = useState(false);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<any>(null);

    // Filtros y orden
    const [opcion, setOpcion] = useState<"ingresos" | "salidas">("ingresos");
    const [producto, setProducto] = useState("");
    const [estado, setEstado] = useState("");
    const [sucursal, setSucursal] = useState("");
    const [fecha, setFecha] = useState("");
    const [orden, setOrden] = useState<"" | "desc" | "asc">("");
    const handleOrdenClick = () => {
        setOrden((prev) => (prev === "desc" ? "asc" : "desc"));
    };

    // Modal para nuevo ingreso/salida
    const [modalTipo, setModalTipo] = useState<"ingreso" | "salida" | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filtros aplicados a los datos
    const pedidosFiltrados = useMemo(() => {
        console.log('Estado actual de pedidos:', pedidosArray);
        console.log('Opción actual:', opcion);
        
        let datos = pedidosArray;
        console.log('Datos antes del filtrado:', datos);
        
        datos = datos.filter((row) => {
            console.log('Filtrando pedido:', row);
            if (opcion === "ingresos") {
                const esIngreso = row.tipo === "ingreso";
                console.log('Es ingreso?', esIngreso);
                if (!esIngreso) return false;
                
                if (producto && !row.productos.some((p: any) => p.nombre === producto)) return false;
                if (fecha && row.fecha !== fecha) return false;
                return true;
            }
            if (opcion === "salidas") {
                console.log('Verificando pedido de salida:', row);
                const esSalida = row.tipo === "salida";
                console.log('Es salida?', esSalida);
                if (!esSalida) return false;
                
                // Verificar si tiene sucursal destino
                const tieneSucursalDestino = row.sucursalDestino || row.sucursal;
                console.log('Tiene sucursal destino?', tieneSucursalDestino);
                if (!tieneSucursalDestino) return false;
                
                if (producto && !row.productos.some((p: any) => p.nombre === producto)) return false;
                if (estado && row.estado !== estado) return false;
                if (sucursal && row.sucursalDestino !== sucursal && row.sucursal !== sucursal) return false;
                if (fecha && row.fecha !== fecha) return false;
                return true;
            }
            return false;
        });
        
        console.log('Datos después del filtrado:', datos);
        
        if (orden === "desc") {
            datos = [...datos].sort((a, b) => b.cantidad - a.cantidad);
        } else if (orden === "asc") {
            datos = [...datos].sort((a, b) => a.cantidad - b.cantidad);
        }
        
        return datos;
    }, [pedidosArray, producto, estado, sucursal, fecha, opcion, orden]);

    const handleOpenDetailModal = (pedido: any) => {
        setPedidoSeleccionado(pedido);
        setOpenDetailModal(true);
    };

    const handleCloseDetailModal = () => {
        setOpenDetailModal(false);
        setPedidoSeleccionado(null);
    };

    return (
        <Layout>
            <Snackbar
                open={showSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                onClose={handleCloseSnackbar}
            >
                <MuiAlert
                    onClick={handleSnackbarClick}
                    severity="success"
                    sx={{ width: "100%", cursor: "pointer" }}
                >
                    Se han transferido {transferencias} solicitud(es) aprobada(s) como pedido(s) a este módulo. Haz clic para verlas.
                </MuiAlert>
            </Snackbar>
            <div style={{
                padding: "24px",
                maxWidth: "1200px",
                margin: "0 auto",
                width: "100%",
                boxSizing: "border-box"
            }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "16px",
                        marginBottom: "24px"
                    }}
                >
                    <BotonAccion
                        startIcon={<AddCircleOutlineIcon />}
                        onClick={() => {
                            setModalTipo("ingreso");
                            setIsModalOpen(true);
                        }}
                    >
                        Nuevo Ingreso
                    </BotonAccion>
                    <ModalFormularioPedido
                        open={isModalOpen}
                        onClose={() => {
                            setIsModalOpen(false);
                            setModalTipo(null);
                        }}
                        tipo={modalTipo as "ingreso"}
                        marcas={marcas}
                        categorias={categorias}
                        onSubmit={data => {
                            console.log('Creando nuevo pedido con datos:', data);
                            
                            const nuevoPedido: Pedido = {
                                id: pedidosArray.length ? pedidosArray[pedidosArray.length - 1].id + 1 : 1,
                                tipo: "ingreso" as const,
                                fecha: data.fecha,
                                numRem: data.numRem,
                                numFactura: data.numFactura,
                                numOrden: data.numOrden,
                                proveedor: data.proveedor,
                                productos: data.productos,
                                cantidad: Array.isArray(data.productos)
                                    ? data.productos.reduce((acc: number, prod: any) => acc + Number(prod.cantidad), 0)
                                    : 0,
                                estado: "Pendiente",
                                responsable: usuario?.nombre || "Responsable Bodega"
                            };
                            
                            console.log('Nuevo pedido a agregar:', nuevoPedido);
                            
                            addPedido(nuevoPedido);

                            // Generar Acta de Recepción
                            generarActaRecepcion({
                                numeroActa: String(nuevoPedido.id),
                                fechaRecepcion: nuevoPedido.fecha,
                                sucursal: {
                                    nombre: "Bodega Central",
                                    direccion: usuario?.bodega?.direccion || "Camino a Penco 2500, Concepción"
                                },
                                personaRecibe: {
                                    nombre: nuevoPedido.responsable,
                                    cargo: "Responsable de Bodega"
                                },
                                productos: nuevoPedido.productos.map((prod: any) => ({
                                    codigo: `${prod.nombre}-${prod.marca}-${prod.categoria}`.replace(/\s+/g, "-").toLowerCase(),
                                    descripcion: `${prod.nombre} - ${prod.marca} - ${prod.categoria}`,
                                    cantidad: prod.cantidad
                                })),
                                observaciones: `Guía de Despacho Proveedor: ${data.numRem || "No especificada"}\nN° Orden de Compra: ${data.numOrden || "No especificada"}`,
                                conformidad: "Recibido conforme",
                                responsable: nuevoPedido.responsable,
                                proveedor: {
                                    nombre: data.proveedor.nombre,
                                    rut: data.proveedor.rut,
                                    contacto: data.proveedor.contacto
                                }
                            });
                            
                            setOpcion("ingresos");
                            setIsModalOpen(false);
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
                        paddingBottom: "8px"
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
                        {/* ...Filtros de estado, sucursal y fecha igual que antes... */}
                        {/* ... */}
                    </div>
                </div>
                <Button onClick={clearPedidos} color="error" variant="contained">
                Limpiar todos los pedidos
                </Button>
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
                                            {opcion === "ingresos"
                                                ? (row.proveedor?.nombre || row.proveedor || row.sucursalDestino || "-")
                                                : (
                                                    SUCURSALES.find(s => s.id === row.sucursalDestino)?.nombre || row.sucursalDestino || "-"
                                                )
                                            }
                                        </TableCell>
                                        <TableCell style={{ color: "#fff" }}>
                                            {Array.isArray(row.productos)
                                                ? row.productos.reduce((acc: number, prod: any) => acc + Number(prod.cantidad), 0)
                                                : row.cantidad || 0}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outlined"
                                                startIcon={<VisibilityIcon />}
                                                style={{ borderColor: "#FFD700", color: "#FFD700" }}
                                                onClick={() => handleOpenDetailModal(row)}
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
                <div ref={tablaTransferidasRef} style={{ marginTop: 40 }}>
                    <h3 style={{ color: "#FFD700" }}>Solicitudes transferidas recientemente</h3>
                    <TableContainer component={Paper} style={{ background: "#232323" }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell style={{ color: "#FFD700" }}>ID</TableCell>
                                    <TableCell style={{ color: "#FFD700" }}>Fecha</TableCell>
                                    <TableCell style={{ color: "#FFD700" }}>Sucursal</TableCell>
                                    <TableCell style={{ color: "#FFD700" }}>Responsable</TableCell>
                                    <TableCell style={{ color: "#FFD700" }}>Estado</TableCell>
                                    <TableCell style={{ color: "#FFD700" }}>Observaciones</TableCell>
                                    <TableCell style={{ color: "#FFD700" }}>Productos</TableCell>
                                    <TableCell style={{ color: "#FFD700" }}>Acción</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {solicitudesTransferidas.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" style={{ color: "#8A8A8A" }}>
                                            No hay solicitudes transferidas.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    solicitudesTransferidas.map((s: any, idx: number) => (
                                        <TableRow key={`${s.id}-${idx}`}>
                                            <TableCell style={{ color: "#fff" }}>{s.id}</TableCell>
                                            <TableCell style={{ color: "#fff" }}>{s.fecha}</TableCell>
                                            <TableCell style={{ color: "#fff" }}>
                                            {typeof s.sucursal === "object"
                                                ? s.sucursal?.nombre
                                                : s.sucursal}
                                            </TableCell>
                                            <TableCell style={{ color: "#fff" }}>{s.responsable}</TableCell>
                                            <TableCell style={{ color: "#fff" }}>{s.estado}</TableCell>
                                            <TableCell style={{ color: "#fff" }}>{s.observaciones || "-"}</TableCell>
                                            <TableCell style={{ color: "#fff" }}>
                                                <ul>
                                                    {s.productos.map((p: any, idx: number) => (
                                                        <li key={idx}>{p.nombre} — {p.cantidad}</li>
                                                    ))}
                                                </ul>
                                            </TableCell>
                                            <TableCell>
                                                {s.estado === "pendiente" && (
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        style={{ background: "#FFD700", color: "#232323", fontWeight: 600 }}
                                                        onClick={() => {
                                                            setSolicitudADespachar(s);
                                                            setModalDespachoOpen(true);
                                                        }}
                                                    >
                                                        Despachar
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>

                {/* Modal de detalles */}
                <Dialog open={openDetailModal} onClose={handleCloseDetailModal} maxWidth="sm" fullWidth>
                    <DialogTitle style={{ color: "#B0B0B0", background: "#232323" }}>
                        Detalles del pedido
                    </DialogTitle>
                    <DialogContent style={{ background: "#181818" }}>
                        {pedidoSeleccionado && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
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
                                    label={opcion === "ingresos" ? "Proveedor" : "Sucursal destino"}
                                    value={
                                        opcion === "ingresos"
                                            ? (pedidoSeleccionado.proveedor || SUCURSALES.find(s => s.id === pedidoSeleccionado.sucursalDestino)?.nombre || "-")
                                            : (SUCURSALES.find(s => s.id === pedidoSeleccionado.sucursalDestino)?.nombre || "-")
                                    }
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
                        {pedidoSeleccionado && (
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
                                    {pedidoSeleccionado.tipo === "ingreso" ? (
                                        <Button
                                            variant="outlined"
                                            startIcon={<AssignmentTurnedInIcon />}
                                            style={{ borderColor: "#4CAF50", color: "#4CAF50", fontWeight: 600 }}
                                            onClick={() => generarActaRecepcion({
                                                numeroActa: String(pedidoSeleccionado.id),
                                                fechaRecepcion: pedidoSeleccionado.fecha,
                                                sucursal: {
                                                    nombre: "Bodega Central",
                                                    direccion: usuario?.bodega?.direccion || "Camino a Penco 2500, Concepción"
                                                },
                                                personaRecibe: {
                                                    nombre: pedidoSeleccionado.responsable,
                                                    cargo: "Responsable de Bodega"
                                                },
                                                productos: pedidoSeleccionado.productos.map((prod: any) => ({
                                                    codigo: `${prod.nombre}-${prod.marca}-${prod.categoria}`.replace(/\s+/g, "-").toLowerCase(),
                                                    descripcion: `${prod.nombre} - ${prod.marca} - ${prod.categoria}`,
                                                    cantidad: prod.cantidad
                                                })),
                                                observaciones: `Guía de Despacho Proveedor: ${pedidoSeleccionado.numRem || "No especificada"}\nN° Orden de Compra: ${pedidoSeleccionado.numOrden || "No especificada"}`,
                                                conformidad: "Recibido conforme",
                                                responsable: pedidoSeleccionado.responsable,
                                                proveedor: {
                                                    nombre: pedidoSeleccionado.proveedor.nombre,
                                                    rut: pedidoSeleccionado.proveedor.rut,
                                                    contacto: pedidoSeleccionado.proveedor.contacto
                                                }
                                            })}
                                        >
                                            Acta de Recepción
                                        </Button>
                                    ) : (
                                        <>
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
                                                        nombre: pedidoSeleccionado.asignado || "-",
                                                        cargo: "Responsable de Sucursal",
                                                    },
                                                    productos: pedidoSeleccionado.productos.map((prod: any) => ({
                                                        codigo: prod.codigo || `P${Math.random().toString(36).substr(2, 9)}`,
                                                        descripcion: prod.nombre,
                                                        cantidad: prod.cantidad
                                                    })),
                                                    observaciones: pedidoSeleccionado.observaciones || "",
                                                    conformidad: "Recibido conforme",
                                                    responsable: pedidoSeleccionado.asignado || "-",
                                                })}
                                            >
                                                Acta de Recepción
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                startIcon={<LocalShippingIcon />}
                                                style={{ borderColor: "#2196F3", color: "#2196F3", fontWeight: 600 }}
                                                onClick={() => generarOCI({
                                                    numeroOCI: String(pedidoSeleccionado.ociAsociada || pedidoSeleccionado.id),
                                                    fecha: pedidoSeleccionado.fecha,
                                                    sucursal: {
                                                        nombre: SUCURSALES.find(s => s.id === pedidoSeleccionado.sucursalDestino)?.nombre || pedidoSeleccionado.sucursalDestino || "-",
                                                        direccion: SUCURSALES.find(s => s.id === pedidoSeleccionado.sucursalDestino)?.direccion || pedidoSeleccionado.direccionSucursal || "-",
                                                    },
                                                    responsable: pedidoSeleccionado.responsable || "-",
                                                    productos: pedidoSeleccionado.productos.map((prod: any) => ({
                                                        codigo: prod.codigo || `P${Math.random().toString(36).substr(2, 9)}`,
                                                        descripcion: prod.nombre,
                                                        cantidad: prod.cantidad
                                                    })),
                                                    observaciones: pedidoSeleccionado.observaciones || "",
                                                })}
                                            >
                                                Orden de Compra Interna (OCI)
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </DialogContent>
                    <DialogActions style={{ background: "#232323" }}>
                        <Button onClick={handleCloseDetailModal} style={{ color: "#B0B0B0" }}>Cerrar</Button>
                    </DialogActions>
                </Dialog>
                <Dialog open={modalDespachoOpen} onClose={() => setModalDespachoOpen(false)} maxWidth="xs" fullWidth>
                    <DialogTitle>Asignar transportista</DialogTitle>
                    <DialogContent>
                        <FormControl fullWidth>
                            <InputLabel>Transportista</InputLabel>
                            <Select
                                value={transportistaSeleccionado}
                                label="Transportista"
                                onChange={e => setTransportistaSeleccionado(e.target.value)}
                            >
                                {transportistas.map((t: any) => (
                                    <MenuItem key={t.id} value={t.nombre}>{t.nombre}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setModalDespachoOpen(false)}>Cancelar</Button>
                        <Button
                            onClick={() => {
                                if (!transportistaSeleccionado) return;
                                // Llama a despacharSolicitud pasando el transportista
                                despacharSolicitud({ ...solicitudADespachar, asignado: transportistaSeleccionado });

                                // Genera la Guía de Despacho con el transportista asignado
                                generarGuiaDespacho({
                                    ...solicitudADespachar,
                                    asignado: transportistaSeleccionado,
                                    responsable: transportistaSeleccionado // O puedes usar otro campo si corresponde
                                });
                                setModalDespachoOpen(false);
                                setTransportistaSeleccionado("");
                            }}
                            disabled={!transportistaSeleccionado}
                            variant="contained"
                            style={{ background: "#FFD700", color: "#232323", fontWeight: 600 }}
                        >
                            Confirmar despacho
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </Layout>
    );
}