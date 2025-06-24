import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Layout from "../../components/layout/layout";
import {
    Select, MenuItem, FormControl, InputLabel, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Box, Typography, Alert, Chip
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
import { solicitudesService, pedidosService, personalEntregaService } from "../../services/api";
import EstadoBadge from "../../components/EstadoBadge";

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
    numGuiaDespacho: string;
    archivoGuia?: File | null;
    nombreArchivo?: string;
    observacionesRecepcion?: string;
    proveedor: Proveedor;
    productos: Producto[];
    cantidad: number;
    estado: string;
    responsable: string;
    sucursalDestino?: string;
    asignado?: string;
    observaciones?: string;
    observacion?: string;
    ociAsociada?: string;
    sucursal?: string;
    bodegaOrigen?: string;
    direccionBodega?: string;
    direccionSucursal?: string;
    patenteVehiculo?: string;
}

interface Usuario {
    id: string;
    id_us?: string;
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
    const { 
        pedidos, 
        addPedido, 
        clearPedidos, 
        transferencias, 
        setTransferencias, 
        solicitudesTransferidas, 
        removeSolicitudTransferida, 
        clearSolicitudesTransferidas, 
        addSolicitudesTransferidas, 
        clearTransferidasInvalidas 
    } = useBodegaStore();

    const usuario = useAuthStore((state: any) => state.usuario);
    const { addProveedor } = useProveedoresStore.getState() as { addProveedor: (proveedor: Proveedor) => void };
    const [showSnackbar, setShowSnackbar] = useState(transferencias > 0);
    const { usuarios, setUsuarios } = useUsuariosStore() as { usuarios: Usuario[], setUsuarios: (usuarios: Usuario[]) => void };
    const bodegaIdActual = usuario?.bodega?.id;
    const [transportistas, setTransportistas] = useState<Usuario[]>([]);

    const pedidosArray = Array.isArray(pedidos) ? pedidos : [];

    const [modalDespachoOpen, setModalDespachoOpen] = useState(false);
    const [solicitudADespachar, setSolicitudADespachar] = useState<any>(null);
    const [transportistaSeleccionado, setTransportistaSeleccionado] = useState<string>("");
    const marcas = useMemo(() => {
        const marcasData = useInventariosStore.getState().marcas["bodega-central"] || [];
        return marcasData.map((marca: any) => marca.nombre || marca);
    }, []);
    
    const categorias = useMemo(() => {
        const categoriasData = useInventariosStore.getState().categorias["bodega-central"] || [];
        return categoriasData.map((categoria: any) => categoria.nombre || categoria);
    }, []);

    const fetchSolicitudesTransferidas = useCallback(async () => {
        if (!usuario?.bodega?.id_bdg) return;
        try {
            const solicitudes = await solicitudesService.getSolicitudes({ 
                bodega_id: usuario.bodega.id_bdg.toString(),
            });

            // Filtrar solo solicitudes aprobadas que NO estén despachadas
            const transferidas = solicitudes.filter(
                (s: any) => s.estado === "aprobada" && !s.despachada
            );
            
            console.log('Solicitudes totales:', solicitudes.length);
            console.log('Solicitudes aprobadas no despachadas:', transferidas.length);
            
            const uniqueTransferidasMap = new Map();
            transferidas.forEach((solicitud: any) => {
                if (!uniqueTransferidasMap.has(solicitud.id_solc)) {
                    uniqueTransferidasMap.set(solicitud.id_solc, solicitud);
                }
            });
            const uniqueTransferidas = Array.from(uniqueTransferidasMap.values());

            const transferidasMap = uniqueTransferidas.map((solicitud: any) => ({
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
            }));

            clearSolicitudesTransferidas();
            addSolicitudesTransferidas(transferidasMap);
        } catch (error) {
            console.error("Error reconstruyendo solicitudes transferidas:", error);
        }
    }, [usuario?.bodega?.id_bdg, clearSolicitudesTransferidas, addSolicitudesTransferidas]);

