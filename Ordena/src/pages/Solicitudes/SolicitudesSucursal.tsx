import React, { useState, useMemo } from "react";
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
import { generarOCI } from "../../utils/pdf/generarOCI"; // Asegúrate de que esta función esté implementada correctamente
import { SUCURSALES } from "../../constants/ubicaciones";
import { useInventariosStore } from "../../store/useProductoStore";
import { BODEGA_CENTRAL } from "../../constants/ubicaciones";


export default function SolicitudesSucursal() {
    const { solicitudes, addSolicitud } = useBodegaStore();
    const usuario = useAuthStore(state => state.usuario);
    const puedeSolicitar = usuario?.rol === "supervisor" || usuario?.rol === "bodeguero";
    const [modalOpen, setModalOpen] = useState(false);
    const [modalResumenOpen, setModalResumenOpen] = useState(false);
    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<any>(null);
    const inventarioBodegaCentral = useInventariosStore(state => state.inventarios[BODEGA_CENTRAL.id] || []);
    const [cantidadSeleccionada, setCantidadSeleccionada] = useState<{ [code: string]: number }>({});
    const [modalSeleccionarProductos, setModalSeleccionarProductos] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);
    const [cantidadProducto, setCantidadProducto] = useState<number>(1);
    const sucursalData = SUCURSALES.find(s => s.id === usuario?.sucursalId) || {};


    //modales de productos
    const [search, setSearch] = useState("");
    const [filtroMarca, setFiltroMarca] = useState("");
    const [filtroCategoria, setFiltroCategoria] = useState("");

    const marcasBodegaCentral = useInventariosStore(state => state.marcas[BODEGA_CENTRAL.id] || []);
    const categoriasBodegaCentral = useInventariosStore(state => state.categorias[BODEGA_CENTRAL.id] || []);

    const productosFiltrados = inventarioBodegaCentral.filter(prod =>
    prod.name.toLowerCase().includes(search.toLowerCase()) &&
    (!filtroMarca || prod.brand === filtroMarca) &&
    (!filtroCategoria || prod.category === filtroCategoria)
    );

 // Obténemos sucursal y bodega desde el usuario
    const sucursal = usuario?.sucursal?.nombre || "";
    const bodega = "Bodega Central"; // Si tienes más de una bodega, usa usuario.bodega?.nombre
    const responsable = usuario?.nombre || "Usuario Actual";


        // Estado para nueva solicitud
    const [nuevaSolicitud, setNuevaSolicitud] = useState<any>({
        id: solicitudes.length + 1,
        sucursal: {
            id: usuario?.sucursal?.id,
            nombre: usuario?.sucursal?.nombre,
            direccion: usuario?.sucursal?.direccion || "",
            rut: usuario?.sucursal?.rut || ""
        },
        bodega,
        fecha: new Date().toISOString().slice(0, 10),
        responsable,
        cargo: usuario?.rol || "",
        observaciones: "",
        productos: [],
        estado: "pendiente",
        aprobador: "",
    });

    const handleAgregarProducto = (prod: any) => {
    const cantidad = cantidadSeleccionada[prod.code];
    if (!cantidad || cantidad > prod.stock) return;
    setNuevaSolicitud(prev => ({
        ...prev,
        productos: [
        ...prev.productos,
        {
            codigo: prod.code,
            nombre: prod.name,
            descripcion: prod.description,
            cantidad
        }
        ]
    }));
    setCantidadSeleccionada(prev => ({ ...prev, [prod.code]: "" }));
    };



    const handleOpenResumen = (solicitud: any) => {
        setSolicitudSeleccionada(solicitud);
        setModalResumenOpen(true);
    };

    const handleCloseResumen = () => {
        setModalResumenOpen(false);
        setSolicitudSeleccionada(null);
    };

    const handleOpenCrear = () => {
        setNuevaSolicitud({
            id: solicitudes.length + 1,
            sucursal: {
                id: sucursalData.id || "",
                nombre: sucursalData.nombre || "",
                direccion: sucursalData.direccion || "",
                rut: sucursalData.rut || ""
            },
            bodega,
            fecha: new Date().toISOString().slice(0, 10),
            responsable: usuario?.nombre || "",
            cargo: usuario?.rol || "",
            observaciones: "",
            productos: [],
            estado: "pendiente",
            aprobador: ""
        });
        setModalOpen(true);
    };

    const handleCloseCrear = () => {
        setModalOpen(false);
    };

    // Simula agregar productos desde la "mini tienda"
    const handleAgregarProductos = () => {
        setNuevaSolicitud((prev: any) => ({
            ...prev,
            productos: [
                ...prev.productos,
                { codigo: `P${prev.productos.length + 1}`, nombre: "Producto Demo", descripcion: "Descripción demo", cantidad: 1 }
            ]
        }));
    };

    const handleCrearSolicitud = () => {
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
            aprobador: nuevaSolicitud.aprobador,
        });
        addSolicitud({ ...nuevaSolicitud });
        setModalOpen(false);
    };

        // Al hacer click en un producto, abre el mini-modal
    const handleSeleccionarProducto = (prod: any) => {
        setProductoSeleccionado(prod);
        setCantidadProducto(1);
    };

    // Al confirmar cantidad, agrega el producto a la solicitud
    const handleAgregarProductoSeleccionado = () => {
        if (!productoSeleccionado || cantidadProducto < 1 || cantidadProducto > productoSeleccionado.stock) return;
        setNuevaSolicitud(prev => ({
            ...prev,
            productos: [
                ...prev.productos,
                {
                    codigo: productoSeleccionado.code,
                    nombre: productoSeleccionado.name,
                    descripcion: productoSeleccionado.description,
                    cantidad: cantidadProducto
                }
            ]
        }));
        setProductoSeleccionado(null);
        setCantidadProducto(1);
    };

    console.log("usuario", usuario);


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
                                solicitudes.map((row: any) => (
                                    <TableRow key={row.id}>
                                        <TableCell style={{ color: "#fff" }}>{row.id}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>{row.fecha}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>{row.responsable}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>
                                            {Array.isArray(row.productos)
                                                ? row.productos.reduce((acc, prod) => acc + Number(prod.cantidad), 0)
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
                                            {row.estado.charAt(0).toUpperCase() + row.estado.slice(1)}
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