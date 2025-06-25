import React, { useState, useMemo, useCallback, useEffect } from "react";
import Layout from "../../components/layout/layout";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box, Card, CardActionArea,
    CardMedia, CardContent, Typography, MenuItem, IconButton, Alert, Chip
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useBodegaStore } from "../../store/useBodegaStore";
import { useAuthStore } from "../../store/useAuthStore";
import { generarOCI } from "../../utils/pdf/generarOCI";
import { SUCURSALES } from "../../constants/ubicaciones";
import { useInventariosStore } from "../../store/useProductoStore";
import { BODEGA_CENTRAL } from "../../constants/ubicaciones";
import sin_imagen from "../../assets/sin_imagen.png";
import { solicitudesService } from "../../services/api";
import EstadoBadge from "../../components/EstadoBadge";

interface Usuario {
    id: number;
    nombre: string;
    correo: string;
    rol: string;
    sucursalId?: string;
    sucursal?: number;
}

interface AuthState {
    usuario: Usuario | null;
    token: string | null;
    setUsuario: (usuario: Usuario, token: string) => void;
    logout: () => void;
}

interface BodegaState {
    solicitudes: Solicitud[];
    addSolicitud: (solicitud: Solicitud) => void;
    clearSolicitudes: () => void;
}

interface InventarioState {
    inventarios: { [key: string]: Producto[] };
    marcas: { [key: string]: string[] };
    categorias: { [key: string]: string[] };
}

interface Producto {
    code: string;
    name: string;
    description: string;
    stock: number;
    brand: string;
    category: string;
    im?: string | File | null;
    id_prodc?: string;
}

interface ProductoSolicitud {
    codigo: string;
    nombre: string;
    descripcion: string;
    cantidad: number;
    id_prodc?: string;
    stock_disponible: number;
}

interface Solicitud {
    id: number;
    sucursal: {
        id: string;
        nombre: string;
        direccion: string;
        rut: string;
    };
    bodega: string;
    fecha: string;
    responsable: string;
    cargo: string;
    observacion: string;
    productos: ProductoSolicitud[];
    estado: string;
    aprobador: string;
}