    useEffect(() => {
        if (transferencias > 0) {
            setShowSnackbar(true);
        }
    }, [transferencias]);

    useEffect(() => {
      usuarioService.getUsuarios().then(setUsuarios);
    }, [setUsuarios]);

    useEffect(() => {
        // Solo cargar solicitudes transferidas si no hay ninguna guardada
        if (solicitudesTransferidas.length === 0) {
            fetchSolicitudesTransferidas();
        }
    }, [fetchSolicitudesTransferidas, solicitudesTransferidas.length]);

    useEffect(() => {
        async function fetchTransportistas() {
            const bodegaId = usuario?.bodega;
            if (bodegaId) {
                try {
                    const data = await usuarioService.getTransportistasPorBodega(bodegaId.toString());
                    setTransportistas(data);
                } catch (error) {
                    console.error("Error fetching transportistas:", error);
                    setTransportistas([]);
                }
            }
        }
        fetchTransportistas();
    }, [usuario?.bodega]);

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

    const despacharSolicitud = async (solicitud: any) => {
        if (!solicitud || !solicitud.id) {
            console.error("Intento de despachar una solicitud inválida", solicitud);
            return;
        }

        console.log(`Intentando despachar solicitud ID: ${solicitud.id}`);

        // 1. Marcar como despachada en el backend
        try {
            await solicitudesService.updateSolicitud(solicitud.id.toString(), { despachada: true });
            console.log(`Solicitud ${solicitud.id} marcada como despachada exitosamente`);
        } catch (error: any) {
            console.error("Error al marcar la solicitud como despachada:", error.response?.data || error.message);
            
            // Si la solicitud no existe, limpiar el estado local
            if (error.response?.status === 404) {
                alert(`La solicitud #${solicitud.id} ya no existe en el sistema. Refrescando la lista...`);
                removeSolicitudTransferida(solicitud.id);
                fetchSolicitudesTransferidas();
                return;
            }
            
            alert(`Error: No se pudo actualizar la solicitud #${solicitud.id}. Es posible que ya haya sido procesada. Refrescando la lista...`);
            // Forzar recarga para limpiar datos fantasma
            fetchSolicitudesTransferidas();
            return; 
        }

        // Declarar nuevoPedido fuera del try para que esté disponible en todo el scope
        let nuevoPedido: Pedido | null = null;

        // 2. Crear el pedido en la base de datos
        try {
            // Buscar el personal de entrega (transportista) en la base de datos
            const transportista = transportistas.find(t => t.nombre === solicitud.asignado);
            if (!transportista) {
                throw new Error(`Transportista ${solicitud.asignado} no encontrado en la base de datos`);
            }

            // Buscar el personal de entrega correspondiente al transportista
            const personalEntrega = await personalEntregaService.getPersonalEntrega({ 
                bodega_id: usuario?.bodega?.id_bdg?.toString() 
            });
            
            let personalEncontrado = personalEntrega.find((p: any) => p.usuario_fk === transportista.id_us || p.usuario_fk === transportista.id);
            
            if (!personalEncontrado) {
                // Si no existe, crear el personal de entrega
                console.log('Creando personal de entrega para transportista:', transportista.nombre);
                const nuevoPersonal = await personalEntregaService.crearDesdeUsuario({
                    usuario_id: parseInt(transportista.id_us || transportista.id),
                    patente: 'N/A', // Se puede mejorar para pedir la patente
                    descripcion: 'Transportista asignado'
                });
                personalEncontrado = nuevoPersonal.personal_entrega;
            }
            
            // Crear el pedido usando el endpoint específico
            const pedidoCreado = await pedidosService.crearDesdeSolicitud({
                solicitud_id: solicitud.id,
                personal_entrega_id: personalEncontrado.id_psn,
                descripcion: `Pedido generado desde solicitud ${solicitud.id}`
            });

            console.log('Pedido creado en base de datos:', pedidoCreado);

            // Usar el pedido real creado en la BD para la UI
            const sucursalId = SUCURSALES.find(s => s.nombre === solicitud.sucursalDestino)?.id || "";
            nuevoPedido = {
                id: pedidoCreado.pedido.id_p, // Usar ID real de la BD
                fecha: new Date().toISOString().slice(0, 10),
                responsable: usuario?.nombre || "Responsable Bodega",
                productos: solicitud.productos,
                sucursalDestino: sucursalId,
                cantidad: solicitud.productos.reduce((acc: number, p: any) => acc + p.cantidad, 0),
                tipo: "salida" as const,
                asignado: solicitud.asignado,
                ociAsociada: solicitud.id,
                observacion: solicitud.observacion || "",
                bodegaOrigen: usuario?.bodega?.nombre || "Bodega Central",
                direccionBodega: usuario?.bodega?.direccion || "Camino a Penco 2500, Concepción",
                direccionSucursal: SUCURSALES.find(s => s.id === sucursalId)?.direccion || "-",
                patenteVehiculo: "N/A",
                estado: "En camino",
                numRem: "",
                numGuiaDespacho: "",
                archivoGuia: null,
                nombreArchivo: "",
                observacionesRecepcion: "",
                proveedor: { nombre: "", rut: "", contacto: "" }
            };
            addPedido(nuevoPedido);

        } catch (error: any) {
            console.error("Error al crear pedido en base de datos:", error.response?.data || error.message);
            alert(`Error: No se pudo crear el pedido en la base de datos. ${error.response?.data?.error || error.message}`);
            return;
        }

        // 3. Eliminar de la lista local y forzar recarga
        removeSolicitudTransferida(solicitud.id);
        fetchSolicitudesTransferidas();

        // 4. Generar guía de despacho solo si se creó el pedido exitosamente
        if (nuevoPedido) {
            generarGuiaDespacho(nuevoPedido);
        }
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

    const handleLimpiarRegistros = async () => {
        const idsParaArchivar = solicitudesTransferidas.map((s: any) => s.id);
        if (idsParaArchivar.length > 0) {
            try {
                console.log('Archivando solicitudes:', idsParaArchivar);
                await solicitudesService.archivarSolicitudes(idsParaArchivar);
                console.log('Solicitudes archivadas exitosamente');
                
                // Limpiar el estado local inmediatamente
                clearSolicitudesTransferidas();
                
                // Forzar la recarga de solicitudes transferidas para que se actualice la vista
                fetchSolicitudesTransferidas();
            } catch (error) {
                console.error("Error al archivar las solicitudes:", error);
                alert("No se pudieron archivar los registros. Inténtelo de nuevo.");
            }
        }
        // No limpiar los pedidos ya que son registros importantes que deben mantenerse
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
                                numGuiaDespacho: data.numGuiaDespacho,
                                archivoGuia: data.archivoGuia,
                                nombreArchivo: data.nombreArchivo,
                                observacionesRecepcion: data.observacionesRecepcion,
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
                                observaciones: `Guía de Despacho Proveedor: ${data.numGuiaDespacho || "No especificada"}\n${data.observacionesRecepcion ? `Observaciones: ${data.observacionesRecepcion}` : ""}`,
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
                <Button onClick={handleLimpiarRegistros} color="error" variant="contained" >
                Limpiar registros pendientes
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
                                {opcion === "salidas" && (
                                    <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Estado</TableCell>
                                )}
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
                                        {opcion === "salidas" && (
                                            <TableCell style={{ color: "#fff" }}>
                                                <EstadoBadge estado={row.estado} />
                                            </TableCell>
                                        )}
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
                                    <TableCell style={{ color: "#FFD700" }}>Cantidad Total</TableCell>
                                    <TableCell style={{ color: "#FFD700" }}>Acción</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {solicitudesTransferidas.filter(s => Number(s.id) > 0 && Array.isArray(s.productos) && s.productos.length > 0).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" style={{ color: "#8A8A8A" }}>
                                            No hay solicitudes transferidas.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    solicitudesTransferidas
                                        .filter(s => Number(s.id) > 0 && Array.isArray(s.productos) && s.productos.length > 0)
                                        .map((s: any, idx: number) => {
                                            // Formatear fecha
                                            const fechaFormateada = s.fecha ? new Date(s.fecha).toLocaleDateString('es-CL', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) : '-';
                                            
                                            // Calcular cantidad total
                                            console.log('Debug - Productos de solicitud:', s.productos);
                                            
                                            return (
                                                <TableRow key={`${s.id}-${idx}`}>
                                                    <TableCell style={{ color: "#fff" }}>{s.id}</TableCell>
                                                    <TableCell style={{ color: "#fff" }}>{fechaFormateada}</TableCell>
                                                    <TableCell style={{ color: "#fff" }}>
                                                        {typeof s.sucursal === "object"
                                                            ? s.sucursal?.nombre
                                                            : s.sucursal}
                                                    </TableCell>
                                                    <TableCell style={{ color: "#fff" }}>{s.responsable}</TableCell>
                                                    <TableCell>
                                                        <EstadoBadge 
                                                            estado={s.estado || "pendiente"} 
                                                            tipo="solicitud"
                                                        />
                                                    </TableCell>
                                                    <TableCell style={{ color: "#fff" }}>{s.observacion || "Ninguna"}</TableCell>
                                                    <TableCell style={{ color: "#fff" }}>
                                                        {(() => {
                                                            if (!s.productos || !Array.isArray(s.productos)) return 0;
                                                            const total = s.productos.reduce((sum: number, p: any) => {
                                                                const cantidad = Number(p.cantidad || p.cantidad_solicitada || 0);
                                                                return sum + (isNaN(cantidad) ? 0 : cantidad);
                                                            }, 0);
                                                            return isNaN(total) ? 0 : Math.round(total);
                                                        })()}
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
                                            );
                                        })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>

                {/* Modal para seleccionar transportista */}
                <Dialog open={modalDespachoOpen} onClose={() => setModalDespachoOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle sx={{ 
                        background: "linear-gradient(135deg, #232323 0%, #1a1a1a 100%)",
                        color: "#FFD700",
                        borderBottom: "2px solid #FFD700",
                        fontWeight: 600
                    }}>
                        🚚 Asignar Transportista para Despacho
                    </DialogTitle>
                    <DialogContent sx={{ bgcolor: "#1a1a1a", color: "#fff" }}>
                        {solicitudADespachar && (
                            <>
                                {/* Información de la solicitud */}
                                <Box sx={{ 
                                    mb: 3,
                                    p: 2,
                                    bgcolor: "#232323",
                                    borderRadius: 2,
                                    border: "1px solid #333"
                                }}>
                                    <Typography variant="h6" sx={{ color: "#FFD700", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                                        📋 Solicitud #{solicitudADespachar.id}
                                    </Typography>
                                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                                        <TextField
                                            label="Sucursal destino"
                                            value={solicitudADespachar.sucursal || 'N/A'}
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
                                            label="Responsable"
                                            value={solicitudADespachar.responsable || 'N/A'}
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

                                {/* Selección de transportista */}
                                <Box sx={{ p: 2, bgcolor: "#232323", borderRadius: 2, border: "1px solid #333" }}>
                                    <Typography variant="subtitle2" sx={{ color: "#ccc", mb: 2 }}>
                                        👤 Seleccione un transportista disponible
                                    </Typography>
                                    <FormControl fullWidth>
                                        <InputLabel 
                                            id="transportista-select-label"
                                            sx={{ color: "#ccc" }}
                                        >
                                            Transportista
                                        </InputLabel>
                            <Select
                                labelId="transportista-select-label"
                                value={transportistaSeleccionado}
                                label="Transportista"
                                onChange={(e) => setTransportistaSeleccionado(e.target.value)}
                                            sx={{
                                                color: "#fff",
                                                "& .MuiOutlinedInput-notchedOutline": {
                                                    borderColor: "#444"
                                                },
                                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                                    borderColor: "#FFD700"
                                                },
                                                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                                    borderColor: "#FFD700"
                                                },
                                                "& .MuiSvgIcon-root": {
                                                    color: "#FFD700"
                                                }
                                            }}
                                            MenuProps={{
                                                PaperProps: {
                                                    sx: {
                                                        bgcolor: "#232323",
                                                        border: "1px solid #444",
                                                        "& .MuiMenuItem-root": {
                                                            color: "#fff",
                                                            "&:hover": {
                                                                bgcolor: "#2a2a2a"
                                                            },
                                                            "&.Mui-selected": {
                                                                bgcolor: "#FFD700",
                                                                color: "#232323",
                                                                "&:hover": {
                                                                    bgcolor: "#FFD700"
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }}
                                        >
                                            {transportistas.length === 0 ? (
                                                <MenuItem disabled>
                                                    <Typography sx={{ color: "#8A8A8A", fontStyle: "italic" }}>
                                                        No hay transportistas disponibles
                                                    </Typography>
                                                </MenuItem>
                                            ) : (
                                                transportistas.map((t: any) => (
                                                    <MenuItem 
                                                        key={t.id_us || t.id} 
                                                        value={t.nombre}
                                                    >
                                        {t.nombre}
                                    </MenuItem>
                                                ))
                                            )}
                            </Select>
                        </FormControl>
                                    
                                    {transportistas.length === 0 && (
                                        <Alert severity="warning" sx={{ mt: 2, bgcolor: "#2a2a2a", color: "#FF9800" }}>
                                            No hay transportistas registrados en la bodega. Contacte al administrador para agregar transportistas.
                                        </Alert>
                                    )}
                                </Box>

                                {/* Resumen de productos */}
                                <Box sx={{ p: 2, bgcolor: "#232323", borderRadius: 2, border: "1px solid #333" }}>
                                    <Typography variant="subtitle2" sx={{ color: "#ccc", mb: 2 }}>
                                        📦 Productos a despachar
                                    </Typography>
                                    
                                    {!solicitudADespachar.productos || solicitudADespachar.productos.length === 0 ? (
                                        <Box sx={{ 
                                            textAlign: "center", 
                                            py: 3, 
                                            color: "#8A8A8A",
                                            fontStyle: "italic"
                                        }}>
                                            No hay productos en esta solicitud
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
                                                        {solicitudADespachar.productos.map((prod: any, idx: number) => {
                                                            const cantidad = Number(prod.cantidad || prod.cantidad_solicitada || 0);
                                                            return (
                                                                <TableRow key={idx} sx={{ "&:hover": { bgcolor: "#2a2a2a" } }}>
                                                                    <TableCell sx={{ color: "#fff" }}>
                                                                        {prod.nombre || prod.producto_nombre || 'N/A'}
                                                                    </TableCell>
                                                                    <TableCell align="right" sx={{ color: "#FFD700", fontWeight: 600 }}>
                                                                        {isNaN(cantidad) ? 0 : cantidad}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
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
                                                    {solicitudADespachar.productos.length} productos • {
                                                        (() => {
                                                            if (!solicitudADespachar.productos || !Array.isArray(solicitudADespachar.productos)) return 0;
                                                            const total = solicitudADespachar.productos.reduce((sum: number, p: any) => {
                                                                const cantidad = Number(p.cantidad || p.cantidad_solicitada || 0);
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
                            </>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ 
                        bgcolor: "#1a1a1a", 
                        borderTop: "1px solid #333",
                        p: 2
                    }}>
                        <Button 
                            onClick={() => setModalDespachoOpen(false)} 
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
                            Cancelar
                        </Button>
                        <Button 
                            onClick={() => {
                                if (solicitudADespachar && transportistaSeleccionado) {
                                    despacharSolicitud({ ...solicitudADespachar, asignado: transportistaSeleccionado });
                                    setModalDespachoOpen(false);
                                    setTransportistaSeleccionado("");
                                }
                            }}
                            disabled={!transportistaSeleccionado || transportistas.length === 0}
                            sx={{ 
                                color: "#fff", 
                                background: "#4CAF50", 
                                fontWeight: 600,
                                "&:hover": {
                                    background: "#45a049"
                                },
                                "&:disabled": {
                                    background: "#666",
                                    color: "#999"
                                }
                            }}
                            variant="contained"
                            startIcon={<span>🚚</span>}
                        >
                            Confirmar Despacho
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Modal de detalles */}
                <Dialog open={openDetailModal} onClose={handleCloseDetailModal} maxWidth="md" fullWidth>
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
                                    label="Fecha"
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
                                    label="Responsable"
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
                                    label={opcion === "ingresos" ? "Proveedor" : "Sucursal destino"}
                                    value={
                                        opcion === "ingresos"
                                                ? (pedidoSeleccionado.proveedor?.nombre || SUCURSALES.find(s => s.id === pedidoSeleccionado.sucursalDestino)?.nombre || "-")
                                            : (SUCURSALES.find(s => s.id === pedidoSeleccionado.sucursalDestino)?.nombre || "-")
                                    }
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

                                {/* Información adicional para salidas */}
                                {opcion === "salidas" && pedidoSeleccionado.asignado && (
                                    <Box sx={{ mb: 3, p: 2, bgcolor: "#232323", borderRadius: 2, border: "1px solid #333" }}>
                                        <Typography variant="subtitle2" sx={{ color: "#ccc", mb: 1 }}>
                                            🚚 Información de entrega
                                        </Typography>
                                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                                <TextField
                                                label="Transportista asignado"
                                                value={pedidoSeleccionado.asignado}
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
                                )}

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
                                    {pedidoSeleccionado.tipo === "ingreso" ? (
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
                                                observaciones: `Guía de Despacho Proveedor: ${pedidoSeleccionado.numRem || "No especificada"}\nN° Orden de Compra: ${pedidoSeleccionado.numGuiaDespacho || "No especificada"}`,
                                                conformidad: "Recibido conforme",
                                                responsable: pedidoSeleccionado.responsable,
                                                proveedor: {
                                                        nombre: pedidoSeleccionado.proveedor?.nombre || "",
                                                        rut: pedidoSeleccionado.proveedor?.rut || "",
                                                        contacto: pedidoSeleccionado.proveedor?.contacto || ""
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
                                                        nombre: pedidoSeleccionado.asignado || "-",
                                                        cargo: "Responsable de Sucursal",
                                                    },
                                                    productos: pedidoSeleccionado.productos.map((prod: any) => ({
                                                        codigo: prod.codigo || `${prod.nombre}-${Date.now()}`,
                                                        descripcion: prod.nombre,
                                                        cantidad: prod.cantidad
                                                    })),
                                                    observaciones: pedidoSeleccionado.observacion || "",
                                                    conformidad: "Recibido conforme",
                                                    responsable: pedidoSeleccionado.asignado || "-",
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
                                                onClick={() => generarOCI({
                                                    numeroOCI: String(pedidoSeleccionado.ociAsociada || pedidoSeleccionado.id),
                                                    fecha: pedidoSeleccionado.fecha,
                                                    sucursal: {
                                                        nombre: SUCURSALES.find(s => s.id === pedidoSeleccionado.sucursalDestino)?.nombre || pedidoSeleccionado.sucursalDestino || "-",
                                                        direccion: SUCURSALES.find(s => s.id === pedidoSeleccionado.sucursalDestino)?.direccion || pedidoSeleccionado.direccionSucursal || "-",
                                                    },
                                                    responsable: pedidoSeleccionado.responsable || "-",
                                                    productos: pedidoSeleccionado.productos.map((prod: any) => ({
                                                        codigo: prod.codigo || `${prod.nombre}-${Date.now()}`,
                                                        descripcion: prod.nombre,
                                                        cantidad: prod.cantidad
                                                    })),
                                                    observaciones: pedidoSeleccionado.observacion || "",
                                                })}
                                            >
                                                Orden de Compra Interna (OCI)
                                            </Button>
                                        </>
                                    )}
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
                            onClick={handleCloseDetailModal} 
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