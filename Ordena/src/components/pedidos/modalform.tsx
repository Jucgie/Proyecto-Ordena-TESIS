import React, { useState } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Box, Typography, FormControl, InputLabel, MenuItem, Tooltip, Chip, Snackbar, Alert, TableContainer, Paper, CircularProgress, LinearProgress
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import RefreshIcon from '@mui/icons-material/Refresh';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useProveedoresStore } from "../../store/useProveedorStore";
import { Select } from "@mui/material";
import { extraerProductosDesdePDFBackend } from '../../services/api';

interface Producto {
    nombre: string;
    cantidad: number;
    marca: string;
    categoria: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    tipo: "ingreso" | "salida";
    onSubmit: (data: any) => void;
    marcas: string[];
    categorias: string[];
}

// Servicio simple para generar documentos automáticamente
class DocumentoGenerator {
    private static remCounter = 1;

    static generarNumeroREM(): string {
        const fecha = new Date();
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const numero = String(this.remCounter).padStart(4, '0');
        this.remCounter++;
        return `REM-${año}${mes}-${numero}`;
    }

    static generarDocumentosAutomaticos() {
        return {
            numRem: this.generarNumeroREM()
        };
    }

    static formatearDocumento(tipo: 'REM', numero: string): string {
        if (!numero) return '';
        
        // Si ya tiene formato correcto, devolverlo
        const patrones = {
            REM: /^REM-\d{6}-\d{4}$/
        };
        
        if (patrones[tipo].test(numero)) {
            return numero;
        }

        // Limpiar y formatear
        const numeroLimpio = numero.replace(/[^0-9]/g, '');
        const fecha = new Date();
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        
        if (numeroLimpio.length >= 4) {
            const numeroFormateado = numeroLimpio.slice(-4).padStart(4, '0');
            return `REM-${año}${mes}-${numeroFormateado}`;
        }

        // Si no tiene suficientes dígitos, generar uno nuevo
        return this.generarNumeroREM();
    }
}