export default function SolicitudesSucursal() {
    // Hooks de estado global - Modificamos cómo accedemos al estado
    const usuario = useAuthStore((state: any) => state.usuario as AuthState['usuario']);
    
    // Separamos los selectores del inventario
    const inventarios = useInventariosStore((state: any) => state.inventarios as InventarioState['inventarios']);
    const marcas = useInventariosStore((state: any) => state.marcas as InventarioState['marcas']);
    const categorias = useInventariosStore((state: any) => state.categorias as InventarioState['categorias']);
    
    // Funciones del store de inventario
    const fetchProductos = useInventariosStore((state: any) => state.fetchProductos);
    const fetchMarcas = useInventariosStore((state: any) => state.fetchMarcas);
    const fetchCategorias = useInventariosStore((state: any) => state.fetchCategorias);

    // Cargar productos de la bodega central al montar el componente
    useEffect(() => {
        // Cargar productos de la bodega central (ID: 2)
        fetchProductos("bodega_central");
        fetchMarcas("bodega_central");
        fetchCategorias("bodega_central");
    }, [fetchProductos, fetchMarcas, fetchCategorias]);

    // Memoizamos los datos del inventario
    const inventarioBodegaCentral = useMemo(() => {
        const productos = inventarios["bodega_central"] || [];
        return productos;
    }, [inventarios]);

    const marcasBodegaCentral = useMemo(() => 
        marcas["bodega_central"] || [],
        [marcas]
    );

    const categoriasBodegaCentral = useMemo(() => 
        categorias["bodega_central"] || [],
        [categorias]
    );

    // Estados locales
    const [modalOpen, setModalOpen] = useState(false);
    const [modalResumenOpen, setModalResumenOpen] = useState(false);
    const [modalSeleccionarProductos, setModalSeleccionarProductos] = useState(false);
    const [modalConfirmarEliminacion, setModalConfirmarEliminacion] = useState(false);
    const [solicitudAEliminar, setSolicitudAEliminar] = useState<any>(null);
    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<any>(null);
    const [search, setSearch] = useState("");
    const [filtroMarca, setFiltroMarca] = useState("");
    const [filtroCategoria, setFiltroCategoria] = useState("");
    const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
    const [cantidadProducto, setCantidadProducto] = useState<number>(1);
    const [modalSeleccionado, setModalSeleccionado] = useState<any>(null);
    const [solicitudes, setSolicitudes] = useState<any[]>([]); // Estado para las solicitudes
    const [errorStock, setErrorStock] = useState<string>("");
    const [editandoProducto, setEditandoProducto] = useState<number | null>(null);
    const [cantidadEditando, setCantidadEditando] = useState<number>(1);
    const [loading, setLoading] = useState(false);

    // Memoizamos la sucursal del usuario
    const sucursalData = useMemo(() => {
        const sucursalId = usuario?.sucursalId?.toString(); // Convertimos a string si es número
        const sucursal = SUCURSALES.find(s => s.id === sucursalId);
        return sucursal || {
            id: "",
            nombre: "",
            direccion: "",
            rut: "",
            tipo: "sucursal"
        };
    }, [usuario?.sucursalId]);

    // Función para obtener las solicitudes de la sucursal
    const fetchSolicitudes = async () => {
        try {
            setLoading(true);
            if (sucursalData?.id) {
                const response = await solicitudesService.getSolicitudes({ 
                    sucursal_id: sucursalData.id.toString() 
                });
                setSolicitudes(response);
            }
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    // Cargar solicitudes al montar el componente
    useEffect(() => {
        fetchSolicitudes();
    }, [sucursalData?.id]);

    // Funciones para manejar el modal
    const handleOpenCrear = () => {
        setModalOpen(true);
    };

    const handleCloseCrear = () => {
        setModalOpen(false);
        // Limpiar el estado de la nueva solicitud
        setNuevaSolicitud({
            id: Math.floor(Math.random() * 9000) + 1000,
            fecha: new Date().toLocaleDateString(),
            sucursal: sucursalData,
            bodega: "Bodega Central",
            responsable: usuario?.nombre || "",
                            cargo: usuario?.rol || "",
            observacion: "",
            productos: [],
            estado: "Pendiente",
                            aprobador: ""
        });
    };

    const handleOpenResumen = (solicitud: any) => {
        setSolicitudSeleccionada(solicitud);
        setModalResumenOpen(true);
    };

    const handleCloseResumen = () => {
        setModalResumenOpen(false);
        setSolicitudSeleccionada(null);
    };

    const handleEliminarSolicitud = (solicitud: any) => {
        setSolicitudAEliminar(solicitud);
        setModalConfirmarEliminacion(true);
    };

    const handleConfirmarEliminacion = async () => {
        if (!solicitudAEliminar) return;

        try {
            await solicitudesService.deleteSolicitud(solicitudAEliminar.id_solc.toString());
            
            // Refrescar la lista de solicitudes
            await fetchSolicitudes();
            
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

    const generarOCIFunction = async (solicitud: any) => {
        // Función para generar el PDF de OCI
        
        // Usar directamente los datos del backend que ya incluyen todos los campos necesarios
        try {
            await generarOCI(solicitud);
        } catch (error) {
            alert("Error al generar el documento OCI");
        }
    };

    // Memoizamos los productos filtrados
    const productosFiltrados = useMemo(() => 
        inventarioBodegaCentral.filter(prod => {
            const matchesSearch = prod.name.toLowerCase().includes(search.toLowerCase());
            
            const marcaValue = typeof filtroMarca === 'string' ? filtroMarca : filtroMarca?.nombre || filtroMarca;
            const matchesMarca = !filtroMarca || prod.brand === marcaValue;
            
            const categoriaValue = typeof filtroCategoria === 'string' ? filtroCategoria : filtroCategoria?.nombre || filtroCategoria;
            const matchesCategoria = !filtroCategoria || prod.category === categoriaValue;
            
            return matchesSearch && matchesMarca && matchesCategoria;
        }),
        [inventarioBodegaCentral, search, filtroMarca, filtroCategoria]
    );

    // Memoizamos el estado inicial de nuevaSolicitud
    const estadoInicialSolicitud = useMemo(() => ({
        id: Math.floor(Math.random() * 9000) + 1000,
        sucursal: {
            id: sucursalData.id,
            nombre: sucursalData.nombre,
            direccion: sucursalData.direccion,
            rut: sucursalData.rut
        },
        bodega: "Bodega Central",
        fecha: new Date().toISOString().slice(0, 10),
        responsable: usuario?.nombre || "",
        cargo: usuario?.rol || "",
        observacion: "",
        productos: [],
        estado: "Pendiente",
        aprobador: ""
    }), [sucursalData, usuario]);

    const [nuevaSolicitud, setNuevaSolicitud] = useState<Solicitud>(estadoInicialSolicitud);

    const handleSeleccionarProducto = useCallback((prod: Producto) => {
        setProductoSeleccionado(prod);
        setCantidadProducto(1);
        setErrorStock("");
    }, []);

    const handleAgregarProductoSeleccionado = useCallback(() => {
        if (!productoSeleccionado) return;
        
        // Validar stock
        if (cantidadProducto > productoSeleccionado.stock) {
            setErrorStock(`No hay suficiente stock. Disponible: ${productoSeleccionado.stock}`);
            return;
        }
        
        if (cantidadProducto <= 0) {
            setErrorStock("La cantidad debe ser mayor a 0");
            return;
        }
        
        const productoConCantidad: ProductoSolicitud = {
                    codigo: productoSeleccionado.id_prodc?.toString() || productoSeleccionado.code,
                    nombre: productoSeleccionado.name,
                    descripcion: productoSeleccionado.description,
                    cantidad: cantidadProducto,
            id_prodc: productoSeleccionado.id_prodc,
            stock_disponible: productoSeleccionado.stock
        };
        
        setNuevaSolicitud(prev => {
            const existente = prev.productos.find(p => p.id_prodc === productoConCantidad.id_prodc);
            if (existente) {
                return {
                    ...prev,
                    productos: prev.productos.map(p => 
                        p.id_prodc === existente.id_prodc 
                            ? { ...p, cantidad: cantidadProducto }
                            : p
                    )
                };
                }
            return { ...prev, productos: [...prev.productos, productoConCantidad] };
        });
        
        setProductoSeleccionado(null);
        setCantidadProducto(1);
        setErrorStock("");
    }, [productoSeleccionado, cantidadProducto]);

    const handleEditarProducto = (index: number) => {
        const producto = nuevaSolicitud.productos[index];
        setEditandoProducto(index);
        setCantidadEditando(producto.cantidad);
        setErrorStock("");
    };

    const handleGuardarEdicion = () => {
        if (editandoProducto === null) return;
        
        const producto = nuevaSolicitud.productos[editandoProducto];
        
        // Validar stock
        if (cantidadEditando > producto.stock_disponible) {
            setErrorStock(`No hay suficiente stock. Disponible: ${producto.stock_disponible}`);
            return;
        }
        
        if (cantidadEditando <= 0) {
            setErrorStock("La cantidad debe ser mayor a 0");
            return;
        }
        
        setNuevaSolicitud(prev => ({
            ...prev,
            productos: prev.productos.map((p, i) => 
                i === editandoProducto ? { ...p, cantidad: cantidadEditando } : p
            )
        }));
        
        setEditandoProducto(null);
        setCantidadEditando(1);
        setErrorStock("");
    };

    const handleCancelarEdicion = () => {
        setEditandoProducto(null);
        setCantidadEditando(1);
        setErrorStock("");
    };

    const handleEliminarProducto = (index: number) => {
        setNuevaSolicitud(prev => ({
            ...prev,
            productos: prev.productos.filter((_, i) => i !== index)
        }));
    };

    const handleCrearSolicitud = async () => {
        if (nuevaSolicitud.productos.length === 0) {
            alert("Debe agregar al menos un producto a la solicitud.");
            return;
        }

        // 1. Construir el payload correcto para el backend
            const solicitudData = {
            observacion: nuevaSolicitud.observacion,
            fk_sucursal: parseInt(sucursalData.id),
            fk_bodega: parseInt(BODEGA_CENTRAL.id),
            usuarios_fk: usuario?.id,
            productos: nuevaSolicitud.productos.map(p => ({
                producto_id: parseInt(p.id_prodc || p.codigo),
                cantidad: p.cantidad,
            })),
        };

        try {
            // 2. Enviar la solicitud al backend
            const response = await solicitudesService.createSolicitud(solicitudData);
            
            // 3. Refrescar la lista de solicitudes desde el servidor
            await fetchSolicitudes(); 
            
            // 4. Cerrar modal y limpiar
            handleCloseCrear();
            alert("Solicitud creada exitosamente.");

        } catch (error) {
            console.error("Error al crear la solicitud:", error);
            alert("Hubo un error al crear la solicitud. Por favor, intente de nuevo.");
        }
    };

    // Constantes memoizadas
    const puedeSolicitar = useMemo(() => 
        usuario?.rol === "supervisor" || usuario?.rol === "bodeguero",
        [usuario?.rol]
    );

    return (
        <Layout>
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
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "24px",
                        borderBottom: "1.5px solid #232323",
                        paddingBottom: "8px"
                    }}
                >
                    <h2 style={{ color: "#FFD700", margin: 0 }}>Solicitudes de mi sucursal</h2>
                    {puedeSolicitar && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        style={{
                        background: "#FFD700",
                        color: "#121212",
                        fontWeight: 600,
                        borderRadius: "6px"
                        }}
                        onClick={handleOpenCrear}
                    >
                        Crear solicitud
                    </Button>
                    )}
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
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" style={{ color: "#FFD700", fontWeight: 600, fontSize: 18 }}>
                                        Cargando solicitudes...
                                    </TableCell>
                                </TableRow>
                            ) : solicitudes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" style={{ color: "#8A8A8A" }}>
                                        No hay solicitudes para mostrar.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                solicitudes.map((row: any, index: number) => (
                                    <TableRow key={`${row.id_solc}-${index}`}>
                                        <TableCell style={{ color: "#fff" }}>{row.id_solc}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>
                                            {row.fecha_creacion ? new Date(row.fecha_creacion).toLocaleDateString() : 'N/A'}
                                        </TableCell>
                                        <TableCell style={{ color: "#fff" }}>{row.usuario_nombre || 'N/A'}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>
                                            {Array.isArray(row.productos)
                                                ? row.productos.reduce((acc: number, prod: { cantidad: number }) => acc + Number(prod.cantidad), 0)
                                                : 0}
                                        </TableCell>
                                        <TableCell>
                                            <EstadoBadge 
                                                estado={row.estado || "pendiente"} 
                                                tipo="solicitud"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outlined"
                                                startIcon={<VisibilityIcon />}
                                                style={{ borderColor: "#FFD700", color: "#FFD700", marginRight: "8px" }}
                                                onClick={() => handleOpenResumen(row)}
                                            >
                                                Resumen
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                style={{ borderColor: "#4CAF50", color: "#4CAF50" }}
                                                onClick={() => generarOCIFunction(row)}
                                            >
                                                Ver OCI PDF
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
                {/* Modal de resumen de solicitud existente */}
                <Dialog open={modalResumenOpen} onClose={handleCloseResumen} maxWidth="md" fullWidth>
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
                                        value={solicitudSeleccionada.fecha_creacion ? new Date(solicitudSeleccionada.fecha_creacion).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        }) : 'N/A'}
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
                                    
                                {solicitudSeleccionada?.productos?.length === 0 ? (
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
                                                    {solicitudSeleccionada?.productos?.map((prod: any, idx: number) => (
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
                            onClick={handleCloseResumen} 
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

                {/* Modal de crear nueva solicitud */}
                <Dialog open={modalOpen} onClose={handleCloseCrear} maxWidth="md" fullWidth>
                    <DialogTitle sx={{ 
                        background: "linear-gradient(135deg, #232323 0%, #1a1a1a 100%)",
                        color: "#FFD700",
                        borderBottom: "2px solid #FFD700",
                        fontWeight: 600
                    }}>
                        📝 Crear nueva solicitud
                    </DialogTitle>
                    <DialogContent sx={{ bgcolor: "#1a1a1a", color: "#fff" }}>
                        {/* Información principal */}
                        <Box sx={{ 
                            mb: 3,
                            p: 2,
                            bgcolor: "#232323",
                            borderRadius: 2,
                            border: "1px solid #333"
                        }}>
                            <Typography variant="h6" sx={{ color: "#FFD700", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                                📋 Datos de la solicitud
                            </Typography>
                            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                                <TextField
                                    label="N° OCI"
                                    value={nuevaSolicitud.id}
                                    InputProps={{ readOnly: true, sx: { color: "#FFD700", fontWeight: 600 } }}
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
                                    value={nuevaSolicitud.fecha}
                                    InputProps={{ readOnly: true, sx: { color: "#fff" } }}
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
                                    value={nuevaSolicitud.sucursal.nombre}
                                    InputProps={{ readOnly: true, sx: { color: "#fff" } }}
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
                                    label="Dirección de sucursal"
                                    value={nuevaSolicitud.sucursal.direccion}
                                    InputProps={{ readOnly: true, sx: { color: "#fff" } }}
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
                                    label="RUT de sucursal"
                                    value={nuevaSolicitud.sucursal.rut}
                                    InputProps={{ readOnly: true, sx: { color: "#fff" } }}
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
                                    value={nuevaSolicitud.responsable}
                                    onChange={e => setNuevaSolicitud((prev: any) => ({ ...prev, responsable: e.target.value }))}
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
                                    label="Cargo"
                                    value={nuevaSolicitud.cargo}
                                    InputProps={{ readOnly: true, sx: { color: "#fff" } }}
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
                                    label="Observación"
                                    value={nuevaSolicitud.observacion}
                                    onChange={e => setNuevaSolicitud((prev: any) => ({ ...prev, observacion: e.target.value }))}
                                    size="small"
                                    multiline
                                    minRows={2}
                                    sx={{
                                        gridColumn: "1 / span 2",
                                        "& .MuiInputLabel-root": { color: "#ccc" },
                                        "& .MuiOutlinedInput-root": {
                                            "& fieldset": { borderColor: "#444" },
                                            "&:hover fieldset": { borderColor: "#FFD700" }
                                        }
                                    }}
                                />
                            </Box>
                        </Box>
                        {/* Sección de productos seleccionados */}
                        <Box sx={{ p: 2, bgcolor: "#232323", borderRadius: 2, border: "1px solid #333", mb: 2 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                <Typography variant="h6" sx={{ color: "#FFD700" }}>Productos seleccionados ({nuevaSolicitud.productos.length})</Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    sx={{ background: "#FFD700", color: "#232323", fontWeight: 600 }}
                                    onClick={() => setModalSeleccionarProductos(true)}
                                >
                                    Agregar productos
                                </Button>
                            </Box>
                            {nuevaSolicitud.productos.length === 0 ? (
                                <Alert severity="info" sx={{ bgcolor: "#2a2a2a", color: "#FFD700" }}>
                                    No hay productos agregados. Haz clic en "Agregar productos" para comenzar.
                                </Alert>
                            ) : (
                                <>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ color: "#FFD700", fontWeight: 600 }}>Código</TableCell>
                                                    <TableCell sx={{ color: "#FFD700", fontWeight: 600 }}>Producto</TableCell>
                                                    <TableCell sx={{ color: "#FFD700", fontWeight: 600 }} align="right">Cantidad</TableCell>
                                                    <TableCell sx={{ color: "#FFD700", fontWeight: 600 }} align="right">Stock Disponible</TableCell>
                                                    <TableCell sx={{ color: "#FFD700", fontWeight: 600 }}>Acciones</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {nuevaSolicitud.productos.map((producto, index) => (
                                                    <TableRow key={index} sx={{ "&:hover": { bgcolor: "#2a2a2a" } }}>
                                                        <TableCell sx={{ color: "#fff" }}>{producto.codigo}</TableCell>
                                                        <TableCell sx={{ color: "#fff" }}>{producto.nombre}</TableCell>
                                                        <TableCell align="right" sx={{ color: "#FFD700", fontWeight: 600 }}>{producto.cantidad}</TableCell>
                                                        <TableCell align="right" sx={{ color: producto.cantidad > producto.stock_disponible ? "#f44336" : "#4CAF50", fontWeight: 600 }}>{producto.stock_disponible}</TableCell>
                                                        <TableCell>
                                                            <Box sx={{ display: "flex", gap: 1 }}>
                                                                <IconButton 
                                                                    size="small" 
                                                                    color="primary"
                                                                    onClick={() => handleEditarProducto(index)}
                                                                >
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                                <IconButton 
                                                                    size="small" 
                                                                    color="error"
                                                                    onClick={() => handleEliminarProducto(index)}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Box>
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
                                            {nuevaSolicitud.productos.length} productos • {
                                                nuevaSolicitud.productos.reduce((acc, prod) => acc + Number(prod.cantidad), 0)
                                            } unidades
                                        </Typography>
                                    </Box>
                                </>
                            )}
                            {errorStock && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {errorStock}
                                </Alert>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ 
                        bgcolor: "#1a1a1a", 
                        borderTop: "1px solid #333",
                        p: 2
                    }}>
                        <Button onClick={handleCloseCrear} sx={{ 
                            color: "#FFD700",
                            borderColor: "#FFD700",
                            "&:hover": {
                                borderColor: "#FFD700",
                                bgcolor: "rgba(255, 215, 0, 0.1)"
                            }
                        }} variant="outlined">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCrearSolicitud}
                            sx={{ 
                                color: "#fff", 
                                background: "#4CAF50", 
                                fontWeight: 600,
                                "&:hover": {
                                    background: "#45a049"
                                }
                            }}
                            variant="contained"
                            startIcon={<span>📝</span>}
                            disabled={nuevaSolicitud.productos.length === 0}
                        >
                            Crear solicitud
                        </Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={modalSeleccionarProductos} onClose={() => setModalSeleccionarProductos(false)} maxWidth="lg" fullWidth>
                    <DialogTitle sx={{ 
                        background: "linear-gradient(135deg, #232323 0%, #1a1a1a 100%)",
                        color: "#FFD700",
                        borderBottom: "2px solid #FFD700",
                        fontWeight: 600
                    }}>
                        🏷️ Seleccionar productos de la bodega central
                    </DialogTitle>
                    <DialogContent sx={{ bgcolor: "#1a1a1a", color: "#fff" }}>
                        {/* Filtros y buscador */}
                        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                            <TextField
                                placeholder="Buscar producto..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                size="small"
                            />
                            <TextField
                                select
                                label="Marca"
                                value={filtroMarca}
                                onChange={e => setFiltroMarca(e.target.value)}
                                size="small"
                                sx={{ minWidth: 120 }}
                            >
                                <MenuItem value="">Todas</MenuItem>
                            {marcasBodegaCentral.map((m, index) => (
                                <MenuItem key={`marca-${index}`} value={typeof m === 'string' ? m : m.nombre || m}>
                                    {typeof m === 'string' ? m : m.nombre || m}
                                </MenuItem>
                            ))}
                            </TextField>
                            <TextField
                                select
                                label="Categoría"
                                value={filtroCategoria}
                                onChange={e => setFiltroCategoria(e.target.value)}
                                size="small"
                                sx={{ minWidth: 120 }}
                            >
                                <MenuItem value="">Todas</MenuItem>
                            {categoriasBodegaCentral.map((c, index) => (
                                <MenuItem key={`categoria-${index}`} value={typeof c === 'string' ? c : c.nombre || c}>
                                    {typeof c === 'string' ? c : c.nombre || c}
                                </MenuItem>
                            ))}
                            </TextField>
                        </Box>
                        {/* Vista tipo inventario */}
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                            {productosFiltrados.map(prod => (
                                <Card key={prod.code} sx={{ width: 180, bgcolor: "#232323", color: "#fff", cursor: "pointer" }}>
                                    <CardActionArea onClick={() => handleSeleccionarProducto(prod)}>
                                        <CardMedia
                                            component="img"
                                            image={typeof prod.im === "string" ? prod.im : sin_imagen}
                                            alt={prod.name}
                                            sx={{ height: 100, objectFit: "cover" }}
                                        />
                                        <CardContent>
                                            <Typography variant="subtitle1">{prod.name}</Typography>
                                            <Typography variant="body2">{prod.brand} | {prod.category}</Typography>
                                            <Typography variant="body2" sx={{ color: "#FFD700" }}>Stock: {prod.stock}</Typography>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            ))}
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ 
                        bgcolor: "#1a1a1a", 
                        borderTop: "1px solid #333",
                        p: 2
                    }}>
                        <Button onClick={() => setModalSeleccionarProductos(false)} sx={{ color: "#FFD700" }}>Cerrar</Button>
                    </DialogActions>
                </Dialog>

                {/* Mini-modal para seleccionar cantidad */}
                <Dialog open={!!productoSeleccionado} onClose={() => setProductoSeleccionado(null)}>
                    <DialogTitle sx={{ 
                        background: "linear-gradient(135deg, #232323 0%, #1a1a1a 100%)",
                        color: "#FFD700",
                        borderBottom: "2px solid #FFD700",
                        fontWeight: 600
                    }}>
                        ➕ Seleccionar cantidad
                    </DialogTitle>
                    <DialogContent sx={{ bgcolor: "#1a1a1a", color: "#fff" }}>
                        {productoSeleccionado && (
                            <Box sx={{
                                p: 2,
                                bgcolor: "#232323",
                                borderRadius: 2,
                                border: "1px solid #333",
                                mb: 2
                            }}>
                                <Typography variant="h6" sx={{ color: "#FFD700", mb: 1 }}>
                                    {productoSeleccionado.name}
                                </Typography>
                                <Typography variant="body2" sx={{ color: "#4CAF50", fontWeight: 600, mb: 2 }}>
                                    Stock disponible: <span style={{ color: '#FFD700' }}>{productoSeleccionado.stock}</span>
                                </Typography>
                                <TextField
                                    type="number"
                                    label="Cantidad"
                                    value={cantidadProducto}
                                    onChange={e => setCantidadProducto(Number(e.target.value))}
                                    inputProps={{
                                        min: 1,
                                        max: productoSeleccionado?.stock || 1
                                    }}
                                    size="small"
                                    sx={{
                                        mt: 2,
                                        input: { color: '#FFD700', fontWeight: 600 },
                                        '& .MuiInputLabel-root': { color: '#ccc' },
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': { borderColor: '#444' },
                                            '&:hover fieldset': { borderColor: '#FFD700' }
                                        }
                                    }}
                                    error={cantidadProducto > (productoSeleccionado?.stock || 0) || cantidadProducto <= 0}
                                    helperText={
                                        cantidadProducto > (productoSeleccionado?.stock || 0)
                                            ? `Máximo disponible: ${productoSeleccionado?.stock}`
                                            : cantidadProducto <= 0
                                            ? "La cantidad debe ser mayor a 0"
                                            : ""
                                    }
                                />
                                {errorStock && (
                                    <Alert severity="error" sx={{ mt: 2 }}>
                                        {errorStock}
                                    </Alert>
                                )}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ 
                        bgcolor: "#1a1a1a", 
                        borderTop: "1px solid #333",
                        p: 2
                    }}>
                        <Button onClick={() => setProductoSeleccionado(null)} sx={{ color: "#FFD700" }}>Cancelar</Button>
                        <Button
                            variant="contained"
                            onClick={handleAgregarProductoSeleccionado}
                            disabled={!productoSeleccionado || cantidadProducto > (productoSeleccionado?.stock || 0) || cantidadProducto <= 0}
                            sx={{ background: "#FFD700", color: "#232323", fontWeight: 600 }}
                        >
                            Agregar
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Modal de confirmación de eliminación */}
                <Dialog open={modalConfirmarEliminacion} onClose={handleCancelarEliminacion}>
                    <DialogTitle sx={{ 
                        background: "linear-gradient(135deg, #232323 0%, #1a1a1a 100%)",
                        color: "#FFD700",
                        borderBottom: "2px solid #FFD700",
                        fontWeight: 600
                    }}>
                        ⚠️ Confirmar eliminación
                    </DialogTitle>
                    <DialogContent sx={{ bgcolor: "#1a1a1a", color: "#fff" }}>
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
                    <DialogActions sx={{ 
                        bgcolor: "#1a1a1a", 
                        borderTop: "1px solid #333",
                        p: 2
                    }}>
                        <Button onClick={handleCancelarEliminacion} sx={{ color: "#FFD700" }}>
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleConfirmarEliminacion} 
                            sx={{ color: "#ffffff", background: "#ff6b6b", fontWeight: 600,
                                '&:hover': { background: '#ff4c4c' }
                            }}
                        >
                            Eliminar definitivamente
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </Layout>
    );
}