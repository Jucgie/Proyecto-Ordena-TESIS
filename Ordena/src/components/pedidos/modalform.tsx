import React, { useState, useEffect } from "react";
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

// Servicio para generar documentos automáticamente
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

    static formatearDocumento(tipo: 'REM', numero: string): string {
        if (!numero) return '';
        
        const patrones = {
            REM: /^REM-\d{6}-\d{4}$/
        };
        
        if (patrones[tipo].test(numero)) {
            return numero;
        }

        const numeroLimpio = numero.replace(/[^0-9]/g, '');
        const fecha = new Date();
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        
        if (numeroLimpio.length >= 4) {
            const numeroFormateado = numeroLimpio.slice(-4).padStart(4, '0');
            return `REM-${año}${mes}-${numeroFormateado}`;
        }

        return this.generarNumeroREM();
    }
}

// Función para convertir fechas a yyyy-mm-dd
function normalizarFecha(fecha: string): string {
    if (!fecha) return '';
    let f = fecha.replace(/\//g, '-');
    if (/^\d{4}-\d{2}-\d{2}$/.test(f)) return f;
    
    const partes = f.split('-');
    if (partes.length === 3) {
        if (partes[2].length === 4) {
            if (parseInt(partes[0], 10) > 12) {
                return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
            } else {
                return `${partes[2]}-${partes[0].padStart(2, '0')}-${partes[1].padStart(2, '0')}`;
            }
        }
        if (partes[0].length === 4) {
            return `${partes[0]}-${partes[1].padStart(2, '0')}-${partes[2].padStart(2, '0')}`;
        }
    }
    return '';
}

export default React.memo(function ModalFormularioPedido({ open, onClose, tipo, onSubmit, marcas, categorias }: Props) {
    // Estados para productos
    const [productos, setProductos] = useState<Producto[]>([]);
    const [productosExtraidos, setProductosExtraidos] = useState<Producto[]>([]);
    const [mostrarProductosExtraidos, setMostrarProductosExtraidos] = useState(false);
    
    // Estados para archivo PDF
    const [archivoGuia, setArchivoGuia] = useState<File | null>(null);
    const [nombreArchivo, setNombreArchivo] = useState("");
    const [extrayendoProductos, setExtrayendoProductos] = useState(false);
    const [progresoExtraccion, setProgresoExtraccion] = useState(0);
    
    // Estados para documentos
    const [fecha, setFecha] = useState("");
    const [numGuiaDespacho, setNumGuiaDespacho] = useState("");
    const [observacionesRecepcion, setObservacionesRecepcion] = useState("");
    
    // Estados para proveedor (se rellenan automáticamente desde PDF)
    const [proveedorNombre, setProveedorNombre] = useState("");
    const [proveedorRut, setProveedorRut] = useState("");
    const [proveedorContacto, setProveedorContacto] = useState("");
    const [proveedorTelefono, setProveedorTelefono] = useState("");
    const [proveedorEmail, setProveedorEmail] = useState("");
    
    // Estados para salida
    const [asignado, setAsignado] = useState("");
    const [sucursalDestino, setSucursalDestino] = useState("");

    const mostrarFeedback = (message: string, severity: 'success' | 'error' = 'success') => {};

    // Función para validar y corregir categorías inválidas
    const validarCategorias = (productos: Producto[]) => {
        return productos.map(producto => ({
            ...producto,
            categoria: categorias.includes(producto.categoria) ? producto.categoria : categorias[0] || ''
        }));
    };

    // Validar productos cuando cambian las categorías
    useEffect(() => {
        if (open && categorias.length > 0 && productos.length > 0) {
            const productosValidados = validarCategorias(productos);
            if (JSON.stringify(productosValidados) !== JSON.stringify(productos)) {
                setProductos(productosValidados);
            }
        }
    }, [open]); // Solo depende de open, así solo se ejecuta al abrir el modal

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                mostrarFeedback('El archivo es demasiado grande. Máximo 5MB.', 'error');
                return;
            }
            setArchivoGuia(file);
            setNombreArchivo(file.name);
            mostrarFeedback(`Archivo cargado: ${file.name}`);
        }
    };

    const handleRemoveFile = () => {
        setArchivoGuia(null);
        setNombreArchivo("");
        setProductosExtraidos([]);
        setMostrarProductosExtraidos(false);
        mostrarFeedback('Archivo removido');
    };

    const handleAddProducto = () => {
        // Agregar producto al array local como antes
        setProductos([...productos, { nombre: '', cantidad: 1, marca: '', categoria: '' }]);
    };

    const handleRemoveProducto = (idx: number) => {
        setProductos(productos.filter((_, i) => i !== idx));
    };

    // Función para agregar un producto individual desde la lista extraída
    const handleAddProductoExtraido = (productoExtraido: Producto) => {
        const existe = productos.some(p => p.nombre === productoExtraido.nombre);
        if (existe) {
            mostrarFeedback('Este producto ya está en la lista', 'error');
            return;
        }
        setProductos([...productos, productoExtraido]);
        mostrarFeedback(`Producto "${productoExtraido.nombre}" agregado`);
    };

    // Función para agregar todos los productos extraídos
    const handleAddTodosProductosExtraidos = () => {
        const productosNuevos = productosExtraidos.filter(
            extraido => !productos.some(existente => existente.nombre === extraido.nombre)
        );
        if (productosNuevos.length === 0) {
            mostrarFeedback('Todos los productos ya están en la lista', 'error');
            return;
        }
        setProductos([...productos, ...productosNuevos]);
        mostrarFeedback(`${productosNuevos.length} productos agregados`);
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
            const resumen = respuesta.resumen || {};
            
            const productosFormateados = productos.map((prod: any) => ({
                nombre: prod.nombre || '',
                codigo: prod.codigo || '',
                cantidad: prod.cantidad || 1,
                marca: prod.marca || '',
                categoria: prod.categoria || ''
            }));
            setProductosExtraidos(productosFormateados);
            
            // Rellenar campos del formulario con información extraída
            let camposRellenados = 0;
            
            if (datos.proveedor) {
                setProveedorNombre(datos.proveedor);
                camposRellenados++;
            } else {
            }
            
            if (datos.rut) {
                setProveedorRut(datos.rut);
                camposRellenados++;
            } else {
            }
            
            if (datos.direccion) {
                setProveedorContacto(datos.direccion);
                camposRellenados++;
            } else {
            }
            
            if (datos.telefono) {
                setProveedorTelefono(datos.telefono);
                camposRellenados++;
            } else {
            }
            
            if (datos.contacto) {
                const contactoActual = proveedorContacto;
                const nuevoContacto = contactoActual ? `${contactoActual} | ${datos.contacto}` : datos.contacto;
                setProveedorContacto(nuevoContacto);
                camposRellenados++;
            } else {
            }
            
            if (datos.email) {
                setProveedorEmail(datos.email);
                camposRellenados++;
            } else {
            }
            
            if (datos.fecha) {
                const fechaNormalizada = normalizarFecha(datos.fecha);
                setFecha(fechaNormalizada);
                camposRellenados++;
            } else {
            }
            
            if (datos.num_guia) {
                setNumGuiaDespacho(datos.num_guia);
                camposRellenados++;
            }
            
            if (datos.observaciones) {
                setObservacionesRecepcion(datos.observaciones);
                camposRellenados++;
            } else {
            }
            
            
            // Verificar que los campos se actualizaron
            setTimeout(() => {
            }, 100);
            
            // Mostrar resumen de extracción
            let mensaje = `✅ Extracción completada:\n`;
            mensaje += `• ${productosFormateados.length} productos encontrados\n`;
            mensaje += `• ${camposRellenados} campos del formulario rellenados automáticamente`;
            
            if (resumen.campos_extraidos) {
                const camposExtraidos = Object.keys(resumen.campos_extraidos);
                if (camposExtraidos.length > 0) {
                    mensaje += `\n• Campos extraídos: ${camposExtraidos.join(', ')}`;
                }
            }
            
            if (productosFormateados.length > 0) {
                setMostrarProductosExtraidos(true);
                mostrarFeedback(mensaje);
            } else {
                mostrarFeedback('No se pudieron extraer productos del PDF, pero se rellenaron algunos campos del formulario.', 'error');
            }
            
        } catch (error) {
            console.error('Error en extracción:', error);
            mostrarFeedback('Error al extraer información del PDF. Verifique que el archivo sea válido.', 'error');
        } finally {
            setExtrayendoProductos(false);
            setProgresoExtraccion(0);
        }
    };

    const handleSubmit = () => {
        // Validar que todos los productos tengan los campos requeridos
        const productosValidos = productos.filter(p => p.nombre.trim() && p.cantidad > 0);
        
        if (productosValidos.length === 0) {
            mostrarFeedback('Debe agregar al menos un producto válido', 'error');
            return;
        }

        onSubmit({
            tipo,
            proveedor: tipo === "ingreso"
                ? {
                    nombre: proveedorNombre,
                    rut: proveedorRut,
                    contacto: proveedorContacto,
                    telefono: proveedorTelefono,
                    email: proveedorEmail
                }
                : undefined,
            asignado: tipo === "salida" ? asignado : undefined,
            sucursalDestino: tipo === "salida" ? sucursalDestino : undefined,
            fecha,
            numGuiaDespacho,
            archivoGuia,
            nombreArchivo,
            observacionesRecepcion,
            productos: productosValidos,
        });
        
        // Limpiar formulario
        setProveedorNombre("");
        setProveedorRut("");
        setProveedorContacto("");
        setProveedorTelefono("");
        setProveedorEmail("");
        setAsignado("");
        setSucursalDestino("");
        setFecha("");
        setNumGuiaDespacho("");
        setArchivoGuia(null);
        setNombreArchivo("");
        setObservacionesRecepcion("");
        setProductos([]);
        setProductosExtraidos([]);
        setMostrarProductosExtraidos(false);
        onClose();
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: "#1a1a1a",
                        color: "#fff",
                        borderRadius: "12px",
                        border: "1px solid #333"
                    }
                }}
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
                disableEnforceFocus
                disableAutoFocus
                keepMounted={false}
            >
                <DialogTitle sx={{
                    bgcolor: "#1a1a1a",
                    color: "#FFD700",
                    fontWeight: 700,
                    fontSize: "24px",
                    borderBottom: "1px solid #333",
                    p: 3
                }}
                id="modal-title"
                >
                    {tipo === "ingreso" ? "Registrar Ingreso de Productos" : "Registrar Salida de Productos"}
                </DialogTitle>
                
                <DialogContent sx={{ 
                    bgcolor: "#1a1a1a", 
                    p: 3,
                    "& .MuiDialogContent-root": {
                        bgcolor: "#1a1a1a"
                    }
                }}
                id="modal-description"
                >
                    <form>
                        {/* SECCIÓN 1: SUBIDA DE PDF Y EXTRACCIÓN AUTOMÁTICA */}
                        <Box sx={{ mb: 3, p: { xs: 1, sm: 2 }, bgcolor: "#232323", borderRadius: 2, border: "1px solid #333" }}>
                            <Typography variant="h6" sx={{ color: "#FFD700", mb: 2, fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                                📄 Extracción Automática desde PDF (Opcional)
                            </Typography>
                            
                            <Typography variant="body2" sx={{ color: "#ccc", mb: 2 }}>
                                Sube una guía de despacho o factura para extraer automáticamente la información del proveedor y productos.
                            </Typography>
                            
                            {/* Subida de archivo */}
                            <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
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
                                            {archivoGuia ? "Cambiar Archivo" : "Seleccionar PDF"}
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
                                <Typography variant="caption" sx={{ color: "#ccc", display: 'block' }}>
                                    Formatos permitidos: PDF, JPG, JPEG, PNG (máximo 5MB)
                                </Typography>
                            </Box>

                            {/* Botón de extracción automática */}
                            {archivoGuia && (
                                <Box sx={{ mb: 2 }}>
                                    <Button
                                        variant="contained"
                                        onClick={extraerProductosAutomaticamente}
                                        disabled={extrayendoProductos}
                                        startIcon={extrayendoProductos ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
                                        sx={{
                                            bgcolor: "#FFD700",
                                            color: "#000",
                                            fontWeight: 700,
                                            "&:hover": {
                                                bgcolor: "#FFC700"
                                            },
                                            "&:disabled": {
                                                bgcolor: "#666"
                                            }
                                        }}
                                    >
                                        {extrayendoProductos ? `Extrayendo... ${progresoExtraccion}%` : "🤖 Extraer Información Automáticamente"}
                                    </Button>
                                    
                                    {extrayendoProductos && (
                                        <Box sx={{ mt: 1 }}>
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={progresoExtraccion}
                                                sx={{
                                                    bgcolor: "#333",
                                                    "& .MuiLinearProgress-bar": {
                                                        bgcolor: "#FFD700"
                                                    }
                                                }}
                                            />
                                        </Box>
                                    )}
                                </Box>
                            )}

                            {/* Productos extraídos */}
                            {mostrarProductosExtraidos && productosExtraidos.length > 0 && (
                                <Box sx={{ mb: 2, p: 2, bgcolor: "#1a1a1a", borderRadius: 2, border: "1px solid #444" }}>
                                    <Typography variant="subtitle1" sx={{ color: "#FFD700", mb: 2, fontWeight: 600 }}>
                                        📦 Productos Extraídos ({productosExtraidos.length})
                                    </Typography>
                                    
                                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={handleAddTodosProductosExtraidos}
                                            sx={{
                                                borderColor: "#4CAF50",
                                                color: "#4CAF50",
                                                "&:hover": {
                                                    borderColor: "#4CAF50",
                                                    bgcolor: "rgba(76, 175, 80, 0.1)"
                                                }
                                            }}
                                        >
                                            ➕ Agregar Todos
                                        </Button>
                                    </Box>
                                    
                                    <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                                        {productosExtraidos.map((producto, index) => (
                                            <Box key={index} sx={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center',
                                                p: 1,
                                                mb: 1,
                                                bgcolor: "#2a2a2a",
                                                borderRadius: 1,
                                                border: "1px solid #444"
                                            }}>
                                                <Box>
                                                    <Typography variant="body2" sx={{ color: "#fff", fontWeight: 600 }}>
                                                        {producto.nombre}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: "#ccc" }}>
                                                        Código: {producto.codigo} | Cantidad: {producto.cantidad}
                                                    </Typography>
                                                </Box>
                                                <Button
                                                    size="small"
                                                    onClick={() => handleAddProductoExtraido(producto)}
                                                    sx={{
                                                        bgcolor: "#4CAF50",
                                                        color: "#fff",
                                                        "&:hover": {
                                                            bgcolor: "#45a049"
                                                        }
                                                    }}
                                                >
                                                    ➕
                                                </Button>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Box>

                        {/* SECCIÓN 2: DATOS DEL PROVEEDOR (solo para ingreso) */}
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
                                        label="Dirección"
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
                                    <TextField
                                        label="Teléfono"
                                        value={proveedorTelefono}
                                        onChange={e => setProveedorTelefono(e.target.value)}
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
                                    <TextField
                                        label="Email"
                                        type="email"
                                        value={proveedorEmail}
                                        onChange={e => setProveedorEmail(e.target.value)}
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

                        {/* SECCIÓN 3: DATOS DE SALIDA (solo para salida) */}
                        {tipo === "salida" && (
                            <Box sx={{ mb: 3, p: { xs: 1, sm: 2 }, bgcolor: "#232323", borderRadius: 2, border: "1px solid #333" }}>
                                <Typography variant="h6" sx={{ color: "#FFD700", mb: 2, fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                                    📤 Datos de Salida
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                                        gap: 2,
                                        alignItems: 'end',
                                    }}
                                >
                                    <TextField
                                        label="Asignado a"
                                        value={asignado}
                                        onChange={e => setAsignado(e.target.value)}
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
                                        label="Sucursal Destino"
                                        value={sucursalDestino}
                                        onChange={e => setSucursalDestino(e.target.value)}
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
                                </Box>
                            </Box>
                        )}

                        {/* SECCIÓN 4: DOCUMENTOS DE RECEPCIÓN */}
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

                            <TextField
                                label="Observaciones de Recepción"
                                value={observacionesRecepcion}
                                onChange={e => setObservacionesRecepcion(e.target.value)}
                                fullWidth
                                multiline
                                rows={3}
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

                        {/* SECCIÓN 5: PRODUCTOS */}
                        <Box sx={{ mb: 3, p: { xs: 1, sm: 2 }, bgcolor: "#232323", borderRadius: 2, border: "1px solid #333" }}>
                            <Typography variant="h6" sx={{ color: "#FFD700", mb: 2, fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                                📦 Productos
                            </Typography>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="body2" sx={{ color: "#ccc" }}>
                                    {productos.length} producto{productos.length !== 1 ? 's' : ''} agregado{productos.length !== 1 ? 's' : ''}
                                </Typography>
                                <Button
                                    variant="outlined"
                                    onClick={handleAddProducto}
                                    startIcon={<AddIcon />}
                                    sx={{
                                        borderColor: "#4CAF50",
                                        color: "#4CAF50",
                                        "&:hover": {
                                            borderColor: "#4CAF50",
                                            bgcolor: "rgba(76, 175, 80, 0.1)"
                                        }
                                    }}
                                >
                                    Agregar Producto
                                </Button>
                            </Box>

                            {productos.map((producto, index) => (
                                <Box key={index} sx={{ 
                                    mb: 2, 
                                    p: 2, 
                                    bgcolor: "#1a1a1a", 
                                    borderRadius: 2, 
                                    border: "1px solid #444",
                                    position: 'relative'
                                }}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleRemoveProducto(index)}
                                        sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            color: "#ff4444",
                                            "&:hover": {
                                                bgcolor: "rgba(255, 68, 68, 0.1)"
                                            }
                                        }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                    
                                    <Box sx={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
                                        gap: 2 
                                    }}>
                                        <TextField
                                            label="Nombre del Producto"
                                            value={producto.nombre}
                                            onChange={e => {
                                                const nuevosProductos = [...productos];
                                                nuevosProductos[index].nombre = e.target.value;
                                                setProductos(nuevosProductos);
                                            }}
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
                                            label="Cantidad"
                                            type="number"
                                            value={producto.cantidad}
                                            onChange={e => {
                                                const nuevosProductos = [...productos];
                                                nuevosProductos[index].cantidad = parseInt(e.target.value) || 0;
                                                setProductos(nuevosProductos);
                                            }}
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
                                            select
                                            label="Marca"
                                            value={producto.marca}
                                            onChange={e => {
                                                const nuevosProductos = [...productos];
                                                nuevosProductos[index].marca = e.target.value;
                                                setProductos(nuevosProductos);
                                            }}
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
                                            SelectProps={{
                                                MenuProps: {
                                                    PaperProps: {
                                                        sx: {
                                                            bgcolor: "#2a2a2a",
                                                            border: "1px solid #444",
                                                            "& .MuiMenuItem-root": {
                                                                color: "#fff",
                                                                "&:hover": {
                                                                    bgcolor: "#3a3a3a"
                                                                },
                                                                "&.Mui-selected": {
                                                                    bgcolor: "#FFD700",
                                                                    color: "#000",
                                                                    "&:hover": {
                                                                        bgcolor: "#FFC700"
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }}
                                        >
                                            {marcas.map((marca) => (
                                                <MenuItem key={marca} value={marca}>
                                                    {marca}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                        <TextField
                                            select
                                            label="Categoría"
                                            value={producto.categoria}
                                            onChange={e => {
                                                const nuevosProductos = [...productos];
                                                nuevosProductos[index].categoria = e.target.value;
                                                setProductos(nuevosProductos);
                                            }}
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
                                            SelectProps={{
                                                MenuProps: {
                                                    PaperProps: {
                                                        sx: {
                                                            bgcolor: "#2a2a2a",
                                                            border: "1px solid #444",
                                                            "& .MuiMenuItem-root": {
                                                                color: "#fff",
                                                                "&:hover": {
                                                                    bgcolor: "#3a3a3a"
                                                                },
                                                                "&.Mui-selected": {
                                                                    bgcolor: "#FFD700",
                                                                    color: "#000",
                                                                    "&:hover": {
                                                                        bgcolor: "#FFC700"
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }}
                                        >
                                            {categorias.map((categoria) => (
                                                <MenuItem key={categoria} value={categoria}>
                                                    {categoria}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </form>
                </DialogContent>
                
                <DialogActions sx={{ 
                    bgcolor: "#1a1a1a", 
                    p: 2, 
                    borderTop: "1px solid #333",
                    gap: 1
                }}>
                    <Button
                        onClick={onClose}
                        sx={{
                            color: "#ccc",
                            "&:hover": {
                                bgcolor: "rgba(204, 204, 204, 0.1)"
                            }
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={!proveedorNombre || !proveedorRut || productos.length === 0}
                        sx={{
                            bgcolor: "#FFD700",
                            color: "#000",
                            fontWeight: 700,
                            "&:hover": {
                                bgcolor: "#FFC700"
                            },
                            "&:disabled": {
                                bgcolor: "#666",
                                color: "#999"
                            }
                        }}
                    >
                        {tipo === "ingreso" ? "Registrar Ingreso" : "Registrar Salida"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
});