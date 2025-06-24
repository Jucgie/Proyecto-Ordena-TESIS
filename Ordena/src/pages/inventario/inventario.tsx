import React, { useState, useEffect } from "react";
import Layout from "../../components/layout/layout";
import {
    Paper, Typography, Box, Button, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
    Card, CardContent, CardMedia, CardActionArea, Checkbox, FormControl, InputLabel, Select, IconButton
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SearchIcon from '@mui/icons-material/Search';
import WarningTwoToneIcon from '@mui/icons-material/WarningTwoTone';
import Tooltip from '@mui/material/Tooltip';
import sin_imagen from "../../assets/sin_imagen.png";
import { useInventariosStore } from "../../store/useProductoStore";
import { useAuthStore } from "../../store/useAuthStore";
import { BODEGA_CENTRAL } from "../../constants/ubicaciones";
import { useCallback } from "react";
import CloseIcon from '@mui/icons-material/Close';

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
    im: File | string | null;
}


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

    const deleteProductos = useCallback(
        (ubicacionId: string, codes: string[]) => useInventariosStore.getState().deleteProductos(ubicacionId, codes),
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


    // Filtrado
    const filteredProducts = productos.filter(product => {
        const matchProductName = product.name.toLowerCase().includes(search.toLowerCase());
        const matchCategoria = !filtros.categoria || product.category === filtros.categoria;
        const matchMarca = !filtros.marca || product.brand === filtros.marca;
        return matchProductName && matchCategoria && matchMarca;
    });

    // Handlers CRUD
    const handleAddProduct = (p: ProductInt) => {
        addProducto(ubicacionId, p);
        setModalAddOpen(false);
    };

    const handleUpdateProduct = (updatedProduct: ProductInt) => {
        if (updatedProduct.id_prodc) {
            updateProducto(ubicacionId, updatedProduct);
        }
        setModalEditOpen(false);
        setModalDetailOpen(false);
    };

    const handleDeleteProducts = (codes: string[]) => {
        const productosAEliminar = productos.filter(p => codes.includes(p.code));
        const idsAEliminar = productosAEliminar.map(p => p.id_prodc).filter(Boolean);
        if (idsAEliminar.length > 0) {
            deleteProductos(ubicacionId, idsAEliminar.map(id => id!.toString()));
        }
        setSelected([]);
        setDeleteMode(false);
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
            im: null,
        });
        const [errors, setErrors] = useState<{ [key: string]: string }>({});
        const [imgPreview, setImgPreview] = useState<string>(
            typeof initial?.im === "string" && initial.im ? initial.im : sin_imagen
        );
        const [isLoadingImg, setIsLoadingImg] = useState(false);

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
            if (name === "stock") {
                setForm(f => ({ ...f, stock: Number(value) }));
            } else {
                setForm(f => ({ ...f, [name]: value }));
            }
        };

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            const newErrors: { [key: string]: string } = {};
            if (!form.name.trim()) newErrors.name = "Campo obligatorio";
            if (!form.code.trim()) newErrors.code = "Campo obligatorio";
            if (!form.brand.trim()) newErrors.brand = "Campo obligatorio";
            if (!form.category.trim()) newErrors.category = "Campo obligatorio";
            if (!form.description.trim()) newErrors.description = "Campo obligatorio";
            if (form.stock < 0) newErrors.stock = "Stock no puede ser negativo";
            setErrors(newErrors);
            if (Object.keys(newErrors).length > 0) return;

            let imagenFinal = form.im;
            // Si no hay imagen subida, busca una en Unsplash
            if (!imagenFinal) {
                const url = await fetchImagenUnsplash(form.name);
                if (url) imagenFinal = url;
                else imagenFinal = sin_imagen;
            }
            onSave({ ...form, im: imagenFinal });
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
    function ProductDetailsModal({ product, open, onClose, onEdit }: {
        product: ProductInt | null,
        open: boolean,
        onClose: () => void,
        onEdit: () => void
    }) {
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
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '200px 1fr' }, gap: 4 }}>
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
                                    maxHeight: 200,
                                    objectFit: "cover",
                                    border: '1px solid #333'
                                }}
                        />
                        </Box>
                        
                        {/* Columna de Detalles */}
                        <Box>
                            <Typography variant="h4" sx={{ color: "#FFFFFF", fontWeight: 600, mb: 1 }}>
                                {product.name}
                            </Typography>
                            
                            <Box sx={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                gap: 2,
                                mb: 3
                            }}>
                                <DetailItem label="Código" value={product.code} />
                                <DetailItem label="Marca" value={product.brand} />
                                <DetailItem label="Categoría" value={product.category} />
                                <DetailItem label="Stock" value={product.stock.toString()} isHighlight />
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
                        onClick={onEdit} 
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
                                    <Tooltip title="Eliminar marca">
                                        <IconButton
                                            size="small"
                                            className="delete-icon"
                                            sx={{
                                                ml: 1,
                                                opacity: 0,
                                                transition: "opacity 0.2s",
                                                "&:hover": { color: "#ff1b00" }
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
                                    <Tooltip title="Eliminar categoría">
                                        <IconButton
                                            size="small"
                                            className="delete-icon"
                                            sx={{
                                                ml: 1,
                                                opacity: 0,
                                                transition: "opacity 0.2s",
                                                "&:hover": { color: "#ff1b00" }
                                            }}
                                            onClick={() => handleDeleteCategoria(c.nombre)}
                                        >
                                            <DeleteIcon fontSize="small" />
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

    // --- Render principal ---
    useEffect(() => {
        console.log("🔍 DEBUG - Inventario - useEffect ejecutado");
        console.log("🔍 DEBUG - Inventario - ubicacionId en useEffect:", ubicacionId);
        if (ubicacionId) {
            console.log("🔍 DEBUG - Inventario - Llamando a fetchProductos con:", ubicacionId);
            fetchProductos(ubicacionId);
        }
    }, [ubicacionId, fetchProductos]);

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
                            Eliminar
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
                    {/* Lista de productos */}
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mt: 2 }}>
                        {productos.length === 0 ? (
                            <Box sx={{ width: "100%", textAlign: "center", color: "#aaa", fontSize: "1.9rem", mt: 10 }}>
                                <WarningTwoToneIcon sx={{ fontSize: "90px" }} />
                                <p>No existen registros previos, empieza a agregarlos en "+ Añadir".</p>
                            </Box>
                        ) : filteredProducts.length === 0 ? (
                            <Box sx={{ width: "100%", textAlign: "center", color: "#aaa", fontSize: "1.9rem", mt: 10 }}>
                                <WarningTwoToneIcon sx={{ fontSize: "90px" }} />
                                <p>El producto no existe. ¿Quieres agregarlo?</p>
                            </Box>
                        ) : (
                            filteredProducts.map((product, idx) => (
                                <Card
                                    key={product.code + idx}
                                    sx={{
                                        maxWidth: 180,
                                        padding: 1.5,
                                        background: "#1E1E1E",
                                        border: selected.includes(product.code) ? "2px solid #FFD700" : "1px solid #a1a2a4",
                                        position: "relative",
                                        cursor: deleteMode ? "pointer" : "default",
                                        transition: "0.3s cubic-bezier(.47,1.64,.41,.8)",
                                        "&:hover": {
                                            borderColor: "#FFD700",
                                            transform: "scale(1.04)",
                                        }
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
                                            <Typography variant="body2" sx={{ color: "#FFD700", fontWeight: 700 }}>
                                                Stock: {product.stock ?? 0}
                                            </Typography>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            ))
                        )}
                    </Box>
                    {/* Botón eliminar seleccionados */}
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
                            onClick={() => handleDeleteProducts(selected)}
                        >
                            Eliminar seleccionados
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
                    ✏️ Editar Producto
                </DialogTitle>
                <DialogContent sx={{ bgcolor: "#1a1a1a", color: "#fff", pt: '28px' }}>
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
        </Layout>
    );
}

// Asegúrate de pasar props marcas y categorias a ProductForm y FiltroModal
// y que estos usen solo selects con los arrays recibidos.