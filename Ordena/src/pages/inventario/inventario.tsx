import React, { useState, useEffect } from "react";
import Layout from "../../components/layout/layout";
import {
    Paper, Typography, Box, Button, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
    Card, CardContent, CardMedia, CardActionArea, Checkbox, FormControl, InputLabel, Select, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Alert
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SearchIcon from '@mui/icons-material/Search';
import WarningTwoToneIcon from '@mui/icons-material/WarningTwoTone';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import QrCodeIcon from '@mui/icons-material/QrCode';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import Tooltip from '@mui/material/Tooltip';
import sin_imagen from "../../assets/sin_imagen.png";
import { useInventariosStore } from "../../store/useProductoStore";
import { useAuthStore } from "../../store/useAuthStore";
import { BODEGA_CENTRAL } from "../../constants/ubicaciones";
import { useCallback } from "react";
import CloseIcon from '@mui/icons-material/Close';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { COLORS } from '../../constants/colors';
import { parseApiError } from '../../utils/errorUtils';

async function fetchImagenUnsplash(nombre: string): Promise<string> {
    const accessKey = "rz2WkwQyM7en1zvTElwVpAbqGaOroIHqoNCllxW1qlg";
    const keywords = `${nombre} tool hardware ferretería industrial`;
    const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keywords)}&client_id=${accessKey}`
    );
    const data = await response.json();
    return data.results?.[0]?.urls?.small || "";
}

export interface ProductInt {
    id_prodc?: number;
    name: string;
    code: string;
    brand: string;
    category: string;
    description: string;
    stock: number;
    stock_minimo: number;
    stock_maximo: number;
    im: File | string | null;
}

// Componente para indicadores de stock inteligentes
const StockIndicator = ({ stock, stockMinimo = 5 }: { stock: number; stockMinimo?: number }) => {
    const getStockColor = (stock: number, stockMinimo: number) => {
        if (stock === 0) return "#F44336"; // Rojo - Sin stock
        if (stock < stockMinimo) return "#FF9800";   // Naranja - Stock bajo
        if (stock < stockMinimo * 2) return "#FFC107";  // Amarillo - Stock medio
        return "#4CAF50";                  // Verde - Stock bueno
    };

    const getStockText = (stock: number, stockMinimo: number) => {
        if (stock === 0) return "Sin stock";
        if (stock < stockMinimo) return "Stock bajo";
        if (stock < stockMinimo * 2) return "Stock medio";
        return "Stock bueno";
    };

    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: getStockColor(stock, stockMinimo),
                animation: stock < stockMinimo ? "pulse 2s infinite" : "none",
                "@keyframes pulse": {
                    "0%": { opacity: 1 },
                    "50%": { opacity: 0.5 },
                    "100%": { opacity: 1 }
                }
            }} />
            <Typography sx={{ 
                color: getStockColor(stock, stockMinimo), 
                fontWeight: stock < stockMinimo ? 700 : 400,
                fontSize: "0.875rem"
            }}>
                {stock} {stock < stockMinimo && `(${getStockText(stock, stockMinimo)})`}
            </Typography>
        </Box>
    );
};

export default function Inventario() {
    const usuario = useAuthStore(state => state.usuario);

    const ubicacionId =
        usuario?.bodega
            ? "bodega_central"
            : usuario?.sucursalId || "";

    console.log("🔍 DEBUG - Inventario - usuario:", usuario);
    console.log("🔍 DEBUG - Inventario - ubicacionId:", ubicacionId);

    // Obtén todas las marcas/categorías y luego filtra por ubicacionId
    const allMarcas = useInventariosStore(state => state.marcas);
    const allCategorias = useInventariosStore(state => state.categorias);

    const marcas = allMarcas[ubicacionId] || [];
    const categorias = allCategorias[ubicacionId] || [];
    
    // Extraer solo los nombres para los selects - con validación de tipos
    const marcasNombres = Array.isArray(marcas) 
        ? marcas.map(m => typeof m === 'object' && m?.nombre ? m.nombre : '').filter(Boolean)
        : [];
    const categoriasNombres = Array.isArray(categorias)
        ? categorias.map(c => typeof c === 'object' && c?.nombre ? c.nombre : '').filter(Boolean)
        : [];

    // Estado principal - MOVIDO AQUÍ ANTES DEL useEffect
    const inventarios = useInventariosStore(state => state.inventarios);
    const productos = inventarios[ubicacionId] || [];
    
    console.log("🔍 DEBUG - Inventario - inventarios completos:", inventarios);
    console.log("🔍 DEBUG - Inventario - productos para ubicacionId:", productos);
    console.log("🔍 DEBUG - Inventario - cantidad de productos:", productos.length);

    // Funciones del store
    const addProducto = useCallback(
        (ubicacionId: string, producto: ProductInt) => useInventariosStore.getState().addProducto(ubicacionId, producto),
        []
    );

    const updateProducto = useCallback(
        (ubicacionId: string, producto: ProductInt) => useInventariosStore.getState().updateProducto(ubicacionId, producto),
        []
    );

    const desactivarProductos = useCallback(
        (ubicacionId: string, codes: string[]) => useInventariosStore.getState().desactivarProductos(ubicacionId, codes),
        []
    );

    const addMarca = useCallback(
        (marca: string) => useInventariosStore.getState().addMarca(ubicacionId, marca),
        [ubicacionId]
    );

    const deleteMarca = useCallback(
        (marcaId: number) => useInventariosStore.getState().deleteMarca(ubicacionId, marcaId),
        [ubicacionId]
    );

    const addCategoria = useCallback(
        (categoria: string) => useInventariosStore.getState().addCategoria(ubicacionId, categoria),
        [ubicacionId]
    );

    const deleteCategoria = useCallback(
        (categoriaId: number) => useInventariosStore.getState().deleteCategoria(ubicacionId, categoriaId),
        [ubicacionId]
    );

    // Agregar estas tres nuevas funciones
    const fetchProductos = useCallback(
        (ubicacionId: string) => useInventariosStore.getState().fetchProductos(ubicacionId),
        []
    );

    const fetchMarcas = useCallback(
        (ubicacionId: string) => useInventariosStore.getState().fetchMarcas(ubicacionId),
        []
    );

    const fetchCategorias = useCallback(
        (ubicacionId: string) => useInventariosStore.getState().fetchCategorias(ubicacionId),
        []
    );
    const [search, setSearch] = useState("");
    const [filtros, setFiltros] = useState<{ categoria?: string; marca?: string }>({});
    const [selected, setSelected] = useState<string[]>([]);
    const [deleteMode, setDeleteMode] = useState(false);

    // Modales
    const [modalAddOpen, setModalAddOpen] = useState(false);
    const [modalEditOpen, setModalEditOpen] = useState(false);
    const [modalDetailOpen, setModalDetailOpen] = useState(false);
    const [modalFiltroOpen, setModalFiltroOpen] = useState(false);
    const [modalGestionOpen, setModalGestionOpen] = useState(false);

    // Producto seleccionado para editar/ver
    const [productoActual, setProductoActual] = useState<ProductInt | null>(null);

    // Modo de vista (cards o tabla)
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

    // --- Ordenar productos por stock (mayor a menor) ---
    const productosOrdenados = [...productos].sort((a, b) => b.stock - a.stock);
    const filteredProducts = productosOrdenados.filter(product => {
        const matchProductName = product.name.toLowerCase().includes(search.toLowerCase());
        const matchCategoria = !filtros.categoria || product.category === filtros.categoria;
        const matchMarca = !filtros.marca || product.brand === filtros.marca;
        return matchProductName && matchCategoria && matchMarca;
    });

    // --- Mejorar función de filtro para alertas ---
    const [alertaFiltro, setAlertaFiltro] = useState<null | 'bajo' | 'alto'>(null);

  
    // Modal de error personalizado
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorModalMessage, setErrorModalMessage] = useState<string | string[]>(""); // <-- así
    

    // Handlers CRUD
    const handleAddProduct = async (p: ProductInt) => {
        try {
            await addProducto(ubicacionId, p);
            setModalAddOpen(false);
            showSnackbar('Producto agregado correctamente', 'success');
        } catch (error: any) {
            setModalAddOpen(false);
            const msg = parseApiError(error);
            setErrorModalMessage(msg as string);
            setShowErrorModal(true);
            showSnackbar(msg, 'error');
        }
    };

    const handleUpdateProduct = async (updatedProduct: ProductInt) => {
        try {
            if (updatedProduct.id_prodc) {
                await updateProducto(ubicacionId, updatedProduct);
                showSnackbar('Producto actualizado correctamente', 'success');
            }
            setModalEditOpen(false);
            setModalDetailOpen(false);
        } catch (error: any) {
            const msg = parseApiError(error);
            setErrorModalMessage(msg as string);
            setShowErrorModal(true);
            showSnackbar(msg, 'error');
        }
    };

    const handleDesactivarProductos = (codes: string[]) => {
        try {
            const productosADesactivar = productos.filter(p => codes.includes(p.code));
            const idsADesactivar = productosADesactivar.map(p => p.id_prodc).filter(Boolean);
            if (idsADesactivar.length > 0) {
                desactivarProductos(ubicacionId, idsADesactivar.map(id => id!.toString()));
                showSnackbar('Productos desactivados correctamente', 'success');
            }
            setSelected([]);
            setDeleteMode(false);
        } catch (error: any) {
            const msg = parseApiError(error);
            setErrorModalMessage(msg as string);
            setShowErrorModal(true);
            showSnackbar(msg, 'error');
        }
    };

    const handleQuickStockUpdate = async (updatedProduct: ProductInt) => {
        try {
            if (updatedProduct.id_prodc) {
                await updateProducto(ubicacionId, updatedProduct);
                showSnackbar('Stock actualizado correctamente', 'success');
                setModalDetailOpen(false);
            }
        } catch (error: any) {
            const msg = parseApiError(error);
            setErrorModalMessage(msg as string);
            setShowErrorModal(true);
            showSnackbar(msg, 'error');
        }
    };

    // --- Formularios ---

    // Formulario para agregar/editar producto
    function ProductForm({ initial, onSave, onCancel, marcas, categorias }: {
        initial?: ProductInt,
        onSave: (p: ProductInt) => void,
        onCancel: () => void,
        marcas: string[],
        categorias: string[],
    }) {
        const [form, setForm] = useState<ProductInt>(initial || {
            name: "",
            code: "",
            brand: "",
            category: "",
            description: "",
            stock: 0,
            stock_minimo: 5,
            stock_maximo: 100,
            im: null,
        });
        const [errors, setErrors] = useState<{ [key: string]: string }>({});
        const [imgPreview, setImgPreview] = useState<string>(
            typeof initial?.im === "string" && initial.im ? initial.im : sin_imagen
        );
        const [isLoadingImg, setIsLoadingImg] = useState(false);
        const [generalError, setGeneralError] = useState<string>("");

        // Buscar imagen sugerida de Unsplash cuando cambia el nombre y no hay imagen subida
        useEffect(() => {
            let ignore = false;
            if (!form.im && form.name.trim()) {
                setIsLoadingImg(true);
                fetchImagenUnsplash(form.name).then(url => {
                    if (!ignore) {
                        setImgPreview(url || sin_imagen);
                        setIsLoadingImg(false);
                    }
                });
            } else if (!form.im) {
                setImgPreview(sin_imagen);
            }
            return () => { ignore = true; };
        }, [form.name, form.im]);

        // Cuando el usuario sube una imagen, actualizar la previsualización
        const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                setForm(f => ({ ...f, im: file }));
                setImgPreview(URL.createObjectURL(file));
            }
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
            const { name, value } = e.target as HTMLInputElement;
            if (name === "stock" || name === "stock_minimo" || name === "stock_maximo") {
                setForm(f => ({ ...f, [name]: Number(value) }));
            } else {
                setForm(f => ({ ...f, [name]: value }));
            }
        };

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setGeneralError("");
            const newErrors: { [key: string]: string } = {};
            if (!form.name.trim()) newErrors.name = "Campo obligatorio";
            if (!form.code.trim()) newErrors.code = "Campo obligatorio";
            if (!form.brand.trim()) newErrors.brand = "Campo obligatorio";
            if (!form.category.trim()) newErrors.category = "Campo obligatorio";
            if (!form.description.trim()) newErrors.description = "Campo obligatorio";
            if (form.stock < 0) newErrors.stock = "Stock no puede ser negativo";
            if (form.stock_minimo < 0) newErrors.stock_minimo = "Stock mínimo no puede ser negativo";
            if (form.stock_minimo > form.stock) newErrors.stock_minimo = "Stock mínimo no puede ser mayor al stock inicial";
            if (form.stock_maximo < 0) newErrors.stock_maximo = "Stock máximo no puede ser negativo";
            if (form.stock_maximo < form.stock) newErrors.stock_maximo = "Stock máximo no puede ser menor al stock inicial";
            if (form.stock_maximo < form.stock_minimo) newErrors.stock_maximo = "Stock máximo no puede ser menor al stock mínimo";
            setErrors(newErrors);
            if (Object.keys(newErrors).length > 0) return;

            let imagenFinal = form.im;
            if (!imagenFinal) {
                const url = await fetchImagenUnsplash(form.name);
                imagenFinal = url || sin_imagen;
            }
            try {
                await onSave({ ...form, im: imagenFinal });
            } catch (apiErrors: any) {
                const backendErrors: { [key: string]: string } = {};
                let general = "";
                if (apiErrors.nombre_prodc) {
                    backendErrors.name = apiErrors.nombre_prodc[0];
                    general = apiErrors.nombre_prodc[0];
                }
                if (apiErrors.codigo_interno) {
                    backendErrors.code = apiErrors.codigo_interno[0];
                    general = apiErrors.codigo_interno[0];
                }
                setErrors(backendErrors);
                setGeneralError(general);
            }
        };

        return (
            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3
                }}
            >
                {generalError && (
                    <Box sx={{ mb: 1 }}>
                        <Alert severity="error" variant="filled">{generalError}</Alert>
                    </Box>
                )}
                {/* Previsualización de imagen */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 1 }}>
                    <Box sx={{ position: 'relative', width: 110, height: 110 }}>
                        <img
                            src={imgPreview}
                            alt="Previsualización"
                            style={{
                                width: 110,
                                height: 110,
                                objectFit: 'cover',
                                borderRadius: 8,
                                border: '2px solid #FFD700',
                                background: '#232323',
                                boxShadow: '0 2px 8px #0006',
                            }}
                        />
                        {isLoadingImg && (
                            <Box sx={{
                                position: 'absolute',
                                top: 0, left: 0, width: '100%', height: '100%',
                                bgcolor: 'rgba(0,0,0,0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#FFD700', fontWeight: 700, fontSize: 18,
                                borderRadius: 2
                            }}>
                                Buscando imagen...
                            </Box>
                        )}
                    </Box>
                    <Button
                        variant="contained"
                        component="label"
                        sx={{ bgcolor: '#FFD700', color: '#232323', fontWeight: 600 }}
                    >
                        Subir Imagen
                        <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleImageChange}
                        />
                    </Button>
                </Box>
                {/* Primera fila */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <TextField
                        label="Nombre del Producto"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    error={!!errors.name}
                    helperText={errors.name}
                        required
                        fullWidth
                        InputLabelProps={{ style: { color: "#E0E0E0" } }}
                    sx={{
                            '& .MuiOutlinedInput-root': {
                                color: "#FFFFFF",
                                '& fieldset': { borderColor: "#666666" },
                                '&:hover fieldset': { borderColor: "#888888" },
                                '&.Mui-focused fieldset': { borderColor: "#4CAF50" }
                            },
                            '& .MuiFormHelperText-root': { color: "#ff6b6b" }
                    }}
                />
                <TextField
                    label="Código Interno"
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    error={!!errors.code}
                    helperText={errors.code}
                        required
                        fullWidth
                    disabled={!!initial}
                        InputLabelProps={{ style: { color: "#E0E0E0" } }}
                    sx={{
                            '& .MuiOutlinedInput-root': {
                                color: "#FFFFFF",
                                '& fieldset': { borderColor: "#666666" },
                                '&:hover fieldset': { borderColor: "#888888" },
                                '&.Mui-focused fieldset': { borderColor: "#4CAF50" }
                            },
                            '& .MuiFormHelperText-root': { color: "#ff6b6b" }
                    }}
                />
                </Box>

                {/* Segunda fila */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <TextField
                    select
                    label="Marca"
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                    error={!!errors.brand}
                    helperText={errors.brand}
                        required
                        fullWidth
                        InputLabelProps={{ style: { color: "#E0E0E0" } }}
                    sx={{
                            '& .MuiOutlinedInput-root': {
                                color: "#FFFFFF",
                                '& fieldset': { borderColor: "#666666" },
                                '&:hover fieldset': { borderColor: "#888888" },
                                '&.Mui-focused fieldset': { borderColor: "#4CAF50" }
                            },
                            '& .MuiFormHelperText-root': { color: "#ff6b6b" },
                            '& .MuiSelect-icon': { color: "#E0E0E0" }
                        }}
                        SelectProps={{
                            MenuProps: {
                                PaperProps: {
                                    sx: {
                                        backgroundColor: '#2E2E2E',
                                        color: '#FFFFFF',
                                        '& .MuiMenuItem-root:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        },
                                        '& .Mui-selected': {
                                            backgroundColor: 'rgba(76, 175, 80, 0.2) !important',
                                        },
                                        '& .Mui-selected:hover': {
                                            backgroundColor: 'rgba(76, 175, 80, 0.3) !important',
                                        }
                                    },
                                },
                            },
                    }}
                >
                        <MenuItem value="" disabled sx={{ color: "#888888" }}>Selecciona una marca</MenuItem>
                        {marcas.map(m => <MenuItem key={m} value={m} sx={{ color: "#FFFFFF" }}>{m}</MenuItem>)}
                </TextField>
                <TextField
                    select
                    label="Categoría"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    error={!!errors.category}
                    helperText={errors.category}
                        required
                        fullWidth
                        InputLabelProps={{ style: { color: "#E0E0E0" } }}
                    sx={{
                            '& .MuiOutlinedInput-root': {
                                color: "#FFFFFF",
                                '& fieldset': { borderColor: "#666666" },
                                '&:hover fieldset': { borderColor: "#888888" },
                                '&.Mui-focused fieldset': { borderColor: "#4CAF50" }
                            },
                            '& .MuiFormHelperText-root': { color: "#ff6b6b" },
                            '& .MuiSelect-icon': { color: "#E0E0E0" }
                        }}
                        SelectProps={{
                            MenuProps: {
                                PaperProps: {
                                    sx: {
                                        backgroundColor: '#2E2E2E',
                                        color: '#FFFFFF',
                                        '& .MuiMenuItem-root:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        },
                                        '& .Mui-selected': {
                                            backgroundColor: 'rgba(76, 175, 80, 0.2) !important',
                                        },
                                        '& .Mui-selected:hover': {
                                            backgroundColor: 'rgba(76, 175, 80, 0.3) !important',
                                        }
                                    },
                                },
                            },
                    }}
                >
                        <MenuItem value="" disabled sx={{ color: "#888888" }}>Selecciona una categoría</MenuItem>
                        {categorias.map(c => <MenuItem key={c} value={c} sx={{ color: "#FFFFFF" }}>{c}</MenuItem>)}
                </TextField>
                </Box>

                {/* Stock */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
                    <TextField
                        label="Stock Inicial"
                        name="stock"
                        type="number"
                        value={form.stock}
                        onChange={handleChange}
                        error={!!errors.stock}
                        helperText={errors.stock}
                        required
                        fullWidth
                        InputLabelProps={{ style: { color: "#E0E0E0" } }}
                        inputProps={{ min: 0 }}
                        onFocus={(e) => e.target.select()}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                color: "#FFFFFF",
                                '& fieldset': { borderColor: "#666666" },
                                '&:hover fieldset': { borderColor: "#888888" },
                                '&.Mui-focused fieldset': { borderColor: "#4CAF50" }
                            },
                            '& .MuiFormHelperText-root': { color: "#ff6b6b" }
                        }}
                    />
                    <TextField
                        label="Stock Mínimo"
                        name="stock_minimo"
                        type="number"
                        value={form.stock_minimo}
                        onChange={handleChange}
                        error={!!errors.stock_minimo}
                        helperText={errors.stock_minimo || "Cantidad mínima antes de alertar"}
                        required
                        fullWidth
                        InputLabelProps={{ style: { color: "#E0E0E0" } }}
                        inputProps={{ min: 0 }}
                        onFocus={(e) => e.target.select()}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                color: "#FFFFFF",
                                '& fieldset': { borderColor: "#666666" },
                                '&:hover fieldset': { borderColor: "#888888" },
                                '&.Mui-focused fieldset': { borderColor: "#4CAF50" }
                            },
                            '& .MuiFormHelperText-root': { color: "#ff6b6b" }
                        }}
                    />
                    <TextField
                        label="Stock Máximo"
                        name="stock_maximo"
                        type="number"
                        value={form.stock_maximo}
                        onChange={handleChange}
                        error={!!errors.stock_maximo}
                        helperText={errors.stock_maximo || "Cantidad máxima antes de alertar"}
                        required
                        fullWidth
                        InputLabelProps={{ style: { color: "#E0E0E0" } }}
                        inputProps={{ min: 0 }}
                        onFocus={(e) => e.target.select()}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                color: "#FFFFFF",
                                '& fieldset': { borderColor: "#666666" },
                                '&:hover fieldset': { borderColor: "#888888" },
                                '&.Mui-focused fieldset': { borderColor: "#4CAF50" }
                            },
                            '& .MuiFormHelperText-root': { color: "#ff6b6b" }
                        }}
                    />
                </Box>

                {/* Descripción */}
                <TextField
                    label="Descripción"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    error={!!errors.description}
                    helperText={errors.description}
                    required
                    fullWidth
                    multiline
                    rows={4}
                    InputLabelProps={{ style: { color: "#E0E0E0" } }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            color: "#FFFFFF",
                            '& fieldset': { borderColor: "#666666" },
                            '&:hover fieldset': { borderColor: "#888888" },
                            '&.Mui-focused fieldset': { borderColor: "#4CAF50" }
                        },
                        '& .MuiFormHelperText-root': { color: "#ff6b6b" }
                    }}
                />

                {/* Botones */}
                <DialogActions sx={{ 
                    bgcolor: "#1a1a1a", 
                    borderTop: "1px solid #333",
                    p: 2,
                    mt: 2
                }}>
                    <Button 
                        onClick={onCancel}
                        sx={{ 
                            color: "#FFD700",
                            borderColor: "#FFD700",
                            borderWidth: 1.5,
                            fontWeight: 600,
                            '&:hover': { 
                                background: "#FFD70022", 
                                borderColor: "#FFD700" 
                            }
                        }}
                        variant="outlined"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        sx={{
                            background: "#FFD700",
                            color: "#181818",
                            fontWeight: 700,
                            '&:hover': { background: "#FFD700cc" }
                        }}
                    >
                        {initial ? "Guardar Cambios" : "Agregar Producto"}
                    </Button>
                </DialogActions>
            </Box>
        );
    }

    // Modal de detalles
    function ProductDetailsModal({ product, open, onClose, onEdit, onQuickStockUpdate }: {
        product: ProductInt | null,
        open: boolean,
        onClose: () => void,
        onEdit: () => void,
        onQuickStockUpdate: (p: ProductInt) => void | Promise<void>
    }) {
        const [editStock, setEditStock] = React.useState(false);
        const [newStock, setNewStock] = React.useState(product?.stock || 0);
        React.useEffect(() => {
            setNewStock(product?.stock || 0);
            setEditStock(false);
        }, [product]);
        if (!product) return null;
        return (
            <Dialog 
                open={open} 
                onClose={onClose} 
                maxWidth="md" 
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: "#1a1a1a",
                        borderRadius: 2,
                    }
                }}
            >
                <DialogTitle sx={{ 
                    background: "linear-gradient(135deg, #232323 0%, #1a1a1a 100%)",
                    color: "#FFD700",
                    borderBottom: "2px solid #FFD700",
                    fontWeight: 600,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        📄 Detalles del Producto
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: "#FFD700" }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ bgcolor: "#1a1a1a", color: "#fff", pt: '28px' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '220px 1fr' }, gap: 4 }}>
                        {/* Columna de la Imagen */}
                        <Box>
                            <CardMedia
                                component="img"
                                image={
                                    typeof product.im === "string"
                                        ? product.im
                                        : product.im
                                            ? URL.createObjectURL(product.im)
                                            : sin_imagen
                                }
                                alt={product.name}
                                sx={{ 
                                    borderRadius: "8px", 
                                    width: '100%',
                                    height: 'auto',
                                    maxHeight: 220,
                                    objectFit: "cover",
                                    border: '1px solid #333',
                                    boxShadow: 3
                                }}
                            />
                        </Box>
                        {/* Columna de Detalles */}
                        <Box>
                            <Typography variant="h4" sx={{ color: "#FFD700", fontWeight: 700, mb: 1, letterSpacing: 1 }}>
                                {product.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                                <Chip label={product.code} sx={{ bgcolor: '#232323', color: '#FFD700', fontWeight: 700, fontSize: 16, px: 2 }} />
                                <Chip label={product.brand} sx={{ bgcolor: '#FFD700', color: '#232323', fontWeight: 700, fontSize: 16, px: 2 }} />
                                <Chip label={product.category} sx={{ bgcolor: '#FFD700', color: '#232323', fontWeight: 700, fontSize: 16, px: 2 }} />
                            </Box>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" sx={{ color: "#E0E0E0", fontWeight: 500, mb: 1 }}>
                                    Stock actual
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Chip 
                                        label={product.stock + (product.stock === 1 ? ' unidad' : ' unidades')}
                                        sx={{ 
                                            bgcolor: product.stock === 0 ? '#F44336' : product.stock < product.stock_minimo ? '#FF9800' : product.stock > product.stock_maximo ? '#4caf50' : '#232323',
                                            color: product.stock === 0 ? '#fff' : '#FFD700',
                                            fontWeight: 700, fontSize: 22, px: 3, py: 2, height: 48, fontFamily: 'monospace', letterSpacing: 1.5
                                        }}
                                    />
                                    {!editStock ? (
                                        <Button size="small" variant="outlined" sx={{ color: '#FFD700', borderColor: '#FFD700', fontWeight: 700 }} onClick={() => setEditStock(true)}>
                                            Editar stock
                                        </Button>
                                    ) : (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <TextField
                                                type="number"
                                                value={newStock}
                                                onChange={e => setNewStock(Number(e.target.value))}
                                                size="small"
                                                sx={{ width: 90, bgcolor: '#232323', input: { color: '#FFD700', fontWeight: 700, fontSize: 20, textAlign: 'center' } }}
                                                inputProps={{ min: 0 }}
                                            />
                                            <Button size="small" variant="contained" sx={{ bgcolor: '#FFD700', color: '#232323', fontWeight: 700 }}
                                                onClick={async () => {
                                                    await onQuickStockUpdate({ ...product, stock: newStock });
                                                    setEditStock(false);
                                                }}>
                                                Guardar
                                            </Button>
                                            <Button size="small" variant="outlined" sx={{ color: '#FFD700', borderColor: '#FFD700', fontWeight: 700 }} onClick={() => { setEditStock(false); setNewStock(product.stock); }}>
                                                Cancelar
                                            </Button>
                                        </Box>
                                    )}
                                </Box>
                                <Typography variant="caption" sx={{ color: '#888', display: 'block', mt: 1 }}>
                                    Mínimo: {product.stock_minimo} | Máximo: {product.stock_maximo}
                                </Typography>
                            </Box>
                            <Typography variant="subtitle1" sx={{ color: "#E0E0E0", fontWeight: 500, borderBottom: '1px solid #333', pb: 1, mb: 2 }}>
                                Descripción
                            </Typography>
                            <Typography sx={{ color: "#BDBDBD", lineHeight: 1.6 }}>
                                {product.description}
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ 
                    bgcolor: "#1a1a1a", 
                    borderTop: "1px solid #333",
                    p: 2 
                }}>
                    <Button 
                        onClick={onClose}
                        variant="outlined"
                        sx={{ 
                            color: "#FFD700",
                            borderColor: "#FFD700",
                            borderWidth: 1.5,
                            fontWeight: 600,
                            '&:hover': { background: "#FFD70022", borderColor: "#FFD700" }
                        }}
                    >
                        Cerrar
                    </Button>
                    <Button 
                        onClick={() => onEdit(product)} 
                        startIcon={<EditIcon />} 
                        variant="contained" 
                        sx={{
                            background: "#4CAF50",
                            color: "#fff",
                            fontWeight: 700,
                            '&:hover': { background: "#45a049" }
                        }}
                    >
                        Editar
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    // Componente auxiliar para mostrar detalles
    function DetailItem({ label, value, isHighlight = false }: { label: string, value: string, isHighlight?: boolean }) {
        return (
            <Box>
                <Typography variant="overline" sx={{ color: "#888", display: 'block', lineHeight: 1 }}>
                    {label}
                </Typography>
                <Typography sx={{ 
                    color: isHighlight ? "#4CAF50" : "#FFFFFF", 
                    fontWeight: isHighlight ? 700 : 400,
                    fontSize: isHighlight ? '1.2rem' : '1rem'
                }}>
                    {value}
                </Typography>
            </Box>
        );
    }

    // Modal de filtro
    function FiltroModal({ open, onClose, onFiltrar, marcas, categorias }: { open: boolean, onClose: () => void, onFiltrar: (f: any) => void, marcas: string[], categorias: string[] }) {
        const [categoria, setCategoria] = useState("");
        const [marca, setMarca] = useState("");
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Filtrar productos</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>Categoría</InputLabel>
                            <Select
                                value={categoria}
                                label="Categoría"
                                onChange={e => setCategoria(e.target.value)}
                            >
                                <MenuItem value="">Todas</MenuItem>
                                {categorias.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Marca</InputLabel>
                            <Select
                                value={marca}
                                label="Marca"
                                onChange={e => setMarca(e.target.value)}
                            >
                                <MenuItem value="">Todas</MenuItem>
                                {marcas.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button
                        onClick={() => {
                            onFiltrar({ categoria, marca });
                            onClose();
                        }}
                        variant="contained"
                        sx={{ bgcolor: "#FFD700", color: "#232323", fontWeight: 600 }}
                    >
                        Aplicar
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    // Modal para gestionar marcas y categorías
    function GestionarModal({ open, onClose }: { open: boolean, onClose: () => void }) {
        const [nuevaMarca, setNuevaMarca] = useState("");
        const [nuevaCategoria, setNuevaCategoria] = useState("");
        const [buscaMarca, setBuscaMarca] = useState("");
        const [buscaCategoria, setBuscaCategoria] = useState("");

        // Filtrado local para mostrar solo lo buscado - con validación de tipos
        const marcasFiltradas = Array.isArray(marcas) 
            ? marcas
                .filter(m => m && typeof m === 'object' && m.nombre)
                .filter(m => m.nombre.toLowerCase().includes(buscaMarca.toLowerCase()))
            : [];
        const categoriasFiltradas = Array.isArray(categorias)
            ? categorias
                .filter(c => c && typeof c === 'object' && c.nombre)
                .filter(c => c.nombre.toLowerCase().includes(buscaCategoria.toLowerCase()))
            : [];

        const handleDeleteMarca = (marca: string) => {
            const marcaObj = marcas.find(m => typeof m === 'object' && m?.nombre === marca);
            if (marcaObj && typeof marcaObj === 'object' && marcaObj.id) {
                deleteMarca(marcaObj.id);
            }
        };
        const handleDeleteCategoria = (cat: string) => {
            const categoriaObj = categorias.find(c => typeof c === 'object' && c?.nombre === cat);
            if (categoriaObj && typeof categoriaObj === 'object' && categoriaObj.id) {
                deleteCategoria(categoriaObj.id);
            }
        };

        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Gestionar Marcas y Categorías</DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>Marcas actuales:</Typography>
                        <TextField
                            placeholder="Buscar marca..."
                            value={buscaMarca}
                            onChange={e => setBuscaMarca(e.target.value)}
                            size="small"
                            sx={{ mb: 1, width: "100%" }}
                        />
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                            {marcasFiltradas.map(m => (
                                <Box
                                    key={m.nombre}
                                    sx={{
                                        bgcolor: "#FFD700",
                                        color: "#232323",
                                        px: 2,
                                        py: 0.5,
                                        borderRadius: 2,
                                        fontWeight: 600,
                                        display: "flex",
                                        alignItems: "center",
                                        position: "relative",
                                        "&:hover .delete-icon": { opacity: 1 }
                                    }}
                                >
                                    {m.nombre}
                                    <Tooltip title="Desactivar marca">
                                        <IconButton
                                            size="small"
                                            className="delete-icon"
                                            sx={{
                                                ml: 1,
                                                opacity: 0,
                                                transition: "opacity 0.2s",
                                                "&:hover": { color: "#ff4444" }
                                            }}
                                            onClick={() => handleDeleteMarca(m.nombre)}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            ))}
                        </Box>
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <TextField
                                label="Nueva marca"
                                value={nuevaMarca}
                                onChange={e => setNuevaMarca(e.target.value)}
                                size="small"
                            />
                            <Button
                              onClick={() => {
                                  if (nuevaMarca && !marcas.some(m => typeof m === 'object' && m?.nombre === nuevaMarca)) {
                                      addMarca(nuevaMarca);
                                      setNuevaMarca("");
                                  }
                              }}
                              variant="contained"
                              size="small"
                          >
                              Agregar
                          </Button>
                        </Box>
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>Categorías actuales:</Typography>
                        <TextField
                            placeholder="Buscar categoría..."
                            value={buscaCategoria}
                            onChange={e => setBuscaCategoria(e.target.value)}
                            size="small"
                            sx={{ mb: 1, width: "100%" }}
                        />
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                            {categoriasFiltradas.map(c => (
                                <Box
                                    key={c.nombre}
                                    sx={{
                                        bgcolor: "#FFD700",
                                        color: "#232323",
                                        px: 2,
                                        py: 0.5,
                                        borderRadius: 2,
                                        fontWeight: 600,
                                        display: "flex",
                                        alignItems: "center",
                                        position: "relative",
                                        "&:hover .delete-icon": { opacity: 1 }
                                    }}
                                >
                                    {c.nombre}
                                    <Tooltip title="Desactivar categoría">
                                        <IconButton
                                            onClick={() => handleDeleteCategoria(c.nombre)}
                                            sx={{ color: "#ff4444" }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            ))}
                        </Box>
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <TextField
                                label="Nueva categoría"
                                value={nuevaCategoria}
                                onChange={e => setNuevaCategoria(e.target.value)}
                                size="small"
                            />
                            <Button
                              onClick={() => {
                                  if (nuevaCategoria && !categorias.some(c => typeof c === 'object' && c?.nombre === nuevaCategoria)) {
                                      addCategoria(nuevaCategoria);
                                      setNuevaCategoria("");
                                  }
                              }}
                              variant="contained"
                              size="small"
                          >
                              Agregar
                          </Button>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        );
    }

    // --- Componentes de UI ---

    // Componente para filtros avanzados con chips
    const AdvancedFilters = () => {
        const hasActiveFilters = filtros.categoria || filtros.marca || search;
        
        if (!hasActiveFilters) return null;

        return (
            <Box sx={{ mb: 3, p: 2, bgcolor: "#1a1a1a", borderRadius: 2, border: "1px solid #333" }}>
                <Typography variant="h6" sx={{ color: "#FFD700", mb: 2, fontSize: "1rem" }}>
                    Filtros Activos
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {filtros.categoria && (
                        <Chip 
                            label={`Categoría: ${filtros.categoria}`}
                            onDelete={() => setFiltros(prev => ({ ...prev, categoria: undefined }))}
                            sx={{ 
                                bgcolor: "#FFD700", 
                                color: "#232323",
                                "& .MuiChip-deleteIcon": { color: "#232323" }
                            }}
                        />
                    )}
                    {filtros.marca && (
                        <Chip 
                            label={`Marca: ${filtros.marca}`}
                            onDelete={() => setFiltros(prev => ({ ...prev, marca: undefined }))}
                            sx={{ 
                                bgcolor: "#FFD700", 
                                color: "#232323",
                                "& .MuiChip-deleteIcon": { color: "#232323" }
                            }}
                        />
                    )}
                    {search && (
                        <Chip 
                            label={`Búsqueda: "${search}"`}
                            onDelete={() => setSearch("")}
                            sx={{ 
                                bgcolor: "#FFD700", 
                                color: "#232323",
                                "& .MuiChip-deleteIcon": { color: "#232323" }
                            }}
                        />
                    )}
                </Box>
            </Box>
        );
    };

    // Componente para vista de tabla
    const TableView = () => (
        <Box sx={{ overflowX: "auto" }}>
            <TableContainer component={Paper} sx={{ bgcolor: "#1E1E1E", borderRadius: 2, minWidth: 800 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: "#232323" }}>
                            <TableCell sx={{ color: "#FFD700", fontWeight: 700, borderBottom: "2px solid #FFD700", width: 80 }}>
                                Imagen
                            </TableCell>
                            <TableCell sx={{ color: "#FFD700", fontWeight: 700, borderBottom: "2px solid #FFD700", minWidth: 200 }}>
                                Producto
                            </TableCell>
                            <TableCell sx={{ color: "#FFD700", fontWeight: 700, borderBottom: "2px solid #FFD700", width: 120 }}>
                                Código
                            </TableCell>
                            <TableCell sx={{ color: "#FFD700", fontWeight: 700, borderBottom: "2px solid #FFD700", width: 120 }}>
                                Marca
                            </TableCell>
                            <TableCell sx={{ color: "#FFD700", fontWeight: 700, borderBottom: "2px solid #FFD700", width: 120 }}>
                                Categoría
                            </TableCell>
                            <TableCell sx={{ color: "#FFD700", fontWeight: 700, borderBottom: "2px solid #FFD700", width: 100 }}>
                                Stock
                            </TableCell>
                            <TableCell sx={{ color: "#FFD700", fontWeight: 700, borderBottom: "2px solid #FFD700", width: 100 }}>
                                Mínimo
                            </TableCell>
                            <TableCell sx={{ color: "#FFD700", fontWeight: 700, borderBottom: "2px solid #FFD700", width: 100 }}>
                                Máximo
                            </TableCell>
                            <TableCell sx={{ color: "#FFD700", fontWeight: 700, borderBottom: "2px solid #FFD700", width: 120 }}>
                                Acciones
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredProducts.map((product, index) => (
                            <TableRow 
                                key={product.code + index}
                                sx={{ 
                                    backgroundColor: product.stock === 0 ? '#4a1a1a' : product.stock < product.stock_minimo ? '#4a3a1a' : product.stock > product.stock_maximo ? '#1a4a1a' : 'inherit',
                                    '&:hover': { backgroundColor: '#333' },
                                    cursor: deleteMode ? "pointer" : "default",
                                    bgcolor: selected.includes(product.code) ? "#333" : "transparent"
                                }}
                                onClick={() => {
                                    if (deleteMode) {
                                        setSelected(prev =>
                                            prev.includes(product.code)
                                                ? prev.filter(code => code !== product.code)
                                                : [...prev, product.code]
                                        );
                                    } else {
                                        setProductoActual(product);
                                        setModalDetailOpen(true);
                                    }
                                }}
                            >
                                <TableCell>
                                    <img 
                                        src={
                                            typeof product.im === "string"
                                                ? product.im
                                                : product.im
                                                    ? URL.createObjectURL(product.im)
                                                    : sin_imagen
                                        } 
                                        alt={product.name}
                                        style={{ 
                                            width: 50, 
                                            height: 50, 
                                            borderRadius: 8,
                                            objectFit: "cover",
                                            border: "2px solid #444"
                                        }} 
                                    />
                                </TableCell>
                                <TableCell sx={{ color: "#fff", fontWeight: 500 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                        {product.name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: "#aaa" }}>
                                        {product.description}
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ color: "#ccc", fontFamily: "monospace", fontSize: "0.875rem" }}>
                                    {product.code}
                                </TableCell>
                                <TableCell sx={{ color: "#fff" }}>
                                    {product.brand}
                                </TableCell>
                                <TableCell sx={{ color: "#fff" }}>
                                    {product.category}
                                </TableCell>
                                <TableCell>
                                    <Tooltip title={
                                        product.stock === 0 ? 'Sin stock' :
                                        product.stock < product.stock_minimo ? 'Stock bajo' :
                                        product.stock > product.stock_maximo ? 'Sobre stock máximo' : 'Stock adecuado'
                                    }>
                                        <span>{product.stock}</span>
                                    </Tooltip>
                                </TableCell>
                                <TableCell>
                                    <Typography sx={{ color: "#FFD700", fontWeight: 600 }}>
                                        {product.stock_minimo}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography sx={{ color: "#FFD700", fontWeight: 600 }}>
                                        {product.stock_maximo}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: "flex", gap: 1 }}>
                                        <Tooltip title="Ver detalles">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setProductoActual(product);
                                                    setModalDetailOpen(true);
                                                }}
                                                sx={{ color: "#FFD700" }}
                                            >
                                                <SearchIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Editar">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setProductoActual(product);
                                                    setModalEditOpen(true);
                                                }}
                                                sx={{ color: "#4CAF50" }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        {deleteMode && (
                                            <Checkbox
                                                checked={selected.includes(product.code)}
                                                sx={{
                                                    color: "#FFD700",
                                                    '&.Mui-checked': {
                                                        color: "#FFD700",
                                                    },
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        )}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );

    // Componente para alertas de stock bajo
    const StockAlerts = () => {
        const lowStockProducts = productos.filter(p => p.stock < p.stock_minimo);
        const outOfStockProducts = productos.filter(p => p.stock === 0);
        
        if (lowStockProducts.length === 0) return null;

        return (
            <Box
                sx={{
                    p: 2,
                    bgcolor: outOfStockProducts.length > 0 ? "#4a1a1a" : "#4a3a1a",
                    borderRadius: 2,
                    border: `1px solid ${outOfStockProducts.length > 0 ? "#f44336" : "#ff9800"}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    '&:hover': {
                        bgcolor: outOfStockProducts.length > 0 ? '#6e2323' : '#6e4a23',
                        boxShadow: 3,
                    },
                }}
                onClick={() => setAlertaFiltro('bajo')}
            >
                <WarningTwoToneIcon sx={{ color: outOfStockProducts.length > 0 ? "#f44336" : "#ff9800", fontSize: 28 }} />
                <Box>
                    <Typography variant="body1" sx={{ color: outOfStockProducts.length > 0 ? "#f44336" : "#ff9800", fontWeight: 600 }}>
                        {outOfStockProducts.length > 0 
                            ? `${outOfStockProducts.length} productos sin stock`
                            : `${lowStockProducts.length} productos bajo stock mínimo`
                        }
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#ccc", mt: 0.5 }}>
                        {outOfStockProducts.length > 0 
                            ? "Algunos productos están completamente agotados"
                            : "Productos con stock menor al mínimo establecido"
                        }
                    </Typography>
                </Box>
            </Box>
        );
    };

    // Componente para alertas de stock alto
    const HighStockAlerts = () => {
        const highStockProducts = productos.filter(p => p.stock > p.stock_maximo);
        
        if (highStockProducts.length === 0) return null;

        return (
            <Box
                sx={{
                    p: 2,
                    bgcolor: "#1a4a1a",
                    borderRadius: 2,
                    border: `1px solid #4caf50`,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    '&:hover': {
                        bgcolor: '#236e23',
                        boxShadow: 3,
                    },
                }}
                onClick={() => setAlertaFiltro('alto')}
            >
                <WarningTwoToneIcon sx={{ color: "#4caf50", fontSize: 28 }} />
                <Box>
                    <Typography variant="body1" sx={{ color: "#4caf50", fontWeight: 600 }}>
                        {highStockProducts.length} productos superan el stock máximo
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#ccc", mt: 0.5 }}>
                        Productos con stock mayor al máximo recomendado
                    </Typography>
                </Box>
            </Box>
        );
    };

    // --- Render principal ---
    useEffect(() => {
        console.log("🔍 DEBUG - Inventario - useEffect ejecutado");
        console.log("🔍 DEBUG - Inventario - ubicacionId en useEffect:", ubicacionId);
        if (ubicacionId) {
            console.log("🔍 DEBUG - Inventario - Llamando a fetchProductos con:", ubicacionId);
            fetchProductos(ubicacionId);
        }
    }, [ubicacionId, fetchProductos]);

    // --- Mejorar función de filtro para alertas ---
    const productosParaMostrar = alertaFiltro === 'bajo'
        ? productosOrdenados.filter(p => p.stock < p.stock_minimo)
        : alertaFiltro === 'alto'
            ? productosOrdenados.filter(p => p.stock > p.stock_maximo)
            : filteredProducts;

    // PAGINACIÓN
    const [page, setPage] = useState(1);
    const itemsPerPage = 20;
    const totalPages = Math.ceil(productosParaMostrar.length / itemsPerPage);
    const paginatedProducts = productosParaMostrar.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    // FEEDBACK VISUAL
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

    return (
        <Layout>
            <Box sx={{ maxWidth: 1200, margin: "0 auto", padding: 3 }}>
                <Paper elevation={3} sx={{ padding: 4, background: "#232323" }}>
                    <Typography variant="h4" sx={{ color: "#FFD700", mb: 2, fontWeight: 700 }}>
                        Inventario de Productos
                    </Typography>
                    {/* Barra de acciones */}
                    <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center" }}>
                        <Button
                            startIcon={<AddIcon />}
                            variant="contained"
                            sx={{ bgcolor: "#FFD700", color: "#232323", fontWeight: 600 }}
                            onClick={() => setModalAddOpen(true)}
                        >
                            Añadir
                        </Button>
                        <Button
                            startIcon={<DeleteIcon />}
                            variant="contained"
                            sx={{ bgcolor: "#ff1b00", color: "#fff", fontWeight: 600 }}
                            onClick={() => setDeleteMode(!deleteMode)}
                        >
                            Desactivar
                        </Button>
                        <Button
                            startIcon={<FilterAltIcon />}
                            variant="contained"
                            sx={{ bgcolor: "#FFD700", color: "#232323", fontWeight: 600 }}
                            onClick={() => setModalFiltroOpen(true)}
                        >
                            Filtro
                        </Button>
                        <Button
                            variant="contained"
                            sx={{ bgcolor: "#FFD700", color: "#232323", fontWeight: 600 }}
                            onClick={() => setModalGestionOpen(true)}
                        >
                            Gestionar marcas/categorías
                        </Button>
                        <Box sx={{ flex: 1 }} />
                        {/* Toggle de vista */}
                        <Box sx={{ display: "flex", alignItems: "center", bgcolor: "#1a1a1a", borderRadius: 2, p: 0.5 }}>
                            <Tooltip title="Vista de tarjetas">
                                <IconButton
                                    onClick={() => setViewMode('cards')}
                                    sx={{ 
                                        bgcolor: viewMode === 'cards' ? "#FFD700" : "transparent",
                                        color: viewMode === 'cards' ? "#232323" : "#FFD700",
                                        "&:hover": { bgcolor: viewMode === 'cards' ? "#FFD700" : "#333" }
                                    }}
                                >
                                    <ViewModuleIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Vista de tabla">
                                <IconButton
                                    onClick={() => setViewMode('table')}
                                    sx={{ 
                                        bgcolor: viewMode === 'table' ? "#FFD700" : "transparent",
                                        color: viewMode === 'table' ? "#232323" : "#FFD700",
                                        "&:hover": { bgcolor: viewMode === 'table' ? "#FFD700" : "#333" }
                                    }}
                                >
                                    <ViewListIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", bgcolor: "#fff", borderRadius: 2, px: 2 }}>
                            <SearchIcon sx={{ color: "#232323" }} />
                            <TextField
                                placeholder="Buscar..."
                                variant="standard"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                InputProps={{
                                    disableUnderline: true,
                                    style: { fontSize: 18, marginLeft: 8 }
                                }}
                                sx={{ width: 200, ml: 1 }}
                            />
                        </Box>
                    </Box>
                    
                    {/* Alertas de stock bajo */}
                    <StockAlerts />
                    
                    {/* Alertas de stock alto */}
                    <HighStockAlerts />
                    
                    {/* Filtros avanzados */}
                    <AdvancedFilters />
                    
                    {/* Información de productos */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: "#ccc" }}>
                            Mostrando {productosParaMostrar.length} de {productos.length} productos
                        </Typography>
                        {alertaFiltro && (
                            <Button
                                size="small"
                                variant="outlined"
                                sx={{ borderColor: '#888', color: '#888', ml: 2 }}
                                onClick={() => setAlertaFiltro(null)}
                            >
                                Limpiar filtro
                            </Button>
                        )}
                    </Box>
                    
                    {/* Lista de productos */}
                    <Box sx={{ mt: 2 }}>
                        {productos.length === 0 ? (
                            <Box sx={{ width: "100%", textAlign: "center", color: "#aaa", fontSize: "1.9rem", mt: 10 }}>
                                <WarningTwoToneIcon sx={{ fontSize: "90px" }} />
                                <p>No existen registros previos, empieza a agregarlos en "+ Añadir".</p>
                            </Box>
                        ) : productosParaMostrar.length === 0 ? (
                            <Box sx={{ width: "100%", textAlign: "center", color: "#aaa", fontSize: "1.9rem", mt: 10 }}>
                                <WarningTwoToneIcon sx={{ fontSize: "90px" }} />
                                <p>No se encontraron productos con los filtros aplicados.</p>
                                <Button 
                                    variant="outlined" 
                                    sx={{ mt: 2, color: "#FFD700", borderColor: "#FFD700" }}
                                    onClick={() => {
                                        setFiltros({});
                                        setSearch("");
                                    }}
                                >
                                    Limpiar filtros
                                </Button>
                            </Box>
                        ) : (
                            viewMode === 'cards' ? (
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "center" }}>
                                    {paginatedProducts.map((product, idx) => (
                                        <Card
                                            key={product.code + idx}
                                            sx={{
                                                width: 200,
                                                bgcolor: "#232323",
                                                color: "#fff",
                                                cursor: deleteMode ? "pointer" : "default",
                                                border: selected.includes(product.code) ? "2px solid #FFD700" : "1px solid #333",
                                                transition: "all 0.2s",
                                                "&:hover": {
                                                    transform: "translateY(-2px)",
                                                    boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
                                                },
                                            }}
                                            onClick={() => {
                                                if (deleteMode) {
                                                    setSelected(prev =>
                                                        prev.includes(product.code)
                                                            ? prev.filter(code => code !== product.code)
                                                            : [...prev, product.code]
                                                    );
                                                } else {
                                                    setProductoActual(product);
                                                    setModalDetailOpen(true);
                                                }
                                            }}
                                        >
                                            {deleteMode && (
                                                <Checkbox
                                                    checked={selected.includes(product.code)}
                                                    sx={{
                                                        position: "absolute",
                                                        top: 8,
                                                        left: 8,
                                                        color: "#FFD700",
                                                        '&.Mui-checked': {
                                                            color: "#FFD700",
                                                        },
                                                    }}
                                                />
                                            )}
                                            <CardActionArea>
                                                <CardMedia
                                                    component="img"
                                                    image={
                                                        typeof product.im === "string"
                                                            ? product.im
                                                            : product.im
                                                                ? URL.createObjectURL(product.im)
                                                                : sin_imagen
                                                    }
                                                    alt={product.name}
                                                    sx={{ borderRadius: "6px", height: 120, objectFit: "cover" }}
                                                />
                                                <CardContent sx={{ alignContent: "center", padding: "0px" }}>
                                                    <Typography gutterBottom variant="h6" component="div"
                                                        sx={{ fontSize: "18px", color: "white", fontWeight: "bold" }}>
                                                        {product.name}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: "#a1a2a4" }}>
                                                        {product.brand} | {product.category}
                                                    </Typography>
                                                    <Box sx={{ mt: 1 }}>
                                                        <StockIndicator stock={product.stock} stockMinimo={product.stock_minimo} />
                                                    </Box>
                                                    <Typography variant="caption" sx={{ color: "#888", display: "block", mt: 0.5 }}>
                                                        Mínimo: {product.stock_minimo}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: "#888", display: "block", mt: 0.5 }}>
                                                        Máximo: {product.stock_maximo}
                                                    </Typography>
                                                </CardContent>
                                            </CardActionArea>
                                        </Card>
                                    ))}
                                </Box>
                            ) : (
                                <TableView />
                            )
                        )}
                    </Box>
                    {/* Controles de paginación */}
                    {totalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 2 }}>
                            <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} variant="outlined">Anterior</Button>
                            <Typography sx={{ color: COLORS.DORADO, fontWeight: 600 }}>Página {page} de {totalPages}</Typography>
                            <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} variant="outlined">Siguiente</Button>
                        </Box>
                    )}
                    {/* Botón desactivar seleccionados */}
                    {deleteMode && selected.length > 0 && (
                        <Button
                            variant="contained"
                            sx={{
                                position: "fixed",
                                bottom: 40,
                                right: 40,
                                bgcolor: "#ff1700",
                                color: "white",
                                padding: "12px 24px",
                                borderRadius: "8px",
                                fontWeight: "bold",
                                zIndex: 300,
                                border: "none",
                                cursor: "pointer"
                            }}
                            onClick={() => handleDesactivarProductos(selected)}
                        >
                            Desactivar seleccionados
                        </Button>
                    )}
                </Paper>
            </Box>
            {/* Modales */}
            <Dialog 
                open={modalAddOpen} 
                onClose={() => setModalAddOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: "#1a1a1a",
                        borderRadius: 2,
                    }
                }}
            >
                <DialogTitle sx={{ 
                    background: "linear-gradient(135deg, #232323 0%, #1a1a1a 100%)",
                    color: "#FFD700",
                    borderBottom: "2px solid #FFD700",
                    fontWeight: 600
                }}>
                    ➕ Añadir Producto
                </DialogTitle>
                <DialogContent sx={{ bgcolor: "#1a1a1a", color: "#fff", pt: '28px' }}>
                <ProductForm
                    onSave={handleAddProduct}
                    onCancel={() => setModalAddOpen(false)}
                    marcas={marcasNombres}
                    categorias={categoriasNombres}
                />
                </DialogContent>
            </Dialog>
            
            <Dialog 
                open={modalEditOpen} 
                onClose={() => setModalEditOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: "#181818",
                        borderRadius: 3,
                        boxShadow: 24,
                    }
                }}
            >
                <DialogTitle sx={{ 
                    background: "linear-gradient(135deg, #232323 0%, #1a1a1a 100%)",
                    color: "#FFD700",
                    borderBottom: "2px solid #FFD700",
                    fontWeight: 700,
                    fontSize: 26,
                    display: "flex",
                    alignItems: "center",
                    gap: 2
                }}>
                    <EditIcon sx={{ color: "#FFD700", fontSize: 32, mr: 1 }} />
                    Editar Producto
                </DialogTitle>
                <DialogContent sx={{ bgcolor: "#181818", color: "#fff", pt: '28px' }}>
                    <ProductForm
                        initial={productoActual!}
                        onSave={handleUpdateProduct}
                        onCancel={() => setModalEditOpen(false)}
                        marcas={marcasNombres}
                        categorias={categoriasNombres}
                    />
                </DialogContent>
            </Dialog>
            <ProductDetailsModal
                product={productoActual}
                open={modalDetailOpen}
                onClose={() => setModalDetailOpen(false)}
                onEdit={() => {
                    setModalDetailOpen(false);
                    setModalEditOpen(true);
                }}
                onQuickStockUpdate={handleQuickStockUpdate}
            />
            <FiltroModal
                open={modalFiltroOpen}
                onClose={() => setModalFiltroOpen(false)}
                onFiltrar={setFiltros}
                marcas={marcasNombres}
                categorias={categoriasNombres}
            />
            <GestionarModal
                open={modalGestionOpen}
                onClose={() => setModalGestionOpen(false)}
            />
            {/* Modal de error personalizado */}
            <Dialog
                open={showErrorModal}
                onClose={() => setShowErrorModal(false)}
                maxWidth="xs"
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        bgcolor: '#fff',
                        boxShadow: 24,
                        p: 2,
                        minWidth: 320,
                        maxWidth: 360,
                        textAlign: 'center',
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                    <ErrorOutlineIcon sx={{ fontSize: 60, color: '#B71C1C', mb: 1 }} />
                    <span style={{ color: '#B71C1C', fontWeight: 700, fontSize: 22 }}>¡Error al crear producto!</span>
                </DialogTitle>
                <DialogContent sx={{ color: '#B71C1C', fontWeight: 500, fontSize: 18, pb: 0 }}>
                    {Array.isArray(errorModalMessage)
                        ? (
                            <ul style={{ paddingLeft: 20, textAlign: 'left' }}>
                                {errorModalMessage.map((m, i) => <li key={i}>{m}</li>)}
                            </ul>
                        )
                        : errorModalMessage}
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button onClick={() => setShowErrorModal(false)} variant="contained" sx={{ bgcolor: '#B71C1C', color: '#fff', fontWeight: 700, borderRadius: 2, px: 4 }}>
                        Cerrar
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                message={snackbar.message}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
        </Layout>
    );
}

// Asegúrate de pasar props marcas y categorias a ProductForm y FiltroModal
// y que estos usen solo selects con los arrays recibidos.