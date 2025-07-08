import React, { useState, useMemo, useEffect, useRef } from "react";
import Layout from "../../components/layout/layout";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, TextField,
    Box, Typography, Chip
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
import EstadoBadge from "../../components/EstadoBadge";
import { pedidosService, informesService, buscarProductosSimilaresSucursal } from "../../services/api";
import { useInventariosStore } from "../../store/useProductoStore";
import { formatFechaChile } from '../../utils/formatFechaChile';
import ModalComparacion from "../../components/formularioProductos/ModalComparacion";

export default function PedidosSucursal() {
    const { pedidos, updatePedido, addPedido, clearPedidos } = useBodegaStore();
    const usuario = useAuthStore(state => state.usuario);
    const [estado, setEstado] = useState("");
    const [fecha, setFecha] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const hasLoaded = useRef(false);
    const fetchProductos = useInventariosStore(state => state.fetchProductos);
    const [paginaActual, setPaginaActual] = useState(1);
    const PEDIDOS_POR_PAGINA = 10;

    const sucursalActualId = usuario?.sucursal || "";

    const [showComparacion, setShowComparacion] = useState(false);
    const [productosSimilares, setProductosSimilares] = useState<any[]>([]);
    const [productoPendiente, setProductoPendiente] = useState<any>(null);
    const [productoSeleccionadoComparacion, setProductoSeleccionadoComparacion] = useState<any>(null);
    
    // --- ESTADOS para validación múltiple de productos ---
    const [modalValidacionMultiple, setModalValidacionMultiple] = useState(false);
    const [productosAValidar, setProductosAValidar] = useState<any[]>([]);
    const [productosValidados, setProductosValidados] = useState<any[]>([]);
    const [productoActualValidacion, setProductoActualValidacion] = useState<any>(null);
    const [productosSimilaresActual, setProductosSimilaresActual] = useState<any[]>([]);
    const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);
    const [procesandoIngreso, setProcesandoIngreso] = useState(false);
    const [datosFormularioPendiente, setDatosFormularioPendiente] = useState<any>(null);
    // Nuevo estado para pedido pendiente de confirmación
    const [pedidoPendienteConfirmacion, setPedidoPendienteConfirmacion] = useState<any>(null);

    // Cargar pedidos desde la base de datos al montar el componente
    useEffect(() => {
        
        // Evitar cargas múltiples
        if (hasLoaded.current || !sucursalActualId) {
            return;
        }
        
        setLoading(true);
        fetchPedidosSucursal().finally(() => setLoading(false));
    }, [sucursalActualId]);

    const fetchPedidosSucursal = async () => {
        
        if (!sucursalActualId) {
            setLoading(false);
            return;
        }

        // Marcar como cargado para evitar cargas múltiples
        hasLoaded.current = true;

        try {
            setLoading(true);
            
            // Limpiar el store antes de cargar nuevos pedidos
            clearPedidos();
            
            // Obtener pedidos desde la base de datos filtrados por sucursal destino
            const pedidosDBRaw = await pedidosService.getPedidos({ 
                sucursal_id: sucursalActualId.toString() 
            });
            const pedidosDB = Array.isArray(pedidosDBRaw)
                ? pedidosDBRaw
                : pedidosDBRaw.results || [];
            
            // Transformar los datos de la BD al formato esperado por el frontend
            const pedidosTransformados = pedidosDB.map((pedidoDB: any) => {
                const productos = pedidoDB.detalles_pedido?.map((detalle: any) => {
                    return {
                        nombre: detalle.producto_nombre || "Producto",
                        cantidad: detalle.cantidad,
                        codigo: detalle.producto_codigo || "",
                        marca: detalle.producto_marca || "",
                        categoria: detalle.producto_categoria || ""
                    };
                }) || [];
                
                return {
                    id: pedidoDB.id_p,
                    tipo: "salida",
                    fecha: formatFechaChile(pedidoDB.fecha_entrega),
                    responsable: pedidoDB.usuario_nombre || "Responsable Bodega",
                    productos: productos,
                    sucursalDestino: pedidoDB.sucursal_fk?.toString() || "",
                    cantidad: productos.reduce((acc: number, prod: any) => acc + Number(prod.cantidad), 0),
                    asignado: pedidoDB.personal_entrega_nombre || "Sin asignar",
                    estado: pedidoDB.estado_pedido_nombre || "Pendiente",
                    observaciones: pedidoDB.descripcion || "",
                    ociAsociada: pedidoDB.solicitud_id?.toString() || "",
                    bodegaOrigen: pedidoDB.bodega_nombre || "Bodega Central",
                    direccionBodega: pedidoDB.bodega_direccion || "",
                    direccionSucursal: pedidoDB.sucursal_direccion || "",
                };
            });
            
            // Agregar todos los pedidos al store de una vez
            pedidosTransformados.forEach((pedido: any, index: number) => {
                addPedido(pedido);
            });
            
        } catch (error) {
            console.error("Error al cargar pedidos de la sucursal:", error);
        } finally {
            setLoading(false);
        }
    };

    
    const pedidosFiltrados = useMemo(() => {
        const filtrados = pedidos.filter((row) => {
            const esSalida = row.tipo === "salida";
            const coincideSucursal = String(row.sucursalDestino) === String(sucursalActualId);
            const coincideEstado = estado === "" || row.estado === estado;
            const coincideFecha = fecha === "" || row.fecha === fecha;
            return esSalida && coincideSucursal && coincideEstado && coincideFecha;
        });
        return filtrados;
    }, [pedidos, sucursalActualId, estado, fecha]);

    const totalPaginas = Math.ceil(pedidosFiltrados.length / PEDIDOS_POR_PAGINA);
    const pedidosPaginados = pedidosFiltrados.slice(
        (paginaActual - 1) * PEDIDOS_POR_PAGINA,
        paginaActual * PEDIDOS_POR_PAGINA
    );

    // Nueva función: lógica de confirmación de recepción (extraída)
    const confirmarRecepcionBackend = async (pedido: any, productosFinales?: any[]) => {
        try {
            // Confirmar recepción usando el nuevo endpoint
            const resultado = await pedidosService.confirmarRecepcion(pedido.id.toString());
            
            // Buscar sucursal receptora
            const sucursal = SUCURSALES.find(s => s.id === pedido.sucursalDestino);
            // Generar productos recibidos
            const productos = (productosFinales || pedido.productos || []).map((prod: any, idx: number) => ({
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
                observaciones: pedido.observacion || pedido.observaciones || "",
                conformidad: "Recibido conforme",
                responsable: usuario?.nombre || "-",
            });

            // Crear informe en la base de datos para la confirmación de recepción
            try {
                const contenidoInforme = {
                    pedido_id: pedido.id,
                    fecha: pedido.fecha,
                    sucursal: {
                        id: pedido.sucursalDestino,
                        nombre: sucursal?.nombre || pedido.sucursalDestino || "-",
                        direccion: sucursal?.direccion || pedido.direccionSucursal || "-"
                    },
                    bodega: {
                        nombre: pedido.bodegaOrigen || "Bodega Central",
                        direccion: pedido.direccionBodega || "Camino a Penco 2500, Concepción"
                    },
                    productos: productos.map((prod: any) => ({
                        nombre: prod.descripcion,
                        codigo: prod.codigo,
                        cantidad: prod.cantidad
                    })),
                    transportista: {
                        nombre: pedido.asignado || "Sin asignar",
                    },
                    observaciones: pedido.observacion || pedido.observaciones || "",
                    responsable: usuario?.nombre || "-",
                    oci_asociada: pedido.ociAsociada || ""
                };

                await informesService.createInforme({
                    titulo: `Confirmación de Recepción - Pedido ${pedido.id}`,
                    descripcion: `Confirmación de recepción del pedido ${pedido.id} en ${sucursal?.nombre || pedido.sucursalDestino}`,
                    modulo_origen: 'pedidos',
                    contenido: JSON.stringify(contenidoInforme),
                    archivo_url: `ConfirmacionRecepcion_${pedido.id}.pdf`,
                    fecha_generado: new Date().toISOString(),
                    sucursal_fk: usuario?.sucursal || null,
                    pedidos_fk: pedido.id
                });

                console.log('✅ Informe de confirmación de recepción creado exitosamente');
            } catch (error) {
                console.error('Error al crear informe de confirmación de recepción:', error);
            }
            // Mostrar mensaje de éxito con los productos agregados
            if (resultado.productos_agregados && resultado.productos_agregados.length > 0) {
                const productosText = resultado.productos_agregados
                    .map((p: any) => `${p.producto}: ${p.cantidad} unidades`)
                    .join('\n');
                alert(`¡Recepción confirmada exitosamente!\n\nProductos agregados al inventario:\n${productosText}`);
            } else {
                alert("¡Recepción confirmada exitosamente!");
            }
            // Actualizar el estado local
            updatePedido(pedido.id, { estado: "Completado" });
            // Recargar pedidos para sincronizar
            await fetchPedidosSucursal();
            // Refrescar inventario de la sucursal
            if (sucursalActualId) {
                await fetchProductos(sucursalActualId.toString());
            }
        } catch (error: any) {
            console.error("Error al confirmar recepción:", error);
            let mensaje = "Error al confirmar la recepción. Por favor, intente de nuevo.";
            if (error && error.response && error.response.data && error.response.data.error) {
                mensaje = error.response.data.error;
            }
            alert(mensaje);
        }
    };

    // Modificar handleConfirmarRecepcion para validar productos antes de confirmar
    const handleConfirmarRecepcion = async (id: number) => {
        const pedido = pedidos.find((p: any) => p.id === id);
        if (!pedido) return;
        // Validar productos antes de continuar
        const productosValidados = await validarTodosLosProductos(pedido.productos);
        if (!productosValidados) {
            // Hay productos similares, se abrirá el modal
            setPedidoPendienteConfirmacion(pedido); // Guardar el pedido para después
            return;
        }
        // Si no hay similares, continuar con la lógica actual
        await confirmarRecepcionBackend(pedido);
    };
    
    const handleOpenModal = (pedido: any) => {
        setPedidoSeleccionado(pedido);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setPedidoSeleccionado(null);
    };

    // --- FUNCIONES de comparación de productos ---
    const buscarProductosSimilaresParaComparacion = async (producto: any) => {
        try {
            const codigo_interno = producto.codigo_interno || producto.codigo || undefined;
            const sucursal_id = usuario?.sucursal ? String(usuario.sucursal) : undefined;
            
            // Prioridad 1: Buscar por código interno exacto si está disponible
            // Prioridad 2: Buscar por nombre exacto (sin marca/categoría para dar máxima prioridad al nombre)
            const payload: any = {
                nombre: producto.nombre,
            };
            if (sucursal_id) payload.sucursal_id = sucursal_id;
            if (codigo_interno) payload.codigo_interno = codigo_interno;
            // Solo enviar marca y categoría si NO hay código interno
            if (!codigo_interno) {
                if (producto.marca) payload.marca = producto.marca;
                if (producto.categoria) payload.categoria = producto.categoria;
            }

            console.log("Payload a buscarProductosSimilaresSucursal:", payload);

            const response = await buscarProductosSimilaresSucursal(payload);
            console.log("Similares recibidos:", response.productos_similares);
            if (response.productos_similares && response.productos_similares.length > 0) {
                setProductosSimilares(response.productos_similares);
                setProductoPendiente(producto);
                setShowComparacion(true);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error en buscarProductosSimilaresParaComparacion:", error);
            return false;
        }
    };

    const handleUsarExistente = (productoExistente: any) => {
        if (!productoPendiente) return;
        
        // Aquí puedes agregar la lógica para usar el producto existente
        console.log("Usando producto existente:", productoExistente);
        console.log("Producto pendiente:", productoPendiente);
        
        // Cerrar el modal
        setShowComparacion(false);
        setProductosSimilares([]);
        setProductoPendiente(null);
        setProductoSeleccionadoComparacion(null);
    };

    const handleCrearNuevo = () => {
        if (!productoPendiente) return;
        
        // Aquí puedes agregar la lógica para crear un nuevo producto
        console.log("Creando nuevo producto:", productoPendiente);
        
        // Cerrar el modal
        setShowComparacion(false);
        setProductosSimilares([]);
        setProductoPendiente(null);
        setProductoSeleccionadoComparacion(null);
    };

    const handleCancelarComparacion = () => {
        setShowComparacion(false);
        setProductosSimilares([]);
        setProductoPendiente(null);
        setProductoSeleccionadoComparacion(null);
    };

    // --- FUNCIONES de validación múltiple ---
    const buscarProductosSimilaresLocal = async (producto: any) => {
        try {
            const codigo_interno = producto.codigo_interno || producto.codigo || undefined;
            const sucursal_id = usuario?.sucursal ? String(usuario.sucursal) : undefined;
            // Solo enviar nombre, sucursal_id y código si existen
            const payload: any = {
                nombre: producto.nombre,
            };
            if (sucursal_id) payload.sucursal_id = sucursal_id;
            if (codigo_interno) payload.codigo_interno = codigo_interno;
            if (producto.marca) payload.marca = producto.marca;
            if (producto.categoria) payload.categoria = producto.categoria;

            console.log("Payload a buscarProductosSimilaresSucursal:", payload);

            const response = await buscarProductosSimilaresSucursal(payload);
            console.log("Similares recibidos:", response.productos_similares);
            if (response.productos_similares && response.productos_similares.length > 0) {
                setProductosSimilaresActual(response.productos_similares);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error en buscarProductosSimilaresLocal:", error);
            return false;
        }
    };

    const validarTodosLosProductos = async (productos: any[]) => {
        const productosConSimilares = [];
        const productosSinSimilares = [];
        for (const producto of productos) {
            try {
                const haySimilares = await buscarProductosSimilaresLocal(producto);
                if (haySimilares) {
                    productosConSimilares.push(producto);
                } else {
                    productosSinSimilares.push(producto);
                }
            } catch (error) {
                productosSinSimilares.push(producto);
            }
        }
        console.log("Productos con similares:", productosConSimilares);
        if (productosConSimilares.length > 0) {
            setProductosAValidar(productosConSimilares);
            setProductosValidados(productosSinSimilares);
            setProductoActualValidacion(productosConSimilares[0]);
            setModalValidacionMultiple(true);
        }
        return productosConSimilares.length === 0;
    };

    const manejarDecisionProducto = async (decision: 'existente' | 'nuevo', productoExistente?: any) => {
        if (!productoActualValidacion) return;
        let productoFinal;
        if (decision === 'existente' && productoExistente) {
            productoFinal = {
                ...productoExistente,
                cantidad: productoActualValidacion.cantidad,
                es_producto_existente: true,
                id: productoExistente.id
            };
        } else {
            productoFinal = {
                ...productoActualValidacion,
                es_producto_existente: false
            };
        }
        setProductosValidados(prev => [...prev, productoFinal]);
        const productosRestantes = productosAValidar.filter(p =>
            !(p.nombre === productoActualValidacion.nombre &&
              p.marca === productoActualValidacion.marca &&
              p.categoria === productoActualValidacion.categoria)
        );
        setProductosAValidar(productosRestantes);
        if (productosRestantes.length > 0) {
            setProductoActualValidacion(productosRestantes[0]);
            setProductosSimilaresActual([]);
            setProductoSeleccionado(null);
        } else {
            // El useEffect procesará automáticamente
        }
    };

    // Adaptar procesarIngresoConProductosValidados para continuar la confirmación
    const procesarIngresoConProductosValidados = async () => {
        try {
            if (!modalValidacionMultiple) return;
            const productosFinales = [...productosValidados];
            if (!productosFinales || productosFinales.length === 0) {
                throw new Error('No hay productos para procesar.');
            }
            // Si hay un pedido pendiente de confirmación, continuar la confirmación
            if (pedidoPendienteConfirmacion) {
                await confirmarRecepcionBackend(pedidoPendienteConfirmacion, productosFinales);
                setPedidoPendienteConfirmacion(null);
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
            setProcesandoIngreso(false);
        }
    };

    // Efecto para procesar automáticamente cuando todos los productos han sido validados
    useEffect(() => {
        if (productosAValidar.length === 0 && productosValidados.length > 0 && modalValidacionMultiple && !procesandoIngreso) {
            setProcesandoIngreso(true);
            procesarIngresoConProductosValidados();
        }
    }, [productosAValidar.length, productosValidados.length, modalValidacionMultiple, procesandoIngreso]);

    const handleCrearIngresoSucursal = async (data: any) => {
        // data.productos debe ser el array de productos a ingresar
        const productosValidados = await validarTodosLosProductos(data.productos);
        if (!productosValidados) {
            // Guardar los datos del formulario para usarlos después
            setDatosFormularioPendiente(data);
            return; // El modal de validación múltiple se abrirá
        }
        // Si llegamos aquí, todos los productos están validados
        // Crear el pedido/ingreso en el backend usando data y data.productos
        // ... tu lógica de creación aquí ...
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
                                <MenuItem value="Pendiente">Pendiente</MenuItem>
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
                        <Button
                            variant="outlined"
                            onClick={fetchPedidosSucursal}
                            style={{
                                borderColor: "#FFD700",
                                color: "#FFD700",
                                fontWeight: 600
                            }}
                        >
                            Actualizar
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                // Ejemplo de producto para probar el modal
                                const productoEjemplo = {
                                    nombre: "Martillo de Acero",
                                    codigo: "MART001",
                                    marca: "Stanley",
                                    categoria: "Herramientas",
                                    cantidad: 5
                                };
                                buscarProductosSimilaresParaComparacion(productoEjemplo);
                            }}
                            style={{
                                borderColor: "#4CAF50",
                                color: "#4CAF50",
                                fontWeight: 600
                            }}
                        >
                            Probar Comparación
                        </Button>
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
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" style={{ color: "#FFD700", fontWeight: 700 }}>
                                        Cargando pedidos...
                                    </TableCell>
                                </TableRow>
                            ) : pedidosPaginados.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" style={{ color: "#8A8A8A" }}>
                                        No hay registros para mostrar.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pedidosPaginados.map((row: any, index: number) => (
                                    <TableRow key={`${row.id}-${row.fecha}-${index}`}>
                                        <TableCell style={{ color: "#fff" }}>{row.id}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>{row.fecha}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>{row.asignado || "-"}</TableCell>
                                        <TableCell style={{ color: "#fff" }}>
                                            {SUCURSALES.find(s => s.id === row.sucursalDestino)?.nombre || row.sucursalDestino || "-"}
                                        </TableCell>
                                        <TableCell style={{ color: "#fff" }}>
                                            {Array.isArray(row.productos)
                                                ? row.productos.reduce((acc: any, prod: any) => acc + Number(prod.cantidad), 0)
                                                : row.cantidad || 0}
                                        </TableCell>
                                        <TableCell>
                                            <EstadoBadge 
                                                estado={row.estado || "pendiente"} 
                                                tipo="pedido"
                                            />
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
                {/* Paginación */}
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "24px 0" }}>
                    <Button
                        variant="outlined"
                        onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
                        disabled={paginaActual === 1}
                        style={{ marginRight: 8 }}
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
                        style={{ marginLeft: 8 }}
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
                                        label="Fecha de entrega"
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
                                        label="Responsable de bodega"
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
                                        label="Bodega de origen"
                                        value={pedidoSeleccionado.bodegaOrigen || "Bodega Central"}
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

                                {/* Información de entrega */}
                                <Box sx={{ mb: 3, p: 2, bgcolor: "#232323", borderRadius: 2, border: "1px solid #333" }}>
                                    <Typography variant="subtitle2" sx={{ color: "#ccc", mb: 1 }}>
                                        🚚 Información de entrega
                                    </Typography>
                                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                                        <TextField
                                            label="Transportista asignado"
                                            value={pedidoSeleccionado.asignado || "Sin asignar"}
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
                                                                    {prod.nombre || prod.nombre_prodc}
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
                                                    nombre: usuario?.nombre || "-",
                                                    cargo: usuario?.rol || "-",
                                                },
                                                productos: (pedidoSeleccionado.productos || []).map((prod: any, idx: number) => ({
                                                    codigo: prod.codigo || `P${idx + 1}`,
                                                    descripcion: prod.nombre || prod.descripcion || "-",
                                                    cantidad: prod.cantidad || 0,
                                                })),
                                                observaciones: pedidoSeleccionado.observacion || pedidoSeleccionado.observaciones || "",
                                                conformidad: "Recibido conforme",
                                                responsable: usuario?.nombre || "-",
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
                                                    observaciones: pedidoSeleccionado.observacion || pedidoSeleccionado.observaciones || "",
                                                });
                                            }}
                                        >
                                            Orden de Compra Interna (OCI)
                                        </Button>
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
                    </DialogActions>
                </Dialog>
                {/* --- MODAL de validación múltiple --- */}
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
                                <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 700, mb: 1 }}>
                                    Ya existe un producto similar en el inventario
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#ccc', mb: 3 }}>
                                    Puedes <b>sumar la cantidad</b> al stock existente o <b>registrar como producto nuevo</b> si es diferente.<br/>
                                    <span style={{ color: '#FF9800', fontWeight: 500 }}>Revisa bien los datos antes de decidir.</span>
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    {/* Producto a ingresar */}
                                    <Box sx={{ bgcolor: '#232323', borderRadius: 2, p: 2, mb: 2, boxShadow: 2, flex: 1 }}>
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
                                    {/* Productos similares */}
                                    <Box sx={{ bgcolor: '#232323', borderRadius: 2, border: '1px solid #444', p: 2, flex: 1 }}>
                                        <Typography variant="subtitle2" sx={{ color: '#FFD700', fontWeight: 600, mb: 1 }}>
                                            Productos similares en inventario
                                        </Typography>
                                        {productosSimilaresActual.length > 0 ? (
                                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                                {productosSimilaresActual.map((producto, index) => (
                                                    <li 
                                                        key={index}
                                                        style={{
                                                            border: productoSeleccionado?.id === producto.id ? '2px solid #FFD700' : '1px solid #444',
                                                            borderRadius: 8,
                                                            marginBottom: 8,
                                                            cursor: 'pointer',
                                                            background: productoSeleccionado?.id === producto.id ? '#FFD70022' : '#232323',
                                                            padding: 8
                                                        }}
                                                        onClick={() => setProductoSeleccionado(producto)}
                                                    >
                                                        <span style={{ color: '#FFD700', fontWeight: 600 }}>{producto.nombre || producto.nombre_prodc}</span><br/>
                                                        <span style={{ color: '#ccc' }}>
                                                            Marca: {producto.marca_nombre || producto.marca} | Categoría: {producto.categoria_nombre || producto.categoria} | <b>Stock actual:</b> <span style={{ color: producto.stock > 0 ? '#4CAF50' : '#F44336', fontWeight: 600 }}>{producto.stock ?? 0}</span>
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <Typography variant="body2" sx={{ color: '#ccc' }}>
                                                No se encontraron productos similares. Se creará como nuevo producto.
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
                                    <Button 
                                        onClick={() => manejarDecisionProducto('nuevo')}
                                        variant="contained"
                                        sx={{ bgcolor: '#FFD700', color: '#232323', fontWeight: 700, borderRadius: 2, px: 4, boxShadow: 2, '&:hover': { bgcolor: '#FFC700' } }}
                                    >
                                        Crear como producto nuevo
                                    </Button>
                                    <Button 
                                        onClick={() => manejarDecisionProducto('existente', productoSeleccionado)}
                                        variant="contained"
                                        disabled={!productoSeleccionado}
                                        sx={{ bgcolor: '#4CAF50', color: '#fff', fontWeight: 700, borderRadius: 2, px: 4, boxShadow: 2, '&:hover': { bgcolor: '#43a047' }, '&:disabled': { bgcolor: '#666', color: '#ccc' } }}
                                    >
                                        Sumar al stock existente
                                    </Button>
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
                
                {/* Modal de comparación de productos */}
                {showComparacion && productoPendiente && (
                    <ModalComparacion
                        productoNuevo={{
                            nombre: productoPendiente.nombre || productoPendiente.nombre_prodc || "",
                            codigo_interno: productoPendiente.codigo || productoPendiente.codigo_interno || "",
                            marca: productoPendiente.marca || productoPendiente.marca_nombre || "",
                            categoria: productoPendiente.categoria || productoPendiente.categoria_nombre || "",
                            stock_actual: productoPendiente.cantidad || productoPendiente.stock || 0,
                            descripcion: productoPendiente.descripcion || ""
                        }}
                        productosSimilares={productosSimilares.map((prod: any) => ({
                            nombre: prod.nombre || prod.nombre_prodc || "",
                            codigo_interno: prod.codigo || prod.codigo_interno || "",
                            marca: prod.marca || prod.marca_nombre || "",
                            categoria: prod.categoria || prod.categoria_nombre || "",
                            stock_actual: prod.stock || prod.stock_actual || 0,
                            descripcion: prod.descripcion || ""
                        }))}
                        onUsarExistente={handleUsarExistente}
                        onCrearNuevo={handleCrearNuevo}
                        onCancelar={handleCancelarComparacion}
                        productoSeleccionado={productoSeleccionadoComparacion}
                        setProductoSeleccionado={setProductoSeleccionadoComparacion}
                    />
                )}
            </div>
        </Layout>
    );
}