import styled from "styled-components";
import InfoIcon from '@mui/icons-material/Info';
import { useState } from "react";
import type { ProductInt } from "../../pages/inventario/inventario";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    IconButton,
    Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { productoService } from "../../services/productoService";

interface Props {
    open: boolean;
    onClose: () => void;
    onAddProduct: (product: ProductInt) => void;
    marcas?: string[];
    categorias?: string[];
    ubicacionId?: string;
    esBodega?: boolean;
}

export function AddProduct({ open, onClose, onAddProduct, marcas = [], categorias = [], ubicacionId, esBodega }: Props) {
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isGeneratingCode, setIsGeneratingCode] = useState(false);

    const [form, setForm] = useState<ProductInt>({
        name: "",
        code: "",
        brand: "",
        category: "",
        description: "",
        stock: 0,
        stock_minimo: 5,
        stock_maximo: 100,
        im: null as File | null,
    });

    const [modelo, setModelo] = useState("");

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: unknown } }
    ) => {
        const { name, value } = e.target;
        if (name === "im" && 'files' in e.target) {
            setForm({ ...form, [name]: e.target.files?.[0] || null });
        } else if (typeof value === "string" && (name === "stock" || name === "stock_minimo" || name === "stock_maximo")) {
            // Convertir a número para campos numéricos
            setForm(f => ({ ...f, [name]: value === "" ? 0 : parseInt(value) || 0 }));
        } else if (typeof value === "string") {
            setForm(f => ({ ...f, [name]: value }));
        }
    };

    const handleGenerateCode = async () => {
        if (!form.name.trim() || !form.brand.trim() || !form.category.trim() || !ubicacionId) {
            setErrors({
                ...errors,
                code: "Complete nombre, marca y categoría para generar el código automáticamente"
            });
            return;
        }

        setIsGeneratingCode(true);
        try {
            const response = await productoService.generarCodigoAutomatico({
                nombre: form.name,
                marca: form.brand,
                categoria: form.category,
                modelo: modelo,
                ubicacion_id: ubicacionId,
                es_bodega: esBodega || false
            });

            setForm(prev => ({ ...prev, code: response.codigo }));
            setErrors(prev => ({ ...prev, code: "" }));
        } catch (error) {
            console.error("Error generando código:", error);
            setErrors({
                ...errors,
                code: "Error al generar código automático"
            });
        } finally {
            setIsGeneratingCode(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Validación de campos vacíos
        const newErrors: { [key: string]: string } = {};
        if (!form.name.trim()) newErrors.name = "Campo obligatorio";
        if (!form.code.trim()) newErrors.code = "Campo obligatorio";
        if (!form.brand.trim()) newErrors.brand = "Campo obligatorio";
        if (!form.category.trim()) newErrors.category = "Campo obligatorio";
        if (!form.description.trim()) newErrors.description = "Campo obligatorio";
        if (form.stock < 0) newErrors.stock = "El stock no puede ser negativo";

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) return;
        
        // Limpia el formulario si quieres
        onAddProduct(form);
        setForm({
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
        // Cerrar el modal
        onClose();
    };

    const handleClose = () => {
        setForm({
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
        setErrors({});
        onClose();
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleClose} 
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
                <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    ➕ Añadir Producto
                </Typography>
                <IconButton
                    onClick={handleClose}
                    sx={{ color: "#FFD700" }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            
            <DialogContent sx={{ bgcolor: "#1a1a1a", color: "#fff", pt: '28px' }}>
                <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <TextField
                                label="Código Interno"
                                name="code"
                                value={form.code}
                                onChange={handleChange}
                                error={!!errors.code}
                                helperText={errors.code}
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
                            <Tooltip title="Generar código automáticamente">
                                <IconButton
                                    onClick={handleGenerateCode}
                                    disabled={isGeneratingCode || !form.name.trim() || !form.brand.trim() || !form.category.trim()}
                                    sx={{
                                        color: "#FFD700",
                                        border: "1px solid #FFD700",
                                        '&:hover': {
                                            backgroundColor: "#FFD70022"
                                        },
                                        '&:disabled': {
                                            color: "#666666",
                                            borderColor: "#666666"
                                        }
                                    }}
                                >
                                    <AutoFixHighIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                    {/* Segunda fila */}
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                        <FormControl fullWidth error={!!errors.brand}>
                            <InputLabel sx={{ color: "#E0E0E0" }}>Marca</InputLabel>
                            <Select
                                name="brand"
                                value={form.brand}
                                onChange={handleChange}
                                required
                                sx={{
                                    color: "#FFFFFF",
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: "#666666" },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: "#888888" },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: "#4CAF50" },
                                    '& .MuiSelect-icon': { color: "#E0E0E0" }
                                }}
                                MenuProps={{
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
                                }}
                            >
                                <MenuItem value="" disabled sx={{ color: "#888888" }}>Selecciona una marca</MenuItem>
                                {marcas.map((marca) => (
                                    <MenuItem key={marca} value={marca} sx={{ color: "#FFFFFF" }}>
                                        {marca}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.brand && (
                                <Typography variant="caption" sx={{ color: "#ff6b6b", mt: 0.5 }}>
                                    {errors.brand}
                                </Typography>
                            )}
                        </FormControl>

                        <FormControl fullWidth error={!!errors.category}>
                            <InputLabel sx={{ color: "#E0E0E0" }}>Categoría</InputLabel>
                            <Select
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                required
                                sx={{
                                    color: "#FFFFFF",
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: "#666666" },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: "#888888" },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: "#4CAF50" },
                                    '& .MuiSelect-icon': { color: "#E0E0E0" }
                                }}
                                MenuProps={{
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
                                }}
                            >
                                <MenuItem value="" disabled sx={{ color: "#888888" }}>Selecciona una categoría</MenuItem>
                                {categorias.map((categoria) => (
                                    <MenuItem key={categoria} value={categoria} sx={{ color: "#FFFFFF" }}>
                                        {categoria}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.category && (
                                <Typography variant="caption" sx={{ color: "#ff6b6b", mt: 0.5 }}>
                                    {errors.category}
                                </Typography>
                            )}
                        </FormControl>
                    </Box>

                    {/* Campo de modelo */}
                    <TextField
                        label="Modelo/Variante (Opcional)"
                        value={modelo}
                        onChange={(e) => setModelo(e.target.value)}
                        fullWidth
                        placeholder="Ej: 500W, Rojo, Grande, etc."
                        InputLabelProps={{ style: { color: "#E0E0E0" } }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                color: "#FFFFFF",
                                '& fieldset': { borderColor: "#666666" },
                                '&:hover fieldset': { borderColor: "#888888" },
                                '&.Mui-focused fieldset': { borderColor: "#4CAF50" }
                            }
                        }}
                    />

                    {/* Tercera fila */}
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

                    {/* Sección de imagen */}
                    <Box sx={{ 
                        p: 2, 
                        bgcolor: "#232323", 
                        borderRadius: 2, 
                        border: "1px solid #333" 
                    }}>
                        <Typography variant="subtitle2" sx={{ color: "#E0E0E0", mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                            <InfoIcon sx={{ fontSize: 18 }} />
                            Imagen del Producto (Formato recomendado: 160 x 160)
                        </Typography>
                        <input
                            type="file"
                            name="im"
                            onChange={handleChange}
                            accept="image/*"
                            style={{
                                width: "100%",
                                padding: "8px",
                                border: "1px solid #666666",
                                borderRadius: "4px",
                                backgroundColor: "transparent",
                                color: "#fff"
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
                </Box>
            </DialogContent>

            <DialogActions sx={{ 
                bgcolor: "#1a1a1a", 
                borderTop: "1px solid #333",
                p: 2
            }}>
                <Button 
                    onClick={handleClose}
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
                    onClick={handleSubmit}
                    variant="contained"
                    sx={{
                        background: "#FFD700",
                        color: "#181818",
                        fontWeight: 700,
                        '&:hover': { background: "#FFD700cc" }
                    }}
                >
                    Agregar Producto
                </Button>
            </DialogActions>
        </Dialog>
    );
}