// Función para convertir fechas a yyyy-mm-dd
function normalizarFecha(fecha: string): string {
    if (!fecha) return '';
    // Reemplaza / por -
    let f = fecha.replace(/\//g, '-');
    // Si ya es yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(f)) return f;
    // Si es dd-mm-yyyy o mm-dd-yyyy
    const partes = f.split('-');
    if (partes.length === 3) {
        // Si el año está al final
        if (partes[2].length === 4) {
            // Si el primer valor es mayor a 12, es día-mes-año
            if (parseInt(partes[0], 10) > 12) {
                return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
            } else {
                // Si el segundo valor es mayor a 12, es mes-día-año
                return `${partes[2]}-${partes[0].padStart(2, '0')}-${partes[1].padStart(2, '0')}`;
            }
        }
        // Si el año está al inicio
        if (partes[0].length === 4) {
            return `${partes[0]}-${partes[1].padStart(2, '0')}-${partes[2].padStart(2, '0')}`;
        }
    }
    // Si no se puede parsear, retorna vacío
    return '';
}

export default React.memo(function ModalFormularioPedido({ open, onClose, tipo, onSubmit, marcas, categorias }: Props) {
    const addIngresoProveedor = useProveedoresStore(state => state.addIngresoProveedor);

    // Inputs comunes
    const [fecha, setFecha] = useState("");
    const [numRem, setNumRem] = useState("");
    // Inputs específicos para proveedor
    const [proveedorNombre, setProveedorNombre] = useState("");
    const [proveedorRut, setProveedorRut] = useState("");
    const [proveedorContacto, setProveedorContacto] = useState("");
    const [asignado, setAsignado] = useState("");
    const [sucursalDestino, setSucursalDestino] = useState("");
    
    // Nuevos campos para guía de despacho
    const [numGuiaDespacho, setNumGuiaDespacho] = useState("");
    const [archivoGuia, setArchivoGuia] = useState<File | null>(null);
    const [nombreArchivo, setNombreArchivo] = useState("");
    const [observacionesRecepcion, setObservacionesRecepcion] = useState("");
    
    // Productos
    const [productos, setProductos] = useState<Producto[]>([]);
    const [nuevoProducto, setNuevoProducto] = useState({ nombre: "", cantidad: 1, marca: "", categoria: "" });

    // Estados para extracción automática
    const [extrayendoProductos, setExtrayendoProductos] = useState(false);
    const [productosExtraidos, setProductosExtraidos] = useState<Producto[]>([]);
    const [mostrarProductosExtraidos, setMostrarProductosExtraidos] = useState(false);
    const [progresoExtraccion, setProgresoExtraccion] = useState(0);

    // Estados para feedback
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    // Función para mostrar feedback
    const mostrarFeedback = (message: string, severity: 'success' | 'error' = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    // Función para generar REM automáticamente
    const generarREMAutomatico = () => {
        const rem = DocumentoGenerator.generarNumeroREM();
        setNumRem(rem);
        mostrarFeedback('REM generado automáticamente');
    };

    // Función para formatear REM existente
    const formatearREM = () => {
        const numeroFormateado = DocumentoGenerator.formatearDocumento('REM', numRem);
        setNumRem(numeroFormateado);
        mostrarFeedback('REM formateado correctamente');
    };

    // Función para manejar la subida de archivo
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validar tipo de archivo
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                mostrarFeedback('Solo se permiten archivos PDF, JPG, JPEG o PNG', 'error');
                return;
            }
            
            // Validar tamaño (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                mostrarFeedback('El archivo no puede superar 5MB', 'error');
                return;
            }
            
            setArchivoGuia(file);
            setNombreArchivo(file.name);
            mostrarFeedback('Archivo cargado correctamente');
        }
    };

    // Función para eliminar archivo
    const handleRemoveFile = () => {
        setArchivoGuia(null);
        setNombreArchivo("");
        mostrarFeedback('Archivo eliminado');
    };

    

    const handleAddProducto = () => {
        if (nuevoProducto.nombre && nuevoProducto.cantidad > 0 && nuevoProducto.marca && nuevoProducto.categoria) {
            setProductos([...productos, nuevoProducto]);
            setNuevoProducto({ nombre: "", cantidad: 1, marca: "", categoria: "" });
        }
    };

    const handleRemoveProducto = (idx: number) => {
        setProductos(productos.filter((_, i) => i !== idx));
    };

    

    // Función para extraer productos automáticamente usando el backend
    const extraerProductosAutomaticamente = async () => {
        if (!archivoGuia) {
            mostrarFeedback('Primero debe subir el archivo de la guía de despacho', 'error');
            return;
        }
        setExtrayendoProductos(true);
        setProgresoExtraccion(0);
        setProductosExtraidos([]);
        setMostrarProductosExtraidos(false);
        try {
            // Simular progreso
            const interval = setInterval(() => {
                setProgresoExtraccion(prev => {
                    if (prev >= 90) {
                        clearInterval(interval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);
            const respuesta = await extraerProductosDesdePDFBackend(archivoGuia);
            clearInterval(interval);
            setProgresoExtraccion(100);
            // Procesar productos
            const productos = respuesta.productos || respuesta;
            const datos = respuesta.datos || {};
            console.log('Datos recibidos del backend:', datos);
            const productosFormateados = productos.map((prod: any) => ({
                nombre: prod.nombre || '',
                codigo: prod.codigo || '',
                cantidad: prod.cantidad || 1,
                marca: prod.marca || '',
                categoria: prod.categoria || ''
            }));
            setProductosExtraidos(productosFormateados);
            // Rellenar campos del formulario si existen en la respuesta
            if (datos) {
                if (datos.proveedor) {
                    setProveedorNombre(datos.proveedor);
                    console.log('Seteando proveedor:', datos.proveedor);
                }
                if (datos.rut) {
                    setProveedorRut(datos.rut);
                    console.log('Seteando rut:', datos.rut);
                }
                if (datos.direccion) {
                    setProveedorContacto(datos.direccion); // Usamos contacto para dirección si no hay campo específico
                    console.log('Seteando direccion/contacto:', datos.direccion);
                }
                if (datos.fecha) {
                    const fechaNormalizada = normalizarFecha(datos.fecha);
                    setFecha(fechaNormalizada);
                    console.log('Seteando fecha:', fechaNormalizada);
                }
                if (datos.num_guia) {
                    setNumGuiaDespacho(datos.num_guia);
                    console.log('Seteando num_guia:', datos.num_guia);
                }
            }
            if (productosFormateados.length > 0) {
                setMostrarProductosExtraidos(true);
                mostrarFeedback(`Se extrajeron ${productosFormateados.length} productos del PDF`);
            } else {
                mostrarFeedback('No se pudieron extraer productos del PDF.', 'error');
            }
        } catch (error) {
            mostrarFeedback('Error al extraer productos del PDF', 'error');
        } finally {
            setExtrayendoProductos(false);
            setProgresoExtraccion(0);
        }
    };

    const handleSubmit = () => {
        // Si es un ingreso y hay proveedor, guarda el ingreso en el historial del proveedor
        if (
            tipo === "ingreso" &&
            proveedorNombre &&
            proveedorRut &&
            productos.length > 0
        ) {
            addIngresoProveedor(
                {
                    nombre: proveedorNombre,
                    rut: proveedorRut,
                    contacto: proveedorContacto
                },
                {
                    fecha,
                    productos,
                    documentos: {
                        numRem,
                        numGuiaDespacho,
                        archivoGuia: nombreArchivo
                    },
                    observaciones: observacionesRecepcion
                }
            );
        }

        onSubmit({
            tipo,
            proveedor: tipo === "ingreso"
                ? {
                    nombre: proveedorNombre,
                    rut: proveedorRut,
                    contacto: proveedorContacto
                }
                : undefined,
            asignado: tipo === "salida" ? asignado : undefined,
            sucursalDestino: tipo === "salida" ? sucursalDestino : undefined,
            fecha,
            numRem,
            numGuiaDespacho,
            archivoGuia,
            nombreArchivo,
            observacionesRecepcion,
            productos,
        });
        
        // Limpiar formulario
        setProveedorNombre("");
        setProveedorRut("");
        setProveedorContacto("");
        setAsignado("");
        setSucursalDestino("");
        setFecha("");
        setNumRem("");
        setNumGuiaDespacho("");
        setArchivoGuia(null);
        setNombreArchivo("");
        setObservacionesRecepcion("");
        setProductos([]);
        onClose();
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: "#1a1a1a",
                        color: "#fff",
                        borderRadius: 3,
                        boxShadow: 8
                    }
                }}
            >
                <DialogTitle sx={{
                    background: "linear-gradient(135deg, #232323 0%, #1a1a1a 100%)",
                    color: "#FFD700",
                    borderBottom: "2px solid #FFD700",
                    fontWeight: 700,
                    fontSize: "1.35rem",
                    letterSpacing: 0.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1
                }}>
                    {tipo === "ingreso" ? "🟡 Nuevo Ingreso" : "Nueva Salida"}
                </DialogTitle>
                <DialogContent sx={{ bgcolor: "#1a1a1a", color: "#fff" }}>
                    <form>
                        {tipo === "ingreso" && (
                            <Box sx={{ mb: 3, p: { xs: 1, sm: 2 }, bgcolor: "#232323", borderRadius: 2, border: "1px solid #333" }}>
                                <Typography variant="h6" sx={{ color: "#FFD700", mb: 2, fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                                    📦 Datos del Proveedor
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                                        gap: 2,
                                        alignItems: 'end',
                                    }}
                                >
                                    <TextField
                                        label="Proveedor"
                                        value={proveedorNombre}
                                        onChange={e => setProveedorNombre(e.target.value)}
                                        fullWidth
                                        required
                                        InputLabelProps={{ style: { color: "#ccc" } }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                color: "#fff",
                                                '& fieldset': { borderColor: "#444" },
                                                '&:hover fieldset': { borderColor: "#FFD700" },
                                                '&.Mui-focused fieldset': { borderColor: "#FFD700" }
                                            },
                                            '& .MuiInputLabel-root': { color: "#ccc" }
                                        }}
                                    />
                                    <TextField
                                        label="RUT Proveedor"
                                        value={proveedorRut}
                                        onChange={e => setProveedorRut(e.target.value)}
                                        fullWidth
                                        required
                                        InputLabelProps={{ style: { color: "#ccc" } }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                color: "#fff",
                                                '& fieldset': { borderColor: "#444" },
                                                '&:hover fieldset': { borderColor: "#FFD700" },
                                                '&.Mui-focused fieldset': { borderColor: "#FFD700" }
                                            },
                                            '& .MuiInputLabel-root': { color: "#ccc" }
                                        }}
                                    />
                                    <TextField
                                        label="Contacto Proveedor"
                                        value={proveedorContacto}
                                        onChange={e => setProveedorContacto(e.target.value)}
                                        fullWidth
                                        InputLabelProps={{ style: { color: "#ccc" } }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                color: "#fff",
                                                '& fieldset': { borderColor: "#444" },
                                                '&:hover fieldset': { borderColor: "#FFD700" },
                                                '&.Mui-focused fieldset': { borderColor: "#FFD700" }
                                            },
                                            '& .MuiInputLabel-root': { color: "#ccc" }
                                        }}
                                    />
                                </Box>
                            </Box>
                        )}

                        {/* Sección de Documentos de Recepción */}
                        <Box sx={{ mb: 3, p: { xs: 1, sm: 2 }, bgcolor: "#232323", borderRadius: 2, border: "1px solid #333" }}>
                            <Typography variant="h6" sx={{ color: "#FFD700", mb: 2, fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                                📄 Documentos de Recepción
                            </Typography>
                            
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2, alignItems: 'end', mb: 2 }}>
                                <TextField
                                    label="Fecha de Recepción"
                                    type="date"
                                    value={fecha}
                                    onChange={e => setFecha(e.target.value)}
                                    InputLabelProps={{ shrink: true, style: { color: "#ccc" } }}
                                    fullWidth
                                    required
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            color: "#fff",
                                            '& fieldset': { borderColor: "#444" },
                                            '&:hover fieldset': { borderColor: "#FFD700" },
                                            '&.Mui-focused fieldset': { borderColor: "#FFD700" }
                                        },
                                        '& .MuiInputLabel-root': { color: "#ccc" }
                                    }}
                                />
                                
                                <TextField
                                    label="N° Guía de Despacho Proveedor"
                                    value={numGuiaDespacho}
                                    onChange={e => setNumGuiaDespacho(e.target.value)}
                                    fullWidth
                                    required
                                    placeholder="Ej: GD-2024-001234"
                                    InputLabelProps={{ style: { color: "#ccc" } }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            color: "#fff",
                                            '& fieldset': { borderColor: "#444" },
                                            '&:hover fieldset': { borderColor: "#FFD700" },
                                            '&.Mui-focused fieldset': { borderColor: "#FFD700" }
                                        },
                                        '& .MuiInputLabel-root': { color: "#ccc" }
                                    }}
                                />
                            </Box>

                            {/* Subida de archivo */}
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" sx={{ color: "#FFD700", mb: 1, fontWeight: 600 }}>
                                    📎 Adjuntar Guía de Despacho
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    <input
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        style={{ display: 'none' }}
                                        id="archivo-guia"
                                        type="file"
                                        onChange={handleFileUpload}
                                    />
                                    <label htmlFor="archivo-guia">
                                        <Button
                                            variant="outlined"
                                            component="span"
                                            startIcon={<UploadFileIcon />}
                                            sx={{
                                                borderColor: "#4CAF50",
                                                color: "#4CAF50",
                                                fontWeight: 600,
                                                "&:hover": {
                                                    borderColor: "#4CAF50",
                                                    bgcolor: "rgba(76, 175, 80, 0.1)"
                                                }
                                            }}
                                        >
                                            Seleccionar Archivo
                                        </Button>
                                    </label>
                                    {nombreArchivo && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <AttachFileIcon sx={{ color: "#4CAF50" }} />
                                            <Typography variant="body2" sx={{ color: "#fff" }}>
                                                {nombreArchivo}
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                onClick={handleRemoveFile}
                                                sx={{ color: "#ff4444" }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    )}
                                </Box>
                                <Typography variant="caption" sx={{ color: "#ccc", display: 'block', mt: 1 }}>
                                    Formatos permitidos: PDF, JPG, JPEG, PNG (máximo 5MB)
                                </Typography>
                            </Box>

                            {/* Extracción automática de productos */}
                            {nombreArchivo && (
                                <Box sx={{ mb: 2, p: 2, bgcolor: "#1a1a1a", borderRadius: 2, border: "1px solid #333" }}>
                                    <Typography variant="subtitle1" sx={{ color: "#FFD700", mb: 2, fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
                                        🤖 Extracción Automática de Productos
                                    </Typography>
                                    
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                                        <Tooltip title="Extraer productos automáticamente del documento usando IA">
                                            <Button
                                                variant="contained"
                                                startIcon={extrayendoProductos ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
                                                onClick={extraerProductosAutomaticamente}
                                                disabled={extrayendoProductos}
                                                sx={{
                                                    bgcolor: "#9C27B0",
                                                    color: "#fff",
                                                    fontWeight: 600,
                                                    "&:hover": { bgcolor: "#7B1FA2" },
                                                    "&:disabled": { bgcolor: "#666", color: "#999" }
                                                }}
                                            >
                                                {extrayendoProductos ? 'Extrayendo...' : 'Extraer Productos'}
                                            </Button>
                                        </Tooltip>
                                        
                                        {productosExtraidos.length > 0 && (
                                            <Chip
                                                label={`${productosExtraidos.length} productos extraídos`}
                                                color="success"
                                                variant="outlined"
                                                sx={{ color: "#4CAF50", borderColor: "#4CAF50" }}
                                            />
                                        )}
                                    </Box>

                                    {/* Barra de progreso */}
                                    {extrayendoProductos && (
                                        <Box sx={{ mb: 2 }}>
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={progresoExtraccion}
                                                sx={{
                                                    height: 8,
                                                    borderRadius: 4,
                                                    bgcolor: "#333",
                                                    '& .MuiLinearProgress-bar': {
                                                        bgcolor: "#9C27B0"
                                                    }
                                                }}
                                            />
                                            <Typography variant="caption" sx={{ color: "#ccc", mt: 1, display: 'block' }}>
                                                Procesando documento... {progresoExtraccion}%
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* Resultados de extracción */}
                                    {mostrarProductosExtraidos && productosExtraidos.length > 0 && (
                                        <Box sx={{ mt: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Typography variant="subtitle2" sx={{ color: "#FFD700", fontWeight: 600 }}>
                                                    📋 Productos Detectados
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<VisibilityIcon />}
                                                        onClick={() => setMostrarProductosExtraidos(!mostrarProductosExtraidos)}
                                                        sx={{
                                                            borderColor: "#FFD700",
                                                            color: "#FFD700",
                                                            "&:hover": {
                                                                borderColor: "#FFD700",
                                                                bgcolor: "rgba(255, 215, 0, 0.1)"
                                                            }
                                                        }}
                                                    >
                                                        {mostrarProductosExtraidos ? 'Ocultar' : 'Ver'}
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        startIcon={<AddIcon />}
                                                        onClick={() => {
                                                            setProductos(productosExtraidos);
                                                            setMostrarProductosExtraidos(false);
                                                        }}
                                                        sx={{
                                                            bgcolor: "#4CAF50",
                                                            color: "#fff",
                                                            "&:hover": { bgcolor: "#45a049" }
                                                        }}
                                                    >
                                                        Agregar Todos
                                                    </Button>
                                                </Box>
                                            </Box>

                                            {mostrarProductosExtraidos && (
                                                <TableContainer component={Paper} sx={{ bgcolor: "#2a2a2a", border: "1px solid #444", maxHeight: 300 }}>
                                                    <Table size="small">
                                                        <TableHead>
                                                            <TableRow sx={{ bgcolor: "#333" }}>
                                                                <TableCell sx={{ color: "#FFD700", fontWeight: 600, fontSize: '0.8rem' }}>Producto</TableCell>
                                                                <TableCell sx={{ color: "#FFD700", fontWeight: 600, fontSize: '0.8rem' }}>Código</TableCell>
                                                                <TableCell sx={{ color: "#FFD700", fontWeight: 600, fontSize: '0.8rem' }}>Cantidad</TableCell>
                                                                <TableCell sx={{ color: "#FFD700", fontWeight: 600, fontSize: '0.8rem' }}>Marca</TableCell>
                                                                <TableCell sx={{ color: "#FFD700", fontWeight: 600, fontSize: '0.8rem' }}>Categoría</TableCell>
                                                                <TableCell sx={{ color: "#FFD700", fontWeight: 600, fontSize: '0.8rem' }}>Acciones</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {productosExtraidos.map((producto, idx) => (
                                                                <TableRow key={idx} sx={{ '&:nth-of-type(odd)': { bgcolor: '#232323' } }}>
                                                                    <TableCell sx={{ color: "#fff", fontSize: '0.8rem' }}>{producto.nombre}</TableCell>
                                                                    <TableCell sx={{ color: "#fff", fontSize: '0.8rem' }}>{producto.codigo || '-'}</TableCell>
                                                                    <TableCell sx={{ color: "#fff", fontSize: '0.8rem' }}>{producto.cantidad}</TableCell>
                                                                    <TableCell sx={{ color: "#fff", fontSize: '0.8rem' }}>{producto.marca || '-'}</TableCell>
                                                                    <TableCell sx={{ color: "#fff", fontSize: '0.8rem' }}>{producto.categoria || '-'}</TableCell>
                                                                    <TableCell>
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() => {
                                                                                setProductos(productos.filter((p) => p.nombre !== producto.nombre));
                                                                                setMostrarProductosExtraidos(false);
                                                                            }}
                                                                            sx={{ color: "#ff4444" }}
                                                                        >
                                                                            <DeleteIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            )}

                            {/* Generación automática de REM */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle1" sx={{ color: "#FFD700", fontWeight: 600 }}>
                                    📋 Nota de Recepción Interna (REM)
                                </Typography>
                                <Tooltip title="Generar número de REM automáticamente">
                                    <Button
                                        variant="outlined"
                                        startIcon={<AutoFixHighIcon />}
                                        onClick={generarREMAutomatico}
                                        sx={{
                                            borderColor: "#4CAF50",
                                            color: "#4CAF50",
                                            fontWeight: 600,
                                            "&:hover": {
                                                borderColor: "#4CAF50",
                                                bgcolor: "rgba(76, 175, 80, 0.1)"
                                            }
                                        }}
                                    >
                                        Generar REM
                                    </Button>
                                </Tooltip>
                            </Box>
                            
                            <Box sx={{ position: 'relative' }}>
                                <TextField
                                    label="N° REM"
                                    value={numRem}
                                    onChange={e => setNumRem(e.target.value)}
                                    fullWidth
                                    required
                                    placeholder="REM-202412-0001"
                                    InputLabelProps={{ style: { color: "#ccc" } }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            color: "#fff",
                                            '& fieldset': { borderColor: "#444" },
                                            '&:hover fieldset': { borderColor: "#FFD700" },
                                            '&.Mui-focused fieldset': { borderColor: "#FFD700" }
                                        },
                                        '& .MuiInputLabel-root': { color: "#ccc" }
                                    }}
                                />
                                <Box sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
                                    <Tooltip title="Formatear número de REM">
                                        <IconButton
                                            size="small"
                                            onClick={formatearREM}
                                            sx={{ color: "#FFD700", p: 0.5 }}
                                        >
                                            <RefreshIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>

                            {/* Indicadores de estado */}
                            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip
                                    label={`Guía: ${numGuiaDespacho ? '✓ Registrada' : '⚠ Pendiente'}`}
                                    size="small"
                                    color={numGuiaDespacho ? "success" : "warning"}
                                    variant="outlined"
                                />
                                <Chip
                                    label={`Archivo: ${nombreArchivo ? '✓ Adjuntado' : '⚠ Pendiente'}`}
                                    size="small"
                                    color={nombreArchivo ? "success" : "warning"}
                                    variant="outlined"
                                />
                                <Chip
                                    label={`REM: ${numRem ? '✓ Generado' : '⚠ Pendiente'}`}
                                    size="small"
                                    color={numRem ? "success" : "warning"}
                                    variant="outlined"
                                />
                            </Box>
                        </Box>

                        {/* Observaciones de Recepción */}
                        <Box sx={{ mb: 3, p: { xs: 1, sm: 2 }, bgcolor: "#232323", borderRadius: 2, border: "1px solid #333" }}>
                            <Typography variant="h6" sx={{ color: "#FFD700", mb: 2, fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                                📝 Observaciones de Recepción
                            </Typography>
                            <TextField
                                label="Diferencias encontradas, observaciones o comentarios"
                                value={observacionesRecepcion}
                                onChange={e => setObservacionesRecepcion(e.target.value)}
                                multiline
                                rows={3}
                                fullWidth
                                placeholder="Ej: Producto X llegó con 2 unidades menos, Producto Y en buen estado..."
                                InputLabelProps={{ style: { color: "#ccc" } }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: "#fff",
                                        '& fieldset': { borderColor: "#444" },
                                        '&:hover fieldset': { borderColor: "#FFD700" },
                                        '&.Mui-focused fieldset': { borderColor: "#FFD700" }
                                    },
                                    '& .MuiInputLabel-root': { color: "#ccc" }
                                }}
                            />
                        </Box>

                        {/* Productos */}
                        <Box sx={{ mt: 3, p: 2, bgcolor: "#232323", borderRadius: 2, border: "1px solid #333" }}>
                            <Typography variant="h6" sx={{ color: "#FFD700", mb: 2, fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                                🛒 Productos Recibidos
                            </Typography>
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
                                    gap: 2,
                                    mb: 2,
                                    alignItems: 'end',
                                }}
                            >
                                <TextField
                                    label="Producto"
                                    value={nuevoProducto.nombre}
                                    onChange={e => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
                                    size="small"
                                    required
                                    InputLabelProps={{ style: { color: "#ccc" } }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            color: "#fff",
                                            '& fieldset': { borderColor: "#444" },
                                            '&:hover fieldset': { borderColor: "#FFD700" },
                                            '&.Mui-focused fieldset': { borderColor: "#FFD700" }
                                        },
                                        '& .MuiInputLabel-root': { color: "#ccc" }
                                    }}
                                />
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ color: "#ccc" }}>Marca</InputLabel>
                                    <Select
                                        value={nuevoProducto.marca}
                                        label="Marca"
                                        onChange={e => setNuevoProducto({ ...nuevoProducto, marca: e.target.value })}
                                        sx={{
                                            color: "#fff",
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: "#444" },
                                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: "#FFD700" },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: "#FFD700" }
                                        }}
                                        MenuProps={{
                                            PaperProps: {
                                                sx: {
                                                    bgcolor: '#232323',
                                                    border: '1px solid #333',
                                                    '& .MuiMenuItem-root': {
                                                        color: '#fff',
                                                        '&:hover': {
                                                            bgcolor: '#2a2a2a'
                                                        },
                                                        '&.Mui-selected': {
                                                            bgcolor: '#FFD700',
                                                            color: '#232323',
                                                            '&:hover': {
                                                                bgcolor: '#FFD700'
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }}
                                    >
                                        {marcas.map((marca, idx) => (
                                            <MenuItem key={idx} value={marca}>{marca}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ color: "#ccc" }}>Categoría</InputLabel>
                                    <Select
                                        value={nuevoProducto.categoria}
                                        label="Categoría"
                                        onChange={e => setNuevoProducto({ ...nuevoProducto, categoria: e.target.value })}
                                        sx={{
                                            color: "#fff",
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: "#444" },
                                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: "#FFD700" },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: "#FFD700" }
                                        }}
                                        MenuProps={{
                                            PaperProps: {
                                                sx: {
                                                    bgcolor: '#232323',
                                                    border: '1px solid #333',
                                                    '& .MuiMenuItem-root': {
                                                        color: '#fff',
                                                        '&:hover': {
                                                            bgcolor: '#2a2a2a'
                                                        },
                                                        '&.Mui-selected': {
                                                            bgcolor: '#FFD700',
                                                            color: '#232323',
                                                            '&:hover': {
                                                                bgcolor: '#FFD700'
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }}
                                    >
                                        {categorias.map((cat, idx) => (
                                            <MenuItem key={idx} value={cat}>{cat}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <TextField
                                    label="Cantidad"
                                    type="number"
                                    value={nuevoProducto.cantidad}
                                    onChange={e => setNuevoProducto({ ...nuevoProducto, cantidad: Number(e.target.value) })}
                                    inputProps={{ min: 1 }}
                                    size="small"
                                    required
                                    sx={{
                                        width: 120,
                                        '& .MuiOutlinedInput-root': {
                                            color: "#fff",
                                            '& fieldset': { borderColor: "#444" },
                                            '&:hover fieldset': { borderColor: "#FFD700" },
                                            '&.Mui-focused fieldset': { borderColor: "#FFD700" }
                                        },
                                        '& .MuiInputLabel-root': { color: "#ccc" }
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={handleAddProducto}
                                    disabled={!nuevoProducto.nombre || !nuevoProducto.marca || !nuevoProducto.categoria || nuevoProducto.cantidad <= 0}
                                    sx={{
                                        bgcolor: "#4CAF50",
                                        color: "#fff",
                                        fontWeight: 600,
                                        "&:hover": { bgcolor: "#45a049" },
                                        "&:disabled": { bgcolor: "#666", color: "#999" }
                                    }}
                                >
                                    Agregar
                                </Button>
                            </Box>

                            {/* Tabla de productos */}
                            {productos.length > 0 && (
                                <TableContainer component={Paper} sx={{ bgcolor: "#2a2a2a", border: "1px solid #444" }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: "#333" }}>
                                                <TableCell sx={{ color: "#FFD700", fontWeight: 600 }}>Producto</TableCell>
                                                <TableCell sx={{ color: "#FFD700", fontWeight: 600 }}>Marca</TableCell>
                                                <TableCell sx={{ color: "#FFD700", fontWeight: 600 }}>Categoría</TableCell>
                                                <TableCell sx={{ color: "#FFD700", fontWeight: 600 }}>Cantidad</TableCell>
                                                <TableCell sx={{ color: "#FFD700", fontWeight: 600 }}>Acciones</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {productos.map((producto, idx) => (
                                                <TableRow key={idx} sx={{ '&:nth-of-type(odd)': { bgcolor: '#232323' } }}>
                                                    <TableCell sx={{ color: "#fff" }}>{producto.nombre}</TableCell>
                                                    <TableCell sx={{ color: "#fff" }}>{producto.marca}</TableCell>
                                                    <TableCell sx={{ color: "#fff" }}>{producto.categoria}</TableCell>
                                                    <TableCell sx={{ color: "#fff" }}>{producto.cantidad}</TableCell>
                                                    <TableCell>
                                                        <IconButton
                                                            onClick={() => handleRemoveProducto(idx)}
                                                            sx={{ color: "#ff4444" }}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>
                    </form>
                </DialogContent>
                <DialogActions sx={{ bgcolor: "#1a1a1a", p: 2, gap: 1 }}>
                    <Button
                        onClick={onClose}
                        sx={{
                            color: "#ccc",
                            borderColor: "#666",
                            "&:hover": {
                                borderColor: "#999",
                                bgcolor: "rgba(255, 255, 255, 0.1)"
                            }
                        }}
                        variant="outlined"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!fecha || !numRem || !numGuiaDespacho || productos.length === 0 || (tipo === "ingreso" && (!proveedorNombre || !proveedorRut))}
                        sx={{
                            bgcolor: "#FFD700",
                            color: "#232323",
                            fontWeight: 700,
                            "&:hover": { bgcolor: "#FFC700" },
                            "&:disabled": { bgcolor: "#666", color: "#999" }
                        }}
                        variant="contained"
                    >
                        {tipo === "ingreso" ? "Crear Ingreso" : "Crear Salida"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar para feedback */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
});