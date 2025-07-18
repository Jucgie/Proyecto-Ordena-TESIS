import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Layout from "../../components/layout/layout";
import {
    Select, MenuItem, FormControl, InputLabel, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Box, Typography, Alert, Chip, Autocomplete, IconButton, Card, CardContent, LinearProgress, Grid, List, ListItem, ListItemText, Tooltip
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
import DeleteIcon from '@mui/icons-material/Delete';
import { generarActaRecepcion } from "../../utils/pdf/generarActaRecepcion";
import { generarOCI } from "../../utils/pdf/generarOCI";
import { generarGuiaDespacho } from "../../utils/pdf/generarGuiaDespacho";
import { useAuthStore } from "../../store/useAuthStore"; 
import { SUCURSALES } from "../../constants/ubicaciones";
import { useBodegaStore } from "../../store/useBodegaStore";
import ModalFormularioPedido from "../../components/pedidos/modalform";
import { useUsuariosStore } from "../../store/useUsuarioStore";
// El historial del proveedor se maneja automáticamente en el backend
import { useInventariosStore } from "../../store/useProductoStore";
import { usuarioService } from "../../services/usuarioService";
import { solicitudesService, pedidosService, personalEntregaService, informesService } from "../../services/api";
import EstadoBadge from "../../components/EstadoBadge";
import { buscarProductosSimilares } from '../../services/api';
import RefreshIcon from '@mui/icons-material/Refresh';
import { formatFechaChile } from "../../utils/formatFechaChile";

// Interfaces
interface Producto {
    nombre: string;
    cantidad: number;
    codigo?: string;
    descripcion?: string;
    marca: string;
    categoria: string;
    stock_actual?: number;
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
}

interface Usuario {
    id: string;
    id_us?: string;
    nombre: string;
    rol: string;
    bodega?: string | number;  // Es directamente el ID de la bodega
    sucursal?: string | number;  // Es directamente el ID de la sucursal
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

// Componente para tabla de ingresos
function TablaIngresos({ ingresos, onVerDetalles, loading }: { ingresos: any[], onVerDetalles: (row: any) => void, loading: boolean }) {
    return (
        <TableContainer component={Paper} style={{ background: "#181818" }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>ID</TableCell>
                        <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Fecha</TableCell>
                        <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Proveedor</TableCell>
                        <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>N° de productos</TableCell>
                        <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Guía de Despacho</TableCell>
                        <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Acción</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={6} align="center" style={{ color: "#FFD700", fontWeight: 600, fontSize: 18 }}>
                                Cargando pedidos...
                            </TableCell>
                        </TableRow>
                    ) : ingresos.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} align="center" style={{ color: "#8A8A8A" }}>
                                No hay ingresos para mostrar.
                            </TableCell>
                        </TableRow>
                    ) : (
                        ingresos.map((row: any) => (
                            <TableRow key={row.id_p || row.id}>
                                <TableCell style={{ color: "#fff" }}>{row.id_p || row.id}</TableCell>
                                <TableCell style={{ color: "#fff" }}>{formatFechaChile(row.fecha_entrega || row.fecha)}</TableCell>
                                <TableCell style={{ color: "#fff" }}>{row.proveedor_nombre || "Sin proveedor"}</TableCell>
                                <TableCell style={{ color: "#fff" }}>{Array.isArray(row.detalles_pedido) ? row.detalles_pedido.reduce((acc: number, p: any) => acc + parseFloat(p.cantidad || '0'), 0) : 0}</TableCell>
                                <TableCell style={{ color: "#fff" }}>{row.numGuiaDespacho || row.num_guia_despacho || '—'}</TableCell>
                                <TableCell>
                                    <Button
                                        variant="outlined"
                                        startIcon={<VisibilityIcon />}
                                        style={{ borderColor: "#FFD700", color: "#FFD700" }}
                                        onClick={() => onVerDetalles(row)}
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
    );
}

// Componente para tabla de salidas
function TablaSalidas({ salidas, onVerDetalles, loading }: { salidas: any[], onVerDetalles: (row: any) => void, loading: boolean }) {
    return (
        <TableContainer component={Paper} style={{ background: "#181818" }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>ID</TableCell>
                        <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Fecha</TableCell>
                        <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Asignado a entrega</TableCell>
                        <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Sucursal destino</TableCell>
                        <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Estado</TableCell>
                        <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>N° de productos</TableCell>
                        <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Acción</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={7} align="center" style={{ color: "#FFD700", fontWeight: 600, fontSize: 18 }}>
                                Cargando pedidos...
                            </TableCell>
                        </TableRow>
                    ) : salidas.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} align="center" style={{ color: "#8A8A8A" }}>
                                No hay salidas para mostrar.
                            </TableCell>
                        </TableRow>
                    ) : (
                        salidas.map((row: any) => {
                            console.log('Fila salida:', row);
                            return (
                                <TableRow key={row.id_p || row.id}>
                                    <TableCell style={{ color: "#fff" }}>{row.id_p || row.id}</TableCell>
                                    <TableCell style={{ color: "#fff" }}>{formatFechaChile(row.fecha_entrega || row.fecha)}</TableCell>
                                    <TableCell style={{ color: "#fff" }}>{row.personal_entrega_nombre || "-"}</TableCell>
                                    <TableCell style={{ color: "#fff" }}>{row.sucursal_nombre || "-"}</TableCell>
                                    <TableCell style={{ color: "#fff" }}>{row.estado_pedido_nombre || "-"}</TableCell>
                                    <TableCell style={{ color: "#fff" }}>{Array.isArray(row.detalles_pedido) ? row.detalles_pedido.reduce((acc: number, p: any) => acc + parseFloat(p.cantidad || '0'), 0) : 0}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outlined"
                                            startIcon={<VisibilityIcon />}
                                            style={{ borderColor: "#FFD700", color: "#FFD700" }}
                                            onClick={() => onVerDetalles(row)}
                                        >
                                            Ver detalles
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </TableContainer>
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
    // El historial del proveedor se maneja automáticamente en el backend
    const [showSnackbar, setShowSnackbar] = useState(transferencias > 0);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "warning" | "info">("success");
    const { usuarios, setUsuarios } = useUsuariosStore() as { usuarios: Usuario[], setUsuarios: (usuarios: Usuario[]) => void };
    const bodegaIdActual = usuario?.bodega;
    const [transportistas, setTransportistas] = useState<Usuario[]>([]);

    const pedidosArray = Array.isArray(pedidos) ? pedidos : [];

    const [modalDespachoOpen, setModalDespachoOpen] = useState(false);
    const [solicitudADespachar, setSolicitudADespachar] = useState<any>(null);
    const [transportistaSeleccionado, setTransportistaSeleccionado] = useState<string>("");
    
    // Estados para marcas y categorías
    const [marcas, setMarcas] = useState<string[]>([]);
    const [categorias, setCategorias] = useState<string[]>([]);
    
    // Obtener funciones del store de inventario
    const { fetchMarcas, fetchCategorias, fetchProductos } = useInventariosStore();
    
    // El historial del proveedor se maneja automáticamente en el backend

    const [loading, setLoading] = useState(false);
    const [pedidosBackend, setPedidosBackend] = useState<any[]>([]);

    const [productos, setProductos] = useState<Producto[]>([]);
    const [productoActual, setProductoActual] = useState({
        nombre: '',
        cantidad: 1,
        marca: '',
        categoria: '',
        modelo: ''
    });

    // Estados para el sistema de reconocimiento (DEPRECATED - usar modal de validación múltiple)
    const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);
    const [datosFormularioPendiente, setDatosFormularioPendiente] = useState<any>(null);
    
    // Estados para el nuevo modal de validación múltiple
    const [modalValidacionMultiple, setModalValidacionMultiple] = useState(false);
    const [productosAValidar, setProductosAValidar] = useState<any[]>([]);
    const [productosValidados, setProductosValidados] = useState<any[]>([]);
    const [productoActualValidacion, setProductoActualValidacion] = useState<any>(null);
    const [productosSimilaresActual, setProductosSimilaresActual] = useState<any[]>([]);
    const [procesandoIngreso, setProcesandoIngreso] = useState(false);

    // Cargar productos similares cuando cambia el producto actual en validación múltiple
    useEffect(() => {
        if (modalValidacionMultiple && productoActualValidacion) {
            setProductosSimilaresActual([]); // Limpiar antes de buscar
            buscarProductosSimilaresLocal(productoActualValidacion);
            setProductoSeleccionado(null); // Resetear selección
        }
    }, [productoActualValidacion, modalValidacionMultiple]);

    const agregarProductoRapido = () => {
        if (productoActual.nombre.trim() && productoActual.cantidad > 0) {
            setProductos([...productos, { ...productoActual }]);
            setProductoActual({ nombre: '', cantidad: 1, marca: '', categoria: '', modelo: '' });
        }
    };

    const eliminarProducto = (index: number) => {
        setProductos(productos.filter((_, i) => i !== index));
    };

    const fetchSolicitudesTransferidas = useCallback(async () => {
        if (!usuario?.bodega) return;
        try {
            const solicitudesResponse = await solicitudesService.getSolicitudes({ bodega_id: usuario.bodega.toString() });
            const solicitudes = solicitudesResponse.results || [];
            
            // Filtrar solo solicitudes aprobadas que NO estén despachadas
            const transferidas = solicitudes.filter(
                (s: any) => s.estado === "aprobada" && !s.despachada
            );
            
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
    }, [usuario?.bodega, clearSolicitudesTransferidas, addSolicitudesTransferidas]);

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

    // Cargar marcas y categorías
    useEffect(() => {
        const cargarMarcasYCategorias = async () => {
            try {
                // Usar "bodega-central" como ubicacionId para la bodega
                const ubicacionId = "bodega-central";
                // Cargar marcas
                await fetchMarcas(ubicacionId);
                const marcasData = useInventariosStore.getState().marcas[ubicacionId] || [];
                const marcasNombres = marcasData.map((marca: any) => marca.nombre || marca.nombre_mprod || marca);
                setMarcas(marcasNombres);
                // Cargar categorías
                await fetchCategorias(ubicacionId);
                const categoriasData = useInventariosStore.getState().categorias[ubicacionId] || [];
                const categoriasNombres = categoriasData.map((categoria: any) => categoria.nombre || categoria);
                setCategorias(categoriasNombres);
            } catch (error) {
                console.error('Error cargando marcas y categorías:', error);
                setMarcas([]);
                setCategorias([]);
            }
        };
        cargarMarcasYCategorias();
        // eslint-disable-next-line
    }, []); // Solo ejecutar una vez al montar

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

        // 1. Marcar como despachada en el backend
        try {
            await solicitudesService.updateSolicitud(solicitud.id.toString(), { despachada: true });
        } catch (error: any) {
            
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
            const personalEntregaRaw = await personalEntregaService.getPersonalEntrega({ 
                bodega_id: usuario?.bodega?.toString() 
            });
            const personalEntrega = Array.isArray(personalEntregaRaw)
                ? personalEntregaRaw
                : personalEntregaRaw.results || [];
            let personalEncontrado = personalEntrega.find((p: any) => p.usuario_fk === transportista.id_us || p.usuario_fk === transportista.id);
            
            if (!personalEncontrado) {
                // Si no existe, crear el personal de entrega
               
                const nuevoPersonal = await personalEntregaService.crearDesdeUsuario({
                    usuario_id: parseInt(transportista.id_us || transportista.id),
                    patente: 'N/A',
                    descripcion_psn: 'Transportista asignado' // <--- usa el nombre correcto
                });
                personalEncontrado = nuevoPersonal.personal_entrega;
            }
            
            // Crear el pedido usando el endpoint específico
            const pedidoCreado = await pedidosService.crearDesdeSolicitud({
                solicitud_id: solicitud.id,
                personal_entrega_id: personalEncontrado.id_psn,
                descripcion: `Pedido generado desde solicitud ${solicitud.id}`
            });


            // Usar el pedido real creado en la BD para la UI
            const sucursalId = SUCURSALES.find(s => s.nombre === solicitud.sucursalDestino)?.id || "";
            nuevoPedido = {
                id: pedidoCreado.pedido.id_p, // Usar ID real de la BD
                fecha: new Date().toISOString(),
                responsable: usuario?.nombre || "Responsable Bodega",
                productos: solicitud.productos,
                sucursalDestino: sucursalId,
                cantidad: solicitud.productos.reduce((acc: number, p: any) => acc + p.cantidad, 0),
                tipo: "salida" as const,
                asignado: solicitud.asignado,
                ociAsociada: solicitud.id,
                observacion: solicitud.observacion || "",
                bodegaOrigen: "Bodega Central",
                direccionBodega: "Camino a Penco 2500, Concepción",
                direccionSucursal: SUCURSALES.find(s => s.id === sucursalId)?.direccion || "-",
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
            
            // Crear informe en la base de datos
            try {
                const contenidoInforme = {
                    pedido_id: nuevoPedido.id,
                    solicitud_id: solicitud.id,
                    fecha: nuevoPedido.fecha,
                    responsable: nuevoPedido.responsable,
                    sucursal: {
                        id: nuevoPedido.sucursalDestino,
                        nombre: solicitud.sucursalDestino,
                        direccion: nuevoPedido.direccionSucursal
                    },
                    bodega: {
                        nombre: nuevoPedido.bodegaOrigen,
                        direccion: nuevoPedido.direccionBodega
                    },
                    productos: nuevoPedido.productos.map((prod: any) => ({
                        nombre: prod.nombre,
                        cantidad: prod.cantidad,
                        codigo: prod.codigo || `${prod.nombre}-${Date.now()}`.replace(/\s+/g, "-").toLowerCase()
                    })),
                    transportista: {
                        nombre: nuevoPedido.asignado,
                        patente: nuevoPedido.patenteVehiculo
                    },
                    observaciones: nuevoPedido.observacion,
                    oci_asociada: solicitud.id
                };
                
                // Función para validar si ya existe un informe con el mismo título y módulo
                const existeInformeDuplicado = (titulo: string, modulo_origen: string) => {
                    // Buscar en el estado local de informes si está disponible, o hacer una petición si es necesario
                    // Aquí se asume que tienes acceso a los informes en el estado o prop
                    if (!Array.isArray(window.informesGlobal)) return false;
                    return window.informesGlobal.some(
                        (inf: any) => inf.titulo === titulo && inf.modulo_origen === modulo_origen
                    );
                };
                
                if (existeInformeDuplicado(`Guía de Despacho - Pedido ${nuevoPedido.id}`, 'pedidos')) {
                    alert("Ya existe un informe con este título y módulo.");
                    return;
                }
                
                await informesService.createInforme({
                    titulo: `Guía de Despacho - Pedido ${nuevoPedido.id}`,
                    descripcion: `Guía de despacho generada para el pedido ${nuevoPedido.id} hacia ${solicitud.sucursalDestino}`,
                    modulo_origen: 'pedidos',
                    contenido: JSON.stringify(contenidoInforme),
                    archivo_url: `GuiaDespacho_${nuevoPedido.id}.pdf`,
                    fecha_generado: new Date().toISOString(),
                    bodega_fk: usuario?.bodega || null,
                    pedidos_fk: nuevoPedido.id
                });
                if (typeof window.fetchInformes === 'function') window.fetchInformes();
                
                console.log('✅ Informe de guía de despacho creado exitosamente');
            } catch (error) {
                console.error('Error al crear informe de guía de despacho:', error);
                // No mostrar error al usuario, solo log
            }
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

    // --- MOVER FUERA DEL useEffect ---
    const fetchPedidos = async () => {
        if (!usuario?.bodega) return;
        setLoading(true);
        try {
            const pedidosResponse = await pedidosService.getPedidos({ bodega_id: usuario.bodega.toString() });
            setPedidosBackend(pedidosResponse.results || []);
        } catch (error) {
            setPedidosBackend([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPedidos();
    }, [usuario?.bodega]);

    // Separar ingresos y salidas usando los campos reales del backend
    const ingresos = useMemo(() => pedidosBackend.filter(p => p.proveedor_fk), [pedidosBackend]);
    const salidas = useMemo(() => pedidosBackend.filter(p => p.sucursal_fk), [pedidosBackend]);

    // Filtros aplicados a los datos
    const pedidosFiltrados = useMemo(() => {
        let datos = opcion === 'ingresos' ? ingresos : salidas;
        datos = datos.filter((row) => {
            if (opcion === "ingresos") {
                if (fecha && row.fecha !== fecha) return false;
                return true;
            }
            if (opcion === "salidas") {
                if (estado && row.estado !== estado) return false;
                if (sucursal && row.sucursalDestino !== sucursal && row.sucursal !== sucursal) return false;
                if (fecha && row.fecha !== fecha) return false;
                return true;
            }
            return false;
        });
        // Ordenar por fecha descendente (más recientes primero)
        return [...datos].sort((a, b) => {
            const fechaA = new Date(a.fecha_entrega || a.fecha).getTime();
            const fechaB = new Date(b.fecha_entrega || b.fecha).getTime();
            return fechaB - fechaA;
        });
    }, [ingresos, salidas, estado, sucursal, fecha, opcion]);

    const handleOpenDetailModal = (pedido: any) => {
        setPedidoSeleccionado(pedido);
        setOpenDetailModal(true);
    };

    const handleCloseDetailModal = () => {
        setOpenDetailModal(false);
        setPedidoSeleccionado(null);
    };

    // Función para extraer modelo/variante desde el nombre (igual que backend)
    const extraerModeloDesdeNombre = (nombre: string) => {
        // Buscar patrones numéricos con unidades (10m, 500ml, 2L, etc.)
        const match = nombre.match(/(\d+\s?(m|ml|l|kg|g|cm|mm|pcs|un|lt|mts|mt|x\d+))/i);
        if (match) {
            return match[0].replace(' ', '').toUpperCase();
        }
        // Buscar palabras relevantes (color, tamaño, etc.)
        const match2 = nombre.match(/(rojo|azul|verde|negro|blanco|grande|pequeño|mediano|extra)/i);
        if (match2) {
            return match2[0].toUpperCase();
        }
        return 'GEN';
    };

    // Función para previsualizar el código interno generado (igual que backend)
    const previsualizarCodigo = (producto: any) => {
        if (producto?.nombre && producto?.marca && producto?.categoria) {
            const categoria_prefijo = producto.categoria.substring(0, 4).toUpperCase();
            const marca_prefijo = producto.marca.substring(0, 4).toUpperCase();
            let modelo_prefijo = 'GEN';
            if (producto.modelo && producto.modelo.trim() !== '') {
                modelo_prefijo = producto.modelo.substring(0, 4).toUpperCase();
            } else {
                modelo_prefijo = extraerModeloDesdeNombre(producto.nombre);
            }
            const fecha = new Date().toISOString().slice(0, 7).replace('-', '');
            return `${categoria_prefijo}-${marca_prefijo}-${modelo_prefijo}-${fecha}-001`;
        }
        return "Se generará automáticamente";
    };

    // Función para verificar producto existente
    const verificarProductoExistente = async (producto: any) => {
        try {
            const codigo = previsualizarCodigo();
            if (codigo === "Código se generará automáticamente") return null;
            
            const response = await solicitudesService.getProductoCodigoUnico(codigo);
            return response.data.producto;
        } catch (error) {
            return null; // Producto no existe
        }
    };

    // Función para buscar productos similares
    const buscarProductosSimilaresLocal = async (producto: any) => {
        try {
            console.log('🔍 DEBUG - Buscando productos similares para:', producto);
            console.log('🔍 DEBUG - Bodega ID:', usuario?.bodega);
            
            // Prioridad 1: Buscar por código interno exacto si está disponible
            const codigo_interno = producto.codigo_interno || producto.codigo || undefined;
            
            // Prioridad 2: Buscar por nombre exacto (sin marca/categoría para dar máxima prioridad al nombre)
            const response = await buscarProductosSimilares({
                nombre: producto.nombre,
                // Solo enviar marca y categoría si NO hay código interno
                ...(codigo_interno ? {} : {
                    marca: producto.marca,
                    categoria: producto.categoria
                }),
                bodega_id: usuario?.bodega,
                ...(codigo_interno ? { codigo_interno } : {})
            });
            
            console.log('🔍 DEBUG - Respuesta del backend:', response);
            
            if (response.productos_similares && response.productos_similares.length > 0) {
                console.log('🔍 DEBUG - Productos similares encontrados:', response.productos_similares.length);
                
                // Solo actualizar los productos similares actuales para el modal de validación múltiple
                setProductosSimilaresActual(response.productos_similares);
                
                return true; // Hay productos similares
            }
            console.log('🔍 DEBUG - No se encontraron productos similares');
            return false; // No hay productos similares
        } catch (error) {
            console.error('❌ ERROR - Error buscando productos similares:', error);
            return false;
        }
    };

    // Función para agregar producto con reconocimiento (DEPRECATED - usar validarTodosLosProductos)
    const agregarProductoConReconocimiento = async () => {
        console.log('⚠️ DEPRECATED: usar validarTodosLosProductos en su lugar');
    };

    // Función para confirmar uso de producto existente (DEPRECATED - usar manejarDecisionProducto)
    const confirmarProductoExistente = async (productoExistente: any) => {
        console.log('⚠️ DEPRECATED: usar manejarDecisionProducto en su lugar');
    };

    // Función para crear nuevo producto (DEPRECATED - usar manejarDecisionProducto)
    const crearNuevoProducto = async () => {
        console.log('⚠️ DEPRECATED: usar manejarDecisionProducto en su lugar');
    };

    // Función para procesar el ingreso con el producto modificado (DEPRECATED - usar procesarIngresoConProductosValidados)
    const procesarIngresoConProductoModificado = async (productoModificado: any) => {
        console.log('⚠️ DEPRECATED: usar procesarIngresoConProductosValidados en su lugar');
    };

    // Función para validar todos los productos del formulario
    const validarTodosLosProductos = async (productos: any[]) => {
        console.log('🔍 DEBUG - Validando todos los productos:', productos);
        console.log('🔍 DEBUG - Usuario bodega:', usuario?.bodega);
        
        const productosConSimilares = [];
        const productosSinSimilares = [];
        
        // Validar cada producto
        for (const producto of productos) {
            try {
                console.log('🔍 DEBUG - Validando producto:', producto);
                const haySimilares = await buscarProductosSimilaresLocal(producto);
                console.log('🔍 DEBUG - ¿Hay similares?', haySimilares);
                if (haySimilares) {
                    productosConSimilares.push(producto);
                } else {
                    productosSinSimilares.push(producto);
                }
            } catch (error) {
                console.error('Error validando producto:', error);
                productosSinSimilares.push(producto);
            }
        }
        
        console.log('🔍 DEBUG - Productos con similares:', productosConSimilares.length);
        console.log('🔍 DEBUG - Productos sin similares:', productosSinSimilares.length);
        
        if (productosConSimilares.length > 0) {
            // Hay productos que necesitan validación
            console.log('🔍 DEBUG - Abriendo modal de validación múltiple');
            setProductosAValidar(productosConSimilares);
            setProductosValidados(productosSinSimilares);
            setProductoActualValidacion(productosConSimilares[0]);
            setModalValidacionMultiple(true);
            console.log('🔍 DEBUG - Modal de validación múltiple abierto');
            return false; // No continuar con el procesamiento
        }
        
        console.log('🔍 DEBUG - No hay productos similares, continuando con el procesamiento');
        return true; // Continuar con el procesamiento
    };

    // Función para manejar la decisión del usuario en el modal de validación múltiple
    const manejarDecisionProducto = async (decision: 'existente' | 'nuevo', productoExistente?: any) => {
        if (!productoActualValidacion) return;
    
        let productoFinal;
    
        if (decision === 'existente' && productoExistente) {
            productoFinal = {
                id: productoExistente.id || productoExistente.id_prodc,
                cantidad: productoActualValidacion.cantidad,
                es_producto_existente: true
            };
        } else {
            productoFinal = {
                ...productoActualValidacion,
                es_producto_existente: false
            };
        }
    
        // Remover TODOS los productos iguales de productos a validar
        const productosRestantes = productosAValidar.filter(p =>
            !(
                p.nombre === productoActualValidacion.nombre &&
                p.marca === productoActualValidacion.marca &&
                p.categoria === productoActualValidacion.categoria
            )
        );
    
        if (productosRestantes.length === 0) {
            setProductosValidados(prev => {
                const nuevosProductosValidados = [...prev, productoFinal];
                setModalValidacionMultiple(false);
                // Llama a la función de procesamiento usando el array actualizado
                procesarIngresoConProductosValidados(nuevosProductosValidados);
                return nuevosProductosValidados;
            });
        } else {
            setProductosValidados(prev => [...prev, productoFinal]);
            setProductosAValidar(productosRestantes);
            setProductoActualValidacion(productosRestantes[0]);
            setProductosSimilaresActual([]);
            setProductoSeleccionado(null);
        }
    };

    // Cambia la función de procesamiento para aceptar el array como parámetro
    const procesarIngresoConProductosValidados = async (productosFinalesParam?: any[]) => {
        try {
            // Usa el array pasado como argumento, si viene, si no, usa el de estado
            const productosFinales = productosFinalesParam || productosValidados;

            if (!productosFinales || productosFinales.length === 0) {
                throw new Error('No hay productos para procesar. El array de productos está vacío.');
            }

            const bodegaId = usuario?.bodega;
            if (!bodegaId) {
                throw new Error('No se pudo obtener el ID de la bodega del usuario');
            }

            const datosFormulario = datosFormularioPendiente;
            if (!datosFormulario) {
                throw new Error('No se encontraron los datos del formulario');
            }

            // Eliminar numGuiaDespacho del objeto antes de enviar
            const { numGuiaDespacho, ...restFormulario } = datosFormulario;

            const datosFinales = {
                ...restFormulario,
                num_guia_despacho: numGuiaDespacho, // Solo snake_case
                productos: productosFinales
                    .filter((p: any) =>
                        (p.es_producto_existente && p.id && p.cantidad > 0) ||
                        (!p.es_producto_existente && p.nombre && p.marca && p.categoria && p.cantidad > 0)
                    )
                    .map((p: any) =>
                        p.es_producto_existente
                            ? { es_producto_existente: true, id: p.id, cantidad: p.cantidad }
                            : {
                                nombre: p.nombre,
                                cantidad: p.cantidad,
                                marca: p.marca,
                                categoria: p.categoria,
                                modelo: p.modelo || undefined,
                                ...(p.codigo_interno ? { codigo_interno: p.codigo_interno } : {})
                            }
                    ),
                bodega_id: bodegaId
            };
            console.log("DEBUG productosFinales:", productosFinales);
            console.log("DEBUG productos enviados:", datosFinales.productos);

            // Crear el ingreso en el backend
            const resultado = await pedidosService.crearIngresoBodega(datosFinales);

            // Obtener el ID real del pedido creado
            const pedidoIdReal = resultado.pedido_id;
            if (!pedidoIdReal) throw new Error('No se pudo obtener el ID real del pedido creado');

            // Recargar productos para mostrar el stock actualizado
            await fetchProductos(bodegaId);
            // --- AGREGADO: Refrescar pedidos para ver el estado actualizado ---
            await fetchPedidos();

            setSnackbarMessage(`Ingreso creado exitosamente. ${resultado.productos_agregados?.length || 0} productos agregados al inventario.`);
            setSnackbarSeverity("success");
            setShowSnackbar(true);

            // Crear informe
            try {
                const contenidoInforme = {
                    ingreso_id: pedidoIdReal,
                    fecha: datosFormulario.fecha,
                    proveedor: {
                        nombre: datosFormulario.proveedor.nombre,
                        rut: datosFormulario.proveedor.rut,
                        contacto: datosFormulario.proveedor.contacto
                    },
                    productos: productosFinales.map((prod: any) => ({
                        nombre: prod.nombre,
                        marca: prod.marca,
                        categoria: prod.categoria,
                        cantidad: prod.cantidad
                    })),
                    documentos: {
                        num_rem: datosFormulario.numRem || '',
                        num_guia_despacho: datosFormulario.numGuiaDespacho || '',
                        archivo_guia: datosFormulario.nombreArchivo || ''
                    },
                    observaciones: datosFormulario.observacionesRecepcion || '',
                    responsable: usuario?.nombre || '',
                    bodega: {
                        nombre: "Bodega Central",
                        direccion: "Camino a Penco 2500, Concepción"
                    }
                };

                // Función para validar si ya existe un informe con el mismo título y módulo
                const existeInformeDuplicado = (titulo: string, modulo_origen: string) => {
                    // Buscar en el estado local de informes si está disponible, o hacer una petición si es necesario
                    // Aquí se asume que tienes acceso a los informes en el estado o prop
                    if (!Array.isArray(window.informesGlobal)) return false;
                    return window.informesGlobal.some(
                        (inf: any) => inf.titulo === titulo && inf.modulo_origen === modulo_origen
                    );
                };
                
                if (existeInformeDuplicado(`Informe de Ingreso - Pedido ${pedidoIdReal}`, 'pedidos')) {
                    alert("Ya existe un informe con este título y módulo.");
                    return;
                }

                await informesService.createInforme(contenidoInforme);
            } catch (error) {
                console.error('Error creando informe:', error);
            }

            // Limpiar estados
            setDatosFormularioPendiente(null);
            setModalValidacionMultiple(false);
            setProductosAValidar([]);
            setProductosValidados([]);
            setProductoActualValidacion(null);
            setProductosSimilaresActual([]);
            setProcesandoIngreso(false);

        } catch (error) {
            console.error('Error procesando ingreso:', error);
            setSnackbarMessage('Error al procesar el ingreso');
            setSnackbarSeverity("error");
            setShowSnackbar(true);
            setProcesandoIngreso(false);
        }
    };

    // Efecto para procesar automáticamente cuando todos los productos han sido validados
    useEffect(() => {
        if (productosAValidar.length === 0 && productosValidados.length > 0 && modalValidacionMultiple && !procesandoIngreso) {
            console.log('🔍 DEBUG - Efecto detectó que todos los productos han sido validados');
            console.log('🔍 DEBUG - Productos validados en el efecto:', productosValidados);
            setProcesandoIngreso(true);
            procesarIngresoConProductosValidados();
        }
    }, [productosAValidar.length, productosValidados.length, modalValidacionMultiple, procesandoIngreso]);

    // Nuevo estado para la pestaña activa y pedidos paginados
    const [pestanaActiva, setPestanaActiva] = useState<'ingresos' | 'salidas'>('ingresos');
    const [pedidosMostrados, setPedidosMostrados] = useState<any[]>([]);
    const [loadingPedidos, setLoadingPedidos] = useState(false);
    const PEDIDOS_POR_PAGINA = 10;

    // Función para cargar solo los pedidos más recientes de la pestaña activa
    const cargarPedidosRecientes = async () => {
        setLoadingPedidos(true);
        try {
            const tipo = pestanaActiva === 'ingresos' ? 'ingreso' : 'salida';
            const data = await getPedidosRecientes({ tipo, limit: PEDIDOS_POR_PAGINA, offset: 0 });
            setPedidosMostrados(data.pedidos || []);
        } catch (error) {
            setPedidosMostrados([]);
        }
        setLoadingPedidos(false);
    };

    // Cargar pedidos cuando cambia la pestaña activa o el array de pedidos
    useEffect(() => {
        cargarPedidosRecientes();
        // eslint-disable-next-line
    }, [pestanaActiva, pedidosArray]);

    // Estados para paginación
    const [paginaActual, setPaginaActual] = useState(1);

    // Calcular los pedidos a mostrar según la pestaña y la página
    const datosFiltrados = useMemo(() => {
        let datos = opcion === 'ingresos' ? ingresos : salidas;
        // Aquí puedes agregar más filtros si lo deseas
        return datos;
    }, [ingresos, salidas, opcion]);

    const totalPaginas = Math.ceil(datosFiltrados.length / PEDIDOS_POR_PAGINA);
    const pedidosPaginados = datosFiltrados.slice(
        (paginaActual - 1) * PEDIDOS_POR_PAGINA,
        paginaActual * PEDIDOS_POR_PAGINA
    );

    // Resetear página cuando cambian los datos filtrados
    useEffect(() => {
        setPaginaActual(1);
    }, [opcion, ingresos, salidas]);

    const existeGuiaProveedor = (numGuia: string) => {
        const normalizar = (str: string) => (str || "").trim().toLowerCase();
        // Filtra solo ingresos de proveedores (donde existe proveedor_fk o proveedor_nombre)
        return pedidosBackend
            .filter(p => p.proveedor_fk || p.proveedor_nombre)
            .some(
                p => normalizar(p.num_guia_despacho || p.numGuiaDespacho) === normalizar(numGuia)
            );
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
                    severity={snackbarSeverity}
                    sx={{ width: "100%", cursor: "pointer" }}
                >
                    {snackbarMessage || `Se han transferido ${transferencias} solicitud(es) aprobada(s) como pedido(s) a este módulo. Haz clic para verlas.`}
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
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon sx={{ color: '#FFD700' }} />}
                        onClick={() => {
                            setLoading(true);
                            cargarPedidosRecientes().finally(() => setLoading(false));
                        }}
                        style={{
                            borderColor: "#FFD700",
                            color: "#FFD700",
                            fontWeight: 600,
                        }}
                    >
                        Refrescar
                    </Button>
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

                    
                </div>

                {opcion === 'ingresos' ? (
                    <TablaIngresos ingresos={pedidosPaginados} onVerDetalles={handleOpenDetailModal} loading={loading} />
                ) : (
                    <TablaSalidas salidas={pedidosPaginados} onVerDetalles={handleOpenDetailModal} loading={loading} />
                )}
                {/* Paginación */}
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "24px 0" }}>
                    <Button
                        variant="outlined"
                        onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
                        disabled={paginaActual === 1}
                        style={{ marginRight: 8, borderColor: '#FFD700', color: '#FFD700', fontWeight: 600 }}
                    >
                        Anterior
                    </Button>
                    <span style={{ color: "#FFD700", fontWeight: 600, margin: "0 16px" }}>
                        Página {paginaActual} de {totalPaginas}
                    </span>
                    <Button
                        variant="outlined"
                        onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
                        disabled={paginaActual === totalPaginas || totalPaginas === 0}
                        style={{ marginLeft: 8, borderColor: '#FFD700', color: '#FFD700', fontWeight: 600 }}
                    >
                        Siguiente
                    </Button>
                </div>
                <div ref={tablaTransferidasRef} style={{ marginTop: 40 }}>
                    <h3 style={{ color: "#FFD700" }}>Solicitudes transferidas recientemente</h3>
                    <TableContainer component={Paper} style={{ background: "#232323" }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell style={{ color: "#FFD700" }}>ID</TableCell>
                                    <TableCell style={{ color: "#FFD700" }}>Fecha</TableCell>
                                    <TableCell style={{ color: "#FFD700" }}>Proveedor</TableCell>
                                    <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>N° de productos</TableCell>
                                    <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Guía de Despacho</TableCell>
                                    <TableCell style={{ color: "#FFD700", fontWeight: 700 }}>Acción</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {solicitudesTransferidas.filter(s => Number(s.id) > 0 && Array.isArray(s.productos) && s.productos.length > 0).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" style={{ color: "#8A8A8A" }}>
                                            No hay solicitudes transferidas.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    solicitudesTransferidas
                                        .filter(s => Number(s.id) > 0 && Array.isArray(s.productos) && s.productos.length > 0)
                                        .map((s: any, idx: number) => {

                                            // Calcular cantidad total
                                            
                                            return (
                                                <TableRow key={`${s.id}-${idx}`}>
                                                    <TableCell style={{ color: "#fff" }}>{s.id}</TableCell>
                                                    <TableCell style={{ color: "#fff" }}>{formatFechaChile(s.fecha)}</TableCell>
                                                    <TableCell style={{ color: "#fff" }}>{s.responsable}</TableCell>
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
                                                    <TableCell style={{ color: "#fff" }}>{s.numGuiaDespacho || s.num_guia_despacho || '—'}</TableCell>
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
                        📋 Detalles del Pedido #{pedidoSeleccionado?.id || pedidoSeleccionado?.id_p}
                    </DialogTitle>
                    <DialogContent sx={{ bgcolor: "#1a1a1a", color: "#fff" }}>
                        {pedidoSeleccionado && (
                            <>
                                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 3, p: 2, bgcolor: "#232323", borderRadius: 2, border: "1px solid #333" }}>
                                    <TextField
                                        label="ID del Pedido"
                                        value={pedidoSeleccionado.id || pedidoSeleccionado.id_p}
                                        InputProps={{ readOnly: true, sx: { color: "#FFD700", fontWeight: 600 } }}
                                        size="small"
                                        sx={{ "& .MuiInputLabel-root": { color: "#ccc" }, "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: "#444" }, "&:hover fieldset": { borderColor: "#FFD700" } } }}
                                    />
                                    <TextField
                                        label="Fecha"
                                        value={formatFechaChile(pedidoSeleccionado.fecha || pedidoSeleccionado.fecha_entrega)}
                                        InputProps={{ readOnly: true, sx: { color: "#fff" } }}
                                        size="small"
                                        sx={{ "& .MuiInputLabel-root": { color: "#ccc" }, "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: "#444" }, "&:hover fieldset": { borderColor: "#FFD700" } } }}
                                    />
                                    <TextField
                                        label="Responsable"
                                        value={
                                            pedidoSeleccionado.responsable || 
                                            pedidoSeleccionado.responsable_nombre || 
                                            pedidoSeleccionado.usuario_nombre || 
                                            pedidoSeleccionado.personal_entrega_nombre || 
                                            "-"
                                        }
                                        InputProps={{ readOnly: true, sx: { color: "#fff" } }}
                                        size="small"
                                        sx={{ "& .MuiInputLabel-root": { color: "#ccc" }, "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: "#444" }, "&:hover fieldset": { borderColor: "#FFD700" } } }}
                                    />
                                    <TextField
                                        label={opcion === "ingresos" ? "Proveedor" : "Sucursal destino"}
                                        value={
                                            opcion === "ingresos"
                                                ? (
                                                    pedidoSeleccionado.proveedor?.nombre ||
                                                    pedidoSeleccionado.proveedor_nombre ||
                                                    pedidoSeleccionado.proveedorName ||
                                                    pedidoSeleccionado.proveedor ||
                                                    "-"
                                                )
                                                : (pedidoSeleccionado.sucursal_nombre || pedidoSeleccionado.sucursalDestino || "-")
                                        }
                                        InputProps={{ readOnly: true, sx: { color: "#fff" } }}
                                        size="small"
                                        sx={{ "& .MuiInputLabel-root": { color: "#ccc" }, "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: "#444" }, "&:hover fieldset": { borderColor: "#FFD700" } } }}
                                    />
                                </Box>
                                {/* Estado con badge */}
                                <Box sx={{ mb: 3, p: 2, bgcolor: "#232323", borderRadius: 2, border: "1px solid #333" }}>
                                    <Typography variant="subtitle2" sx={{ color: "#ccc", mb: 1 }}>
                                        Estado del pedido
                                    </Typography>
                                    <Chip
                                        label={
                                            (pedidoSeleccionado.tipo === "ingreso")
                                                ? "Completado"
                                                : (pedidoSeleccionado.estado || pedidoSeleccionado.estado_pedido_nombre || "Pendiente")
                                        }
                                        sx={{
                                            bgcolor: (pedidoSeleccionado.tipo === "ingreso" || (pedidoSeleccionado.tipo === "salida" && ((pedidoSeleccionado.estado || pedidoSeleccionado.estado_pedido_nombre) === "Completado")))
                                                ? "#4CAF50"
                                                : (pedidoSeleccionado.estado === "En camino" || pedidoSeleccionado.estado_pedido_nombre === "En camino") ? "#2196F3"
                                                : (pedidoSeleccionado.estado === "Cancelado" || pedidoSeleccionado.estado_pedido_nombre === "Cancelado") ? "#f44336"
                                                : "#FF9800",
                                            color: "#fff",
                                            fontWeight: 600,
                                            fontSize: "0.9rem"
                                        }}
                                    />
                                </Box>
                                {/* Número de guía de despacho para ingresos */}
                                {opcion === "ingresos" && (pedidoSeleccionado.numGuiaDespacho || pedidoSeleccionado.num_guia_despacho) && (
                                    <Box sx={{ mb: 3, p: 2, bgcolor: "#232323", borderRadius: 2, border: "1px solid #333" }}>
                                        <Typography variant="subtitle2" sx={{ color: "#FFD700", mb: 1 }}>
                                            📄 Número de Guía de Despacho
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: "#fff", fontWeight: 600 }}>
                                            {pedidoSeleccionado.numGuiaDespacho || pedidoSeleccionado.num_guia_despacho}
                                        </Typography>
                                    </Box>
                                )}
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
                                                InputProps={{ readOnly: true, sx: { color: "#fff" } }}
                                                size="small"
                                                sx={{ "& .MuiInputLabel-root": { color: "#ccc" }, "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: "#444" }, "&:hover fieldset": { borderColor: "#FFD700" } } }}
                                            />
                                        </Box>
                                    </Box>
                                )}
                                {/* Productos */}
                                <Box sx={{ p: 2, bgcolor: "#232323", borderRadius: 2, border: "1px solid #333" }}>
                                    <Typography variant="h6" sx={{ color: "#FFD700", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                                        📦 Productos del pedido ({pedidoSeleccionado.productos?.length || pedidoSeleccionado.detalles_pedido?.length || 0})
                                    </Typography>
                                    {(!pedidoSeleccionado.productos && !pedidoSeleccionado.detalles_pedido) || (pedidoSeleccionado.productos?.length === 0 && pedidoSeleccionado.detalles_pedido?.length === 0) ? (
                                        <Box sx={{ textAlign: "center", py: 3, color: "#8A8A8A", fontStyle: "italic" }}>
                                            No hay productos en este pedido
                                        </Box>
                                    ) : (
                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{ color: "#FFD700", fontWeight: 600 }}>Producto</TableCell>
                                                        <TableCell sx={{ color: "#FFD700", fontWeight: 600 }}>Código</TableCell>
                                                        <TableCell sx={{ color: "#FFD700", fontWeight: 600 }} align="right">Cantidad</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {(pedidoSeleccionado.productos || pedidoSeleccionado.detalles_pedido || []).map((prod: any, idx: number) => (
                                                        <TableRow key={idx} sx={{ "&:hover": { bgcolor: "#2a2a2a" } }}>
                                                            <TableCell sx={{ color: "#fff" }}>
                                                                {prod.nombre || prod.producto_nombre || 'N/A'}
                                                            </TableCell>
                                                            <TableCell sx={{ color: "#fff" }}>
                                                                {prod.codigo || prod.codigo_interno || prod.producto_codigo || '—'}
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
                            </>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ bgcolor: "#1a1a1a", borderTop: "1px solid #333", p: 2 }}>
                        <Button 
                            onClick={handleCloseDetailModal} 
                            sx={{ color: "#FFD700", borderColor: "#FFD700", "&:hover": { borderColor: "#FFD700", bgcolor: "rgba(255, 215, 0, 0.1)" } }}
                            variant="outlined"
                        >
                            Cerrar
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Modal de Reconocimiento de Productos - ELIMINADO */}
                {/* Modal de Validación Múltiple de Productos */}
                <Dialog 
                    open={modalValidacionMultiple} 
                    onClose={() => setModalValidacionMultiple(false)}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: {
                            bgcolor: '#1a1a1a',
                            color: '#fff',
                            borderRadius: 3,
                            boxShadow: 24,
                            p: 0,
                        }
                    }}
                >
                    <DialogTitle sx={{ 
                        bgcolor: '#232323', 
                        color: '#FFD700', 
                        fontWeight: 700, 
                        fontSize: 22, 
                        borderBottom: '1px solid #333',
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 2
                    }}>
                        <span style={{fontSize: 28}}>🔎</span> ¿Qué hacer con este producto?
                    </DialogTitle>
                    <DialogContent sx={{ bgcolor: '#1a1a1a', p: 3 }}>
                        {productoActualValidacion && (
                            <Box>
                                {/* Mostrar número de producto actual y total */}
                                <Typography variant="subtitle2" sx={{ color: '#FFD700', fontWeight: 600, mb: 1 }}>
                                    Producto {productosValidados.length + 1} de {productosAValidar.length + productosValidados.length}
                                </Typography>
                                <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 700, mb: 1 }}>
                                    Ya existe un producto similar en el inventario
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#ccc', mb: 3 }}>
                                    Puedes <b>sumar la cantidad</b> al stock existente o <b>registrar como producto nuevo</b> si es diferente.<br/>
                                    <span style={{ color: '#FF9800', fontWeight: 500 }}>Revisa bien los datos antes de decidir.</span>
                                </Typography>
                                <Grid container spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
                                    <Grid item xs={12} md={6}>
                                        {/* Producto a ingresar */}
                                        <Box sx={{
                                            bgcolor: '#232323',
                                            borderRadius: 2,
                                            p: 2,
                                            mb: 2,
                                            boxShadow: 2,
                                        }}>
                                            <Typography variant="h6" sx={{ mb: 1, color: '#fff' }}>Producto a ingresar</Typography>
                                            <Typography variant="body1" sx={{ color: '#bbb' }}>
                                                <b>Nombre:</b> {productoActualValidacion.nombre}
                                            </Typography>
                                            <Typography variant="body1" sx={{ color: '#bbb' }}>
                                                <b>Marca:</b> {productoActualValidacion.marca}
                                            </Typography>
                                            <Typography variant="body1" sx={{ color: '#bbb' }}>
                                                <b>Categoría:</b> {productoActualValidacion.categoria}
                                            </Typography>
                                            <Typography variant="body1" sx={{ color: '#bbb' }}>
                                                <b>Cantidad:</b> {productoActualValidacion.cantidad}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ bgcolor: '#232323', borderRadius: 2, border: '1px solid #444', p: 2 }}>
                                            <Typography variant="subtitle2" sx={{ color: '#FFD700', fontWeight: 600, mb: 1 }}>
                                                Productos similares en inventario
                                            </Typography>
                                            {productosSimilaresActual.length > 0 ? (
                                                <List dense>
                                                    {productosSimilaresActual.map((producto, index) => (
                                                        <ListItem 
                                                            key={index}
                                                            selected={productoSeleccionado?.id === producto.id}
                                                            onClick={() => setProductoSeleccionado(producto)}
                                                            sx={{
                                                                border: productoSeleccionado?.id === producto.id ? '2px solid #FFD700' : '1px solid #444',
                                                                borderRadius: 1,
                                                                mb: 1,
                                                                cursor: 'pointer',
                                                                bgcolor: productoSeleccionado?.id === producto.id ? '#FFD70022' : '#232323',
                                                                '&:hover': { bgcolor: '#FFD70011' }
                                                            }}
                                                        >
                                                            <ListItemText
                                                                primary={<span style={{ color: '#FFD700', fontWeight: 600 }}>
                                                                    {producto.nombre_prodc ? <b>{producto.nombre_prodc}</b> : (producto.nombre ? <b>{producto.nombre}</b> : 'Sin nombre')}
                                                                </span>}
                                                                secondary={<>
                                                                    <span style={{ color: '#ccc' }}>
                                                                        Marca: {producto.marca_nombre ? <b>{producto.marca_nombre}</b> : producto.marca || '-'} |
                                                                        Categoría: {producto.categoria_nombre ? <b>{producto.categoria_nombre}</b> : producto.categoria || '-'} |
                                                                        <b>Stock actual:</b> <span style={{ color: producto.stock > 0 ? '#4CAF50' : '#F44336', fontWeight: 600 }}>{producto.stock ?? 0}</span><br/>
                                                                        <b>Código:</b> {producto.codigo_interno || '—'}
                                                                    </span>
                                                                </>}
                                                            />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            ) : (
                                                <Typography variant="body2" sx={{ color: '#ccc' }}>
                                                    No se encontraron productos similares. Se creará como nuevo producto.
                                                </Typography>
                                            )}
                                        </Box>
                                    </Grid>
                                </Grid>
                                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
                                    <Tooltip title="Registrar como producto nuevo, aunque sea similar.">
                                        <Button 
                                            onClick={() => manejarDecisionProducto('nuevo')}
                                            variant="contained"
                                            sx={{ bgcolor: '#FFD700', color: '#232323', fontWeight: 700, borderRadius: 2, px: 4, boxShadow: 2, '&:hover': { bgcolor: '#FFC700' } }}
                                        >
                                            Crear como producto nuevo
                                        </Button>
                                    </Tooltip>
                                    <Tooltip title="Sumar la cantidad al stock del producto seleccionado.">
                                        <span>
                                            <Button 
                                                onClick={() => manejarDecisionProducto('existente', productoSeleccionado)}
                                                variant="contained"
                                                disabled={!productoSeleccionado}
                                                sx={{ bgcolor: '#4CAF50', color: '#fff', fontWeight: 700, borderRadius: 2, px: 4, boxShadow: 2, '&:hover': { bgcolor: '#43a047' }, '&:disabled': { bgcolor: '#666', color: '#ccc' } }}
                                            >
                                                Sumar al stock existente
                                            </Button>
                                        </span>
                                    </Tooltip>
                                </Box>
                                <Box sx={{ mt: 4, textAlign: 'center' }}>
                                    <Typography variant="caption" sx={{ color: '#888' }}>
                                        Si tienes dudas, consulta con tu supervisor o revisa la documentación interna.
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ bgcolor: '#1a1a1a', borderTop: '1px solid #333', p: 2 }}>
                        <Button 
                            onClick={() => setModalValidacionMultiple(false)} 
                            sx={{ color: '#FFD700', borderColor: '#FFD700', fontWeight: 600, borderRadius: 2, '&:hover': { bgcolor: 'rgba(255, 215, 0, 0.1)' } }}
                            variant="outlined"
                        >
                            Cancelar
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Modal de ingreso/salida */}
                <ModalFormularioPedido
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    tipo={modalTipo || "ingreso"}
                    onSubmit={async (data) => {
                        // Validar productos similares antes de guardar
                        const continuar = await validarTodosLosProductos(data.productos);
                        if (!continuar) {
                            setDatosFormularioPendiente(data);
                            return;
                        }
                        try {
                            // Filtra los campos no permitidos en productos
                            const productosLimpios = data.productos.map((p: any) => ({
                                nombre: p.nombre,
                                cantidad: p.cantidad,
                                marca: p.marca,
                                categoria: p.categoria,
                                modelo: p.modelo || undefined
                            }));
                            // Eliminar numGuiaDespacho antes de enviar
                            const { numGuiaDespacho, ...restData } = data;
                            const datosApi = {
                                ...restData,
                                num_guia_despacho: numGuiaDespacho,
                                productos: productosLimpios,
                                proveedor: data.proveedor,
                                bodega_id: usuario?.bodega?.toString() || "bodega_central"
                            };
                            console.log("DEBUG SUBMIT PEDIDOSBODEGA:", datosApi);
                            await pedidosService.crearIngresoBodega(datosApi);
                            // Generar acta de recepción
                            generarActaRecepcion({
                                numeroActa: `ACTA-${Date.now()}`,
                                fechaRecepcion: data.fecha,
                                sucursal: {
                                    nombre: "Bodega Central",
                                    direccion: "Camino a Penco 2500, Concepción"
                                },
                                personaRecibe: {
                                    nombre: usuario?.nombre || "Responsable Bodega",
                                    cargo: usuario?.rol || "Bodeguero"
                                },
                                productos: productosLimpios.map((p: any, idx: number) => ({
                                    codigo: p.codigo || `PROD-${idx + 1}`,
                                    descripcion: p.nombre,
                                    cantidad: p.cantidad
                                })),
                                observaciones: data.observacionesRecepcion,
                                conformidad: "Recibido conforme",
                                responsable: usuario?.nombre || "Responsable Bodega",
                                proveedor: data.proveedor
                            });
                            setSnackbarMessage("Ingreso registrado exitosamente");
                            setSnackbarSeverity("success");
                            setShowSnackbar(true);
                            setIsModalOpen(false);
                            cargarPedidosRecientes();
                            // Forzar recarga del inventario con el mismo identificador
                            fetchProductos("bodega_central");
                        } catch (error) {
                            setSnackbarMessage("Error al registrar el ingreso");
                            setSnackbarSeverity("error");
                            setShowSnackbar(true);
                            // Lanzar el error para que el modal lo capture y lo muestre
                            throw error;
                        }
                    }}
                    existeGuiaProveedor={existeGuiaProveedor}
                />
            </div>
        </Layout>
    );
}