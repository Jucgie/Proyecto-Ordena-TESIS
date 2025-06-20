import React, { useState, useMemo, useCallback, useEffect } from "react";
import Layout from "../../components/layout/layout";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box, Card, CardActionArea,
    CardMedia, CardContent, Typography, MenuItem
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useBodegaStore } from "../../store/useBodegaStore";
import { useAuthStore } from "../../store/useAuthStore";
import { generarOCI } from "../../utils/pdf/generarOCI";
import { SUCURSALES } from "../../constants/ubicaciones";
import { useInventariosStore } from "../../store/useProductoStore";
import { BODEGA_CENTRAL } from "../../constants/ubicaciones";
import sin_imagen from "../../assets/sin_imagen.png";

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
    observaciones: string;
    productos: Array<{
        codigo: string;
        nombre: string;
        descripcion: string;
        cantidad: number;
    }>;
    estado: string;
    aprobador: string;
}

export default function SolicitudesSucursal() {
    // Hooks de estado global - Modificamos cómo accedemos al estado
    const solicitudes = useBodegaStore((state: any) => state.solicitudes as Solicitud[]);
    const addSolicitud = useBodegaStore((state: any) => state.addSolicitud as (solicitud: Solicitud) => void);
    const clearSolicitudes = useBodegaStore((state: any) => state.clearSolicitudes as () => void);
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
        console.log('DEBUG - Cargando productos de bodega central...');
        // Cargar productos de la bodega central (ID: 2)
        fetchProductos("bodega_central");
        fetchMarcas("bodega_central");
        fetchCategorias("bodega_central");
    }, [fetchProductos, fetchMarcas, fetchCategorias]);

    // Memoizamos los datos del inventario
    const inventarioBodegaCentral = useMemo(() => {
        const productos = inventarios["bodega_central"] || [];
        console.log('DEBUG - Inventario bodega central (memo):', productos);
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

    // Debug: verificar que los productos se cargan
    console.log('DEBUG - Productos bodega central:', inventarioBodegaCentral);
    console.log('DEBUG - Marcas bodega central:', marcasBodegaCentral);
    console.log('DEBUG - Categorías bodega central:', categoriasBodegaCentral);
    console.log('DEBUG - BODEGA_CENTRAL.id:', BODEGA_CENTRAL.id);
    console.log('DEBUG - Inventarios completo:', inventarios);

    // Estados locales
    const [modalOpen, setModalOpen] = useState(false);
    const [modalResumenOpen, setModalResumenOpen] = useState(false);
    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<Solicitud | null>(null);
    const [search, setSearch] = useState("");
    const [filtroMarca, setFiltroMarca] = useState("");
    const [filtroCategoria, setFiltroCategoria] = useState("");
    const [modalSeleccionarProductos, setModalSeleccionarProductos] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
    const [cantidadProducto, setCantidadProducto] = useState<number>(1);

    // Memoizamos la sucursal del usuario
    const sucursalData = useMemo(() => {
        const sucursalId = usuario?.sucursalId?.toString(); // Convertimos a string si es número
        console.log('Sucursal ID:', sucursalId); // Para debugging
        const sucursal = SUCURSALES.find(s => s.id === sucursalId);
        console.log('Sucursal encontrada:', sucursal); // Para debugging
        return sucursal || {
            id: "",
            nombre: "",
            direccion: "",
            rut: "",
            tipo: "sucursal"
        };
    }, [usuario?.sucursalId]);

    // Cargar solicitudes existentes al montar el componente (después de que sucursalData esté disponible)
    useEffect(() => {
        console.log('DEBUG - Cargando solicitudes existentes...');
        // Cargar solicitudes de la sucursal del usuario
        if (usuario?.sucursalId && sucursalData.id) {
            // Limpiar solicitudes existentes antes de cargar nuevas
            clearSolicitudes();
            
            import('../../services/api').then(({ solicitudesService }) => {
                solicitudesService.getSolicitudes({ sucursal_id: usuario.sucursalId.toString() })
                    .then((solicitudesBackend: any[]) => {
                        console.log('DEBUG - Solicitudes cargadas del backend:', solicitudesBackend);
                        // Convertir la estructura del backend al formato del frontend
                        const solicitudesFrontend = solicitudesBackend.map((solicitud: any) => ({
                            id: solicitud.id_solc,
                            fecha: solicitud.fecha_creacion,
                            responsable: solicitud.usuario_nombre,
                            estado: "Pendiente", // Estado por defecto en el frontend
                            sucursal: {
                                id: solicitud.fk_sucursal.toString(),
                                nombre: solicitud.sucursal_nombre,
                                direccion: sucursalData.direccion,
                                rut: sucursalData.rut
                            },
                            bodega: solicitud.bodega_nombre,
                            cargo: usuario?.rol || "",
                            observaciones: solicitud.observacion || "",
                            productos: solicitud.productos?.map((prod: any) => ({
                                codigo: prod.producto_fk.toString(),
                                nombre: prod.producto_nombre,
                                descripcion: "",
                                cantidad: prod.cantidad
                            })) || [],
                            aprobador: ""
                        }));
                        console.log('DEBUG - Solicitudes convertidas:', solicitudesFrontend);
                        // Agregar todas las solicitudes al store
                        solicitudesFrontend.forEach(solicitud => addSolicitud(solicitud));
                    })
                    .catch((error: any) => {
                        console.error('Error al cargar solicitudes:', error);
                    });
            });
        }
    }, [usuario?.sucursalId, addSolicitud, clearSolicitudes, sucursalData, usuario?.rol]);

    // Memoizamos los productos filtrados
    const productosFiltrados = useMemo(() => 
        inventarioBodegaCentral.filter(prod =>
            prod.name.toLowerCase().includes(search.toLowerCase()) &&
            (!filtroMarca || prod.brand === filtroMarca) &&
            (!filtroCategoria || prod.category === filtroCategoria)
        ),
        [inventarioBodegaCentral, search, filtroMarca, filtroCategoria]
    );

    // Memoizamos el estado inicial de nuevaSolicitud
    const estadoInicialSolicitud = useMemo(() => ({
        id: solicitudes.length + 1,
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
        observaciones: "",
        productos: [],
        estado: "Pendiente",
        aprobador: ""
    }), [solicitudes.length, sucursalData, usuario]);

    const [nuevaSolicitud, setNuevaSolicitud] = useState<Solicitud>(estadoInicialSolicitud);

    // Funciones memoizadas
    const handleOpenCrear = useCallback(() => {
        setNuevaSolicitud(estadoInicialSolicitud);
        setModalOpen(true);
    }, [estadoInicialSolicitud]);

    const handleCloseCrear = useCallback(() => {
        setModalOpen(false);
    }, []);

    const handleOpenResumen = useCallback((solicitud: Solicitud) => {
        setSolicitudSeleccionada(solicitud);
        setModalResumenOpen(true);
    }, []);

    const handleCloseResumen = useCallback(() => {
        setModalResumenOpen(false);
        setSolicitudSeleccionada(null);
    }, []);

    const handleSeleccionarProducto = useCallback((prod: Producto) => {
        setProductoSeleccionado(prod);
        setCantidadProducto(1);
    }, []);

    const handleAgregarProductoSeleccionado = useCallback(() => {
        if (!productoSeleccionado || cantidadProducto < 1 || cantidadProducto > productoSeleccionado.stock) return;
        
        setNuevaSolicitud(prev => ({
            ...prev,
            productos: [
                ...prev.productos,
                {
                    codigo: productoSeleccionado.id_prodc?.toString() || productoSeleccionado.code,
                    nombre: productoSeleccionado.name,
                    descripcion: productoSeleccionado.description,
                    cantidad: cantidadProducto
                }
            ]
        }));
        setProductoSeleccionado(null);
        setCantidadProducto(1);
    }, [productoSeleccionado, cantidadProducto]);

    const handleCrearSolicitud = useCallback(async () => {
        try {
            // Preparar datos para el backend
            const solicitudData = {
                observacion: nuevaSolicitud.observaciones,
                fk_sucursal: parseInt(nuevaSolicitud.sucursal.id),
                fk_bodega: 2, // ID de la bodega central
                usuarios_fk: usuario?.id || 1, // ID del usuario actual (corregido)
                productos: nuevaSolicitud.productos.map(prod => ({
                    producto_id: parseInt(prod.codigo), // Ahora el código es el ID real del producto
                    cantidad: prod.cantidad
                }))
            };

            // Crear solicitud en el backend usando el servicio directamente
            const { solicitudesService } = await import('../../services/api');
            const nuevaSolicitudBackend = await solicitudesService.createSolicitud(solicitudData);
            
            // Usar los datos del formulario pero con el ID del backend
            const solicitudFrontend = {
                ...nuevaSolicitud,
                id: nuevaSolicitudBackend.id_solc, // Solo usar el ID del backend
                fecha: nuevaSolicitud.fecha // Mantener la fecha del formulario
            };
            
            // Agregar al store local
            addSolicitud(solicitudFrontend);
            
            // Generar OCI PDF
            generarOCI({
                numeroOCI: nuevaSolicitud.id,
                fecha: nuevaSolicitud.fecha,
                sucursal: {
                    nombre: nuevaSolicitud.sucursal.nombre,
                    direccion: nuevaSolicitud.sucursal.direccion,
                    rut: nuevaSolicitud.sucursal.rut,
                },
                responsable: nuevaSolicitud.responsable,
                cargo: nuevaSolicitud.cargo,
                productos: nuevaSolicitud.productos,
                observaciones: nuevaSolicitud.observaciones,
                estado: nuevaSolicitud.estado,
                aprobador: nuevaSolicitud.aprobador
            });
            
            setModalOpen(false);
        } catch (error) {
            console.error('Error al crear solicitud:', error);
            // Aquí podrías mostrar un mensaje de error al usuario
        }
    }, [nuevaSolicitud, addSolicitud, usuario, sucursalData]);

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
                            {solicitudes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" style={{ color: "#8A8A8A" }}>
                                        No hay solicitudes para mostrar.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                solicitudes.map((row: any, index: number) => (
                                    <TableRow key={`${row.id}-${index}`}>
                                        <TableCell style={{ color: "#fff" }}>{row.id}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>{row.fecha || 'N/A'}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>{row.responsable || 'N/A'}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>
                                            {Array.isArray(row.productos)
                                                ? row.productos.reduce((acc: number, prod: { cantidad: number }) => acc + Number(prod.cantidad), 0)
                                                : 0}
                                        </TableCell>
                                        <TableCell style={{
                                            color:
                                                row.estado === "aprobada"
                                                    ? "#4CAF50"
                                                    : row.estado === "denegada"
                                                        ? "#FF4D4F"
                                                        : "#FFD700"
                                        }}>
                                            {(row.estado || "Pendiente").charAt(0).toUpperCase() + (row.estado || "Pendiente").slice(1)}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outlined"
                                                startIcon={<VisibilityIcon />}
                                                style={{ borderColor: "#FFD700", color: "#FFD700" }}
                                                onClick={() => handleOpenResumen(row)}
                                            >
                                                Resumen
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                style={{ borderColor: "#4CAF50", color: "#4CAF50" }}
                                                onClick={() => generarOCI(row)}
                                            >
                                                Ver OCI PDF
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {/* Modal de resumen */}
                    <Dialog open={modalOpen} onClose={handleCloseCrear} maxWidth="sm" fullWidth>
                        <DialogTitle>Crear nueva solicitud</DialogTitle>
                        <DialogContent>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "12px" }}>
                                <TextField
                                    label="N° OCI"
                                    value={nuevaSolicitud.id}
                                    InputProps={{ readOnly: true }}
                                    size="small"
                                />
                                <TextField
                                    label="Fecha de emisión"
                                    value={nuevaSolicitud.fecha}
                                    InputProps={{ readOnly: true }}
                                    size="small"
                                />
                                <TextField
                                    label="Sucursal solicitante"
                                    value={nuevaSolicitud.sucursal.nombre}
                                    InputProps={{ readOnly: true }}
                                    size="small"
                                />
                                <TextField
                                    label="Dirección de sucursal"
                                    value={nuevaSolicitud.sucursal.direccion}
                                    InputProps={{ readOnly: true }}
                                    size="small"
                                />
                                <TextField
                                    label="RUT de sucursal"
                                    value={nuevaSolicitud.sucursal.rut}
                                    InputProps={{ readOnly: true }}
                                    size="small"
                                />
                                <TextField
                                    label="Persona solicitante"
                                    value={nuevaSolicitud.responsable}
                                    onChange={e => setNuevaSolicitud((prev: any) => ({
                                        ...prev,
                                        responsable: e.target.value
                                    }))}
                                    size="small"
                                />
                                <TextField
                                    label="Cargo"
                                    value={nuevaSolicitud.cargo}
                                    InputProps={{ readOnly: true }}
                                    size="small"
                                />
                                <TextField
                                    label="Observaciones adicionales"
                                    value={nuevaSolicitud.observaciones}
                                    onChange={e => setNuevaSolicitud((prev: any) => ({
                                        ...prev,
                                        observaciones: e.target.value
                                    }))}
                                    size="small"
                                    multiline
                                    minRows={2}
                                />
                                <TextField
                                    label="Estado de la OCI"
                                    value={nuevaSolicitud.estado}
                                    onChange={e => setNuevaSolicitud((prev: any) => ({
                                        ...prev,
                                        estado: e.target.value
                                    }))}
                                    size="small"
                                />
                                <TextField
                                    label="Firma o nombre del aprobador"
                                    value={nuevaSolicitud.aprobador}
                                    onChange={e => setNuevaSolicitud((prev: any) => ({
                                        ...prev,
                                        aprobador: e.target.value
                                    }))}
                                    size="small"
                                />
                            </div>
                            <div>
                                <b>Productos solicitados:</b>
                                <ul>
                                    {nuevaSolicitud.productos.length === 0 ? (
                                        <li style={{ color: "#8A8A8A" }}>No hay productos agregados.</li>
                                    ) : (
                                        nuevaSolicitud.productos.map((prod: any, idx: number) => (
                                            <li key={idx}>
                                                <b>Código:</b> {prod.codigo} — <b>Descripción:</b> {prod.descripcion} — <b>Cantidad:</b> {prod.cantidad}
                                            </li>
                                        ))
                                    )}
                                </ul>
                                <Button
                                variant="contained"
                                style={{ background: "#FFD700", color: "#232323", fontWeight: 600, marginBottom: 12 }}
                                onClick={() => setModalSeleccionarProductos(true)}
                                >
                                Seleccionar productos
                                </Button>
                            </div>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseCrear} style={{ color: "#FFD700" }}>Cancelar</Button>
                            <Button
                                onClick={handleCrearSolicitud}
                                style={{ color: "#121212", background: "#FFD700", fontWeight: 600 }}
                                disabled={nuevaSolicitud.productos.length === 0}
                            >
                                Crear solicitud
                            </Button>
                        </DialogActions>
                    </Dialog>

                    <Dialog open={modalSeleccionarProductos} onClose={() => setModalSeleccionarProductos(false)} maxWidth="md" fullWidth>
                        <DialogTitle>Seleccionar productos de la bodega central</DialogTitle>
                        <DialogContent>
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
                                    {marcasBodegaCentral.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
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
                                    {categoriasBodegaCentral.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
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
                        <DialogActions>
                            <Button onClick={() => setModalSeleccionarProductos(false)}>Cerrar</Button>
                        </DialogActions>
                    </Dialog>

                    {/* Mini-modal para seleccionar cantidad */}
                    <Dialog open={!!productoSeleccionado} onClose={() => setProductoSeleccionado(null)}>
                        <DialogTitle>Seleccionar cantidad</DialogTitle>
                        <DialogContent>
                            <Typography>
                                {productoSeleccionado?.name} (Stock disponible: {productoSeleccionado?.stock})
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
                                sx={{ mt: 2 }}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setProductoSeleccionado(null)}>Cancelar</Button>
                            <Button
                                onClick={handleAgregarProductoSeleccionado}
                                disabled={
                                    !cantidadProducto ||
                                    cantidadProducto < 1 ||
                                    cantidadProducto > (productoSeleccionado?.stock || 1)
                                }
                                variant="contained"
                                style={{ background: "#FFD700", color: "#232323", fontWeight: 600 }}
                            >
                                Agregar
                            </Button>
                        </DialogActions>
                    </Dialog>
            </div>
        </Layout>
    );
}