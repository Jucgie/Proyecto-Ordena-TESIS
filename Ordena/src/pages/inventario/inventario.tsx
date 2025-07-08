import React, { useState, useEffect, useCallback, memo } from "react";
import Layout from "../../components/layout/layout";
import {
    Paper, Typography, Box, Button, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
    Card, CardContent, CardMedia, CardActionArea, Checkbox, FormControl, InputLabel, Select, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Alert, CircularProgress,
    Drawer, Divider, Switch
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SearchIcon from '@mui/icons-material/Search';
import WarningTwoToneIcon from '@mui/icons-material/WarningTwoTone';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import Tooltip from '@mui/material/Tooltip';
import sin_imagen from "../../assets/sin_imagen.png";
import { useInventariosStore } from "../../store/useProductoStore";
import { useAuthStore } from "../../store/useAuthStore";
import { BODEGA_CENTRAL } from "../../constants/ubicaciones";
import CloseIcon from '@mui/icons-material/Close';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { COLORS } from '../../constants/colors';
import { parseApiError } from '../../utils/errorUtils';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MotivoAjusteModal from '../../components/inventario/MotivoAjusteModal';
import { 
    validateProduct, 
    type ProductInt as ValidationProductInt,
    type ValidationError 
} from '../../utils/productoValidations';
import ValidationField from '../../components/inventario/ValidationField';
import ValidationSummary from '../../components/inventario/ValidationSummary';
import { productoService } from '../../services/productoService';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import TuneIcon from '@mui/icons-material/Tune';
import ReactivarProductosModal from '../../components/inventario/ReactivarProductosModal';
import BuildIcon from '@mui/icons-material/Build';
import BoltIcon from '@mui/icons-material/Bolt';
import PlumbingIcon from '@mui/icons-material/Plumbing';
import ConstructionIcon from '@mui/icons-material/Construction';
import YardIcon from '@mui/icons-material/Yard';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import FormatPaintIcon from '@mui/icons-material/FormatPaint';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import HardwareIcon from '@mui/icons-material/Hardware';
import StraightenIcon from '@mui/icons-material/Straighten';
import LayersIcon from '@mui/icons-material/Layers';
import CategoryIcon from '@mui/icons-material/Category';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import HandymanIcon from '@mui/icons-material/Handyman';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import HomeIcon from '@mui/icons-material/Home';
import StoreIcon from '@mui/icons-material/Store';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ScienceIcon from '@mui/icons-material/Science';
import ComputerIcon from '@mui/icons-material/Computer';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalGroceryStoreIcon from '@mui/icons-material/LocalGroceryStore';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import GrassIcon from '@mui/icons-material/Grass';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import FactoryIcon from '@mui/icons-material/Factory';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import KitchenIcon from '@mui/icons-material/Kitchen';
import ChairIcon from '@mui/icons-material/Chair';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import DirectionsRailwayIcon from '@mui/icons-material/DirectionsRailway';
import DirectionsSubwayIcon from '@mui/icons-material/DirectionsSubway';
import DirectionsTransitIcon from '@mui/icons-material/DirectionsTransit';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';

// Función mejorada para buscar imágenes usando Pexels API
async function fetchImagenPexels(nombre: string, categoria?: string, marca?: string): Promise<string> {
    try {
        const apiKey = "F225d2rKvO7dOrqEAPttpQXuz09Pio3Jz4Qj8aE7SbWQqCFEf3nYaTV6";

        // Palabras clave base en español e inglés
        const keywordsEs = [nombre, categoria, marca, "producto", "herramienta", "ferretería", "industrial", "sobre fondo blanco", "packaging", "catálogo"].filter(Boolean).join(" ");
        const keywordsEn = [nombre, categoria, marca, "product", "tool", "hardware", "industrial", "white background", "packaging", "catalog", "professional photo"].filter(Boolean).join(" ");
        
        // Unir ambos idiomas para una sola búsqueda
        const keywords = `${keywordsEs} ${keywordsEn}`;

        // Buscar en Pexels
        const response = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(keywords)}&per_page=15&orientation=landscape`,
            {
                headers: {
                    'Authorization': apiKey
                }
            }
        );
        if (!response.ok) {
            throw new Error(`Pexels API error: ${response.status}`);
        }
        const data = await response.json();
        if (!data.photos || data.photos.length === 0) return "";

        // Palabras clave para filtrar imágenes irrelevantes (solo las más problemáticas)
        const blacklist = ["person", "people", "woman", "man", "girl", "boy", "child", "children", "baby", "family", "portrait", "selfie", "face", "fashion", "model", "wedding", "love", "couple", "friends", "pet", "dog", "cat", "animal", "bird", "horse", "fish", "food", "fruit", "vegetable", "cake", "bread", "drink", "coffee", "tea", "wine", "beer", "alcohol", "party", "music", "dance", "sport", "ball", "car", "bike", "motorcycle", "bus", "train", "plane", "boat", "ship", "road", "street", "city", "building", "house", "apartment", "hotel", "room", "bed", "sofa", "chair", "table", "desk", "computer", "laptop", "phone", "tablet", "screen", "tv", "camera", "watch", "clock", "calendar", "book", "magazine", "newspaper", "pen", "pencil", "paint", "brush", "art", "drawing", "photo", "picture", "frame", "poster", "sign", "logo", "brand", "advertising", "banner", "flyer", "brochure", "card", "gift", "present", "box", "bag", "wallet", "key", "lock", "door", "window", "mirror", "lamp", "light", "candle", "fire", "smoke", "cloud", "rain", "snow", "ice", "water", "pool", "bath", "shower", "toilet", "sink", "towel", "soap", "shampoo", "toothbrush", "toothpaste", "comb", "brush", "razor", "scissors", "nail", "polish", "makeup", "perfume", "jewelry", "ring", "necklace", "earring", "bracelet", "watch", "glasses", "sunglasses", "hat", "cap", "helmet", "shirt", "t-shirt", "blouse", "dress", "skirt", "pants", "jeans", "shorts", "suit", "jacket", "coat", "sweater", "hoodie", "vest", "scarf", "glove", "sock", "shoe", "boot", "slipper", "sandals", "umbrella", "bag", "backpack", "suitcase", "luggage", "cart", "basket", "trolley", "box", "crate", "barrel", "bottle", "jar", "can", "cup", "glass", "mug", "plate", "bowl", "dish", "tray", "fork", "knife", "spoon", "chopstick", "napkin", "straw", "toothpick", "grill", "oven", "stove", "microwave", "fridge", "freezer", "blender", "mixer", "toaster", "kettle"];

        // Score de relevancia más flexible
        function getScore(photo: any) {
            const text = `${photo.alt || ''} ${photo.photographer || ''}`.toLowerCase();
            let score = 0;
            
            // Bonus por coincidencias exactas
            if (nombre && text.includes(nombre.toLowerCase())) score += 3;
            if (marca && text.includes(marca.toLowerCase())) score += 2;
            if (categoria && text.includes(categoria.toLowerCase())) score += 2;
            
            // Bonus por palabras relacionadas con productos/herramientas
            const productKeywords = ["product", "tool", "hardware", "ferretería", "herramienta", "industrial", "equipment", "machine", "device", "instrument", "appliance", "gadget", "component", "part", "material", "supply", "accessory"];
            for (const keyword of productKeywords) {
                if (text.includes(keyword)) score += 1;
            }
            
            // Bonus por imágenes profesionales
            const professionalKeywords = ["white background", "packaging", "catalog", "professional", "commercial", "studio", "clean", "minimal", "modern"];
            for (const keyword of professionalKeywords) {
                if (text.includes(keyword)) score += 1;
            }
            
            // Penalización menor por contenido irrelevante
            for (const word of blacklist) {
                if (text.includes(word)) score -= 1;
            }
            
            return score;
        }

        // Ordenar por score de relevancia
        const sorted = data.photos
            .map((photo: any) => ({ ...photo, _score: getScore(photo) }))
            .sort((a: any, b: any) => b._score - a._score);

        // Tomar la mejor imagen (más flexible, no requiere score positivo)
        const best = sorted[0];
        if (best && best._score >= -1) { // Permitir imágenes con score ligeramente negativo
            return best.src?.medium || best.src?.large || best.src?.small || "";
        }
        
        // Si no hay buenas opciones, devolver vacío
        return "";
    } catch (error) {
        console.error("Error fetching image from Pexels:", error);
        return "";
    }
}

// Función de respaldo con placeholders inteligentes por categoría
function getPlaceholderImage(categoria?: string, marca?: string, nombre?: string): string {
    // Normalizar categoría: minúsculas, sin tildes, sin espacios
    function normalize(str: string = "") {
        return str
            .toLowerCase()
            .normalize("NFD").replace(/\p{Diacritic}/gu, "")
            .replace(/[^a-z0-9 ]/g, "")
            .trim();
    }
    const cat = normalize(categoria);
    // Alias de categorías
    const alias: { [key: string]: string } = {
        "herramienta": "herramientas",
        "herramientas": "herramientas",
        "martillo": "herramientas",
        "clavo": "clavos",
        "clavos": "clavos",
        "tornillo": "tornillos",
        "tornillos": "tornillos",
        "planchas": "planchas",
        "cinta metrica": "cinta metrica",
        "taladro": "taladro",
        "electricidad": "electricidad",
        "plomeria": "plomeria",
        "construccion": "construccion",
        "jardin": "jardin",
        "automotriz": "automotriz",
        "pintura": "pintura"
    };
    const baseCat = alias[cat] || cat || 'default';
    // Íconos SVG genéricos por categoría
    const categoriaConfig: { [key: string]: { color: string, icon: string } } = {
        'herramientas': {
            color: '#FF6B35',
            icon: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="none"/><path d="M36.5 11.5L28 20L32 24L40.5 15.5C41.3284 14.6716 41.3284 13.3284 40.5 12.5L35.5 7.5C34.6716 6.67157 33.3284 6.67157 32.5 7.5L24 16L28 20L36.5 11.5Z" fill="#fff"/></svg>`
        },
        'clavos': {
            color: '#B0BEC5',
            icon: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="none"/><rect x="22" y="8" width="4" height="28" fill="#fff"/><rect x="20" y="36" width="8" height="4" fill="#fff"/></svg>`
        },
        'tornillos': {
            color: '#90A4AE',
            icon: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="none"/><rect x="22" y="8" width="4" height="24" fill="#fff"/><polygon points="24,36 20,44 28,44" fill="#fff"/></svg>`
        },
        'planchas': {
            color: '#95A5A6',
            icon: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="none"/><rect x="10" y="20" width="28" height="8" fill="#fff"/></svg>`
        },
        'cinta metrica': {
            color: '#FFD700',
            icon: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="none"/><circle cx="24" cy="24" r="12" fill="#fff"/><rect x="20" y="32" width="8" height="8" fill="#fff"/></svg>`
        },
        'taladro': {
            color: '#4ECDC4',
            icon: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="none"/><rect x="12" y="20" width="24" height="8" fill="#fff"/><rect x="32" y="16" width="8" height="16" fill="#fff"/></svg>`
        },
        'electricidad': {
            color: '#FFE66D',
            icon: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="none"/><path d="M24 4L16 28H24V44L32 20H24V4Z" fill="#fff"/></svg>`
        },
        'plomeria': {
            color: '#45B7D1',
            icon: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="none"/><path d="M34 14V10C34 7.79086 32.2091 6 30 6H18C15.7909 6 14 7.79086 14 10V14H6V18H42V14H34Z" fill="#fff"/></svg>`
        },
        'construccion': {
            color: '#95A5A6',
            icon: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="none"/><rect x="8" y="32" width="32" height="8" fill="#fff"/><rect x="12" y="24" width="24" height="8" fill="#fff"/><rect x="16" y="16" width="16" height="8" fill="#fff"/></svg>`
        },
        'jardin': {
            color: '#2ECC71',
            icon: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="none"/><circle cx="24" cy="24" r="10" fill="#fff"/><path d="M24 34V44" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>`
        },
        'automotriz': {
            color: '#E74C3C',
            icon: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="none"/><rect x="10" y="20" width="28" height="12" fill="#fff"/><circle cx="16" cy="36" r="4" fill="#fff"/><circle cx="32" cy="36" r="4" fill="#fff"/></svg>`
        },
        'pintura': {
            color: '#9B59B6',
            icon: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="none"/><rect x="20" y="8" width="8" height="32" fill="#fff"/><rect x="16" y="36" width="16" height="4" fill="#fff"/></svg>`
        },
        // Default: caja genérica
        'default': {
            color: '#34495E',
            icon: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="none"/><rect x="12" y="20" width="24" height="16" fill="#fff"/><rect x="16" y="16" width="16" height="8" fill="#fff"/></svg>`
        }
    };
    const config = categoriaConfig[baseCat] || categoriaConfig['default'];
    // SVG con icono, nombre y marca
    const svgContent = `<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${config.color}"/>
        <g transform="translate(126,36)">${config.icon}</g>
        <text x="150" y="120" font-family="Arial, sans-serif" font-size="22" fill="white" text-anchor="middle" font-weight="bold">${nombre ? nombre.slice(0, 18) : (categoria || 'Producto')}</text>
        <text x="150" y="145" font-family="Arial, sans-serif" font-size="15" fill="rgba(255,255,255,0.85)" text-anchor="middle">${marca || 'Sin marca'}</text>
    </svg>`;
    try {
        return `data:image/svg+xml;base64,${btoa(svgContent)}`;
    } catch (error) {
        // Fallback simple
        const fallbackSvg = `<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="${config.color}"/>
            <text x="150" y="100" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle">${categoria || 'Producto'}</text>
        </svg>`;
        return `data:image/svg+xml;base64,${btoa(fallbackSvg)}`;
    }
}

// Función principal para obtener imagen del producto
async function fetchProductImage(nombre: string, categoria?: string, marca?: string): Promise<string> {
    // Usar directamente placeholders inteligentes por categoría
    return getPlaceholderImage(categoria, marca);
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
        (ubicacionId: string, producto: ProductInt, motivo?: string) => useInventariosStore.getState().updateProducto(ubicacionId, producto, motivo),
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

    // Nuevos estados para filtros avanzados
    const [filtrosAvanzados, setFiltrosAvanzados] = useState({
        stockMinimo: '',
        stockMaximo: '',
        stockStatus: '' as '' | 'bajo' | 'normal' | 'alto' | 'sin_stock',
        ordenarPor: 'stock' as 'stock' | 'nombre' | 'marca' | 'categoria' | 'codigo',
        orden: 'desc' as 'asc' | 'desc'
    });

    // Estado para vista de galería/lista
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

    // Estado para atajos de teclado
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

    // Modales
    const [modalAddOpen, setModalAddOpen] = useState(false);
    const [modalEditOpen, setModalEditOpen] = useState(false);
    const [modalDetailOpen, setModalDetailOpen] = useState(false);
    const [modalFiltroOpen, setModalFiltroOpen] = useState(false);
    const [modalGestionOpen, setModalGestionOpen] = useState(false);
    const [modalMotivoOpen, setModalMotivoOpen] = useState(false);
    const [productoAjuste, setProductoAjuste] = useState<ProductInt | null>(null);

    // Producto seleccionado para editar/ver
    const [productoActual, setProductoActual] = useState<ProductInt | null>(null);

    // Estado para abrir/cerrar el panel lateral
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Estado para el modal de reactivar productos
    const [modalReactivarOpen, setModalReactivarOpen] = useState(false);

    // Mover la declaración de marcasActivas y categoriasActivas y su useEffect justo antes de la lógica de filtrado de productos
    const [marcasActivas, setMarcasActivas] = useState<{ [nombre: string]: boolean }>({});
    const [categoriasActivas, setCategoriasActivas] = useState<{ [nombre: string]: boolean }>({});
    useEffect(() => {
        if (Array.isArray(marcas)) {
            setMarcasActivas(prev => {
                const nuevo = { ...prev };
                marcas.forEach((m: any) => {
                    if (nuevo[m.nombre] === undefined) nuevo[m.nombre] = true;
                });
                return nuevo;
            });
        }
        if (Array.isArray(categorias)) {
            setCategoriasActivas(prev => {
                const nuevo = { ...prev };
                categorias.forEach((c: any) => {
                    if (nuevo[c.nombre] === undefined) nuevo[c.nombre] = true;
                });
                return nuevo;
            });
        }
    }, [marcas, categorias]);

    // --- Función de ordenamiento avanzado ---
    const ordenarProductos = (productos: ProductInt[]) => {
        return [...productos].sort((a, b) => {
            let valorA: any, valorB: any;
            
            switch (filtrosAvanzados.ordenarPor) {
                case 'nombre':
                    valorA = a.name.toLowerCase();
                    valorB = b.name.toLowerCase();
                    break;
                case 'marca':
                    valorA = a.brand.toLowerCase();
                    valorB = b.brand.toLowerCase();
                    break;
                case 'categoria':
                    valorA = a.category.toLowerCase();
                    valorB = b.category.toLowerCase();
                    break;
                case 'codigo':
                    valorA = a.code.toLowerCase();
                    valorB = b.code.toLowerCase();
                    break;
                case 'stock':
                default:
                    valorA = a.stock;
                    valorB = b.stock;
                    break;
            }
            
            if (typeof valorA === 'string') {
                return filtrosAvanzados.orden === 'asc' 
                    ? valorA.localeCompare(valorB)
                    : valorB.localeCompare(valorA);
            } else {
                return filtrosAvanzados.orden === 'asc' 
                    ? valorA - valorB
                    : valorB - valorA;
            }
        });
    };

    // --- Función de filtrado avanzado ---
    const filtrarProductos = (productos: ProductInt[]) => {
        return productos.filter(product => {
            // Filtro de búsqueda por nombre, código o descripción
            const searchLower = search.toLowerCase();
            const matchSearch = !search || 
                product.name.toLowerCase().includes(searchLower) ||
                product.code.toLowerCase().includes(searchLower) ||
                product.description.toLowerCase().includes(searchLower);
            
            // Filtros básicos
            const matchCategoria = !filtros.categoria || product.category === filtros.categoria;
            const matchMarca = !filtros.marca || product.brand === filtros.marca;
            
            // Filtros avanzados de stock
            const stock = product.stock;
            const stockMinimo = filtrosAvanzados.stockMinimo ? Number(filtrosAvanzados.stockMinimo) : 0;
            const stockMaximo = filtrosAvanzados.stockMaximo ? Number(filtrosAvanzados.stockMaximo) : Infinity;
            const matchStockRange = stock >= stockMinimo && stock <= stockMaximo;
            
            // Filtro por estado de stock
            let matchStockStatus = true;
            if (filtrosAvanzados.stockStatus) {
                switch (filtrosAvanzados.stockStatus) {
                    case 'sin_stock':
                        matchStockStatus = stock === 0;
                        break;
                    case 'bajo':
                        matchStockStatus = stock > 0 && stock < product.stock_minimo;
                        break;
                    case 'normal':
                        matchStockStatus = stock >= product.stock_minimo && stock <= product.stock_maximo;
                        break;
                    case 'alto':
                        matchStockStatus = stock > product.stock_maximo;
                        break;
                }
            }
            
            return matchSearch && matchCategoria && matchMarca && matchStockRange && matchStockStatus;
        });
    };

    // Aplicar filtros y ordenamiento
    const filteredProducts = ordenarProductos(filtrarProductos(productos));

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
            const errorMessage = Array.isArray(msg) ? msg.join(', ') : msg;
            setErrorModalMessage(msg);
            setShowErrorModal(true);
            showSnackbar(errorMessage, 'error');
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
            const errorMessage = Array.isArray(msg) ? msg.join(', ') : msg;
            setErrorModalMessage(msg);
            setShowErrorModal(true);
            showSnackbar(errorMessage, 'error');
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
            const errorMessage = Array.isArray(msg) ? msg.join(', ') : msg;
            setErrorModalMessage(msg);
            setShowErrorModal(true);
            showSnackbar(errorMessage, 'error');
        }
    };

    const handleQuickStockUpdate = async (updatedProduct: ProductInt) => {
        setModalDetailOpen(false); // Cierra el modal de detalle
        setTimeout(() => {
            setProductoAjuste(updatedProduct);
            setModalMotivoOpen(true);
        }, 300); // Espera a que se cierre el modal anterior para evitar solapamiento
    };

    const handleConfirmarAjuste = async (motivo: string, producto: ProductInt) => {
        console.log("🔍 DEBUG - handleConfirmarAjuste - Motivo recibido:", motivo);
        console.log("🔍 DEBUG - handleConfirmarAjuste - Producto:", producto);
        if (!producto || !producto.id_prodc) return;
        try {
            await updateProducto(ubicacionId, producto, motivo);
            showSnackbar('Stock ajustado correctamente', 'success');
            setModalMotivoOpen(false);
            setProductoAjuste(null);
            // Refrescar productos
            fetchProductos(ubicacionId);
        } catch (error: any) {
            const msg = parseApiError(error);
            const errorMessage = Array.isArray(msg) ? msg.join(', ') : msg;
            setErrorModalMessage(msg);
            setShowErrorModal(true);
            showSnackbar(errorMessage, 'error');
        }
    };

    // --- Formularios ---

    // Formulario para agregar/editar producto
    function ProductForm({ initial, onSave, onCancel, marcas, categorias, productosActuales }: {
        initial?: ProductInt,
        onSave: (p: ProductInt) => void,
        onCancel: () => void,
        marcas: string[],
        categorias: string[],
        productosActuales: ProductInt[],
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
        const [generalError, setGeneralError] = useState<string>("");
        const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
        const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
        const [showErrors, setShowErrors] = useState(false);
        const [isGeneratingCode, setIsGeneratingCode] = useState(false);
        const [modelo, setModelo] = useState("");

        // Inicializar imagen de previsualización
        useEffect(() => {
            // Si hay una imagen inicial (edición), usarla
            if (initial?.im && typeof initial.im === 'string') {
                setImgPreview(initial.im);
            } else if (initial?.im && initial.im instanceof File) {
                setImgPreview(URL.createObjectURL(initial.im));
            } else {
                // Mostrar placeholder por defecto
                setImgPreview(sin_imagen);
            }
        }, [initial]);

        // Actualizar placeholder cuando cambia categoría, marca o cuando no hay imagen subida
        useEffect(() => {
            // Forzar placeholder si hay categoría y no hay imagen
            if (form.category && !form.im) {
                const placeholder = getPlaceholderImage(form.category, form.brand);
                setImgPreview(placeholder);
            } else if (!form.im) {
                setImgPreview(sin_imagen);
            }
        }, [form.category, form.brand, form.im]);

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
                // Manejar valores vacíos para campos numéricos
                const numValue = value === '' ? 0 : Number(value);
                setForm(f => ({ ...f, [name]: numValue }));
            } else {
                setForm(f => ({ ...f, [name]: value }));
            }
        };

        const handleBlur = (fieldName: string) => {
            setTouchedFields(prev => new Set(prev).add(fieldName));
        };

        // Validar el formulario cada vez que cambia
        useEffect(() => {
            const result = validateProduct(form, productosActuales, !!initial);
            setValidationErrors(result.errors);
        }, [form, initial, productosActuales]);

        const handleGenerateCode = async () => {
            if (!form.name.trim() || !form.brand.trim() || !form.category.trim() || !ubicacionId) {
                setValidationErrors([{
                    field: 'code',
                    message: 'Complete nombre, marca y categoría para generar el código automáticamente'
                }]);
                return;
            }

            setIsGeneratingCode(true);
            try {
                const response = await productoService.generarCodigoAutomatico({
                    nombre: form.name,
                    marca: form.brand,
                    categoria: form.category,
                    modelo: modelo,
                    ubicacion_id: ubicacionId === "bodega_central" ? "2" : ubicacionId,
                    es_bodega: ubicacionId === "bodega_central"
                });

                setForm(prev => ({ ...prev, code: response.codigo }));
                setValidationErrors(prev => prev.filter(e => e.field !== 'code'));
            } catch (error) {
                console.error("Error generando código:", error);
                setValidationErrors(prev => [...prev, {
                    field: 'code',
                    message: 'Error al generar código automático'
                }]);
            } finally {
                setIsGeneratingCode(false);
            }
        };

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setShowErrors(true); // Mostrar todos los errores al intentar enviar
            setGeneralError("");
            
            // Marcar todos los campos como touched
            setTouchedFields(new Set(['name', 'code', 'brand', 'category', 'description', 'stock', 'stock_minimo', 'stock_maximo']));
            
            // Validar usando las funciones profesionales
            const result = validateProduct(form, productosActuales, !!initial);
            if (!result.isValid) {
                setValidationErrors(result.errors);
                return;
            }

            let imagenFinal = form.im;
            if (!imagenFinal) {
                // Usar el mismo valor de imgPreview (placeholder SVG o imagen generada)
                imagenFinal = imgPreview;
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
                {/* Resumen de validación en la parte superior */}
                <ValidationSummary
                    errors={validationErrors}
                    showErrors={showErrors}
                />

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
                            onError={(e) => {
                                e.currentTarget.src = sin_imagen;
                            }}
                        />
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

                {/* Primera fila - Nombre y Código */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                    <ValidationField
                        label="Nombre del Producto"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        onBlur={() => handleBlur('name')}
                        errors={validationErrors}
                        touched={touchedFields.has('name')}
                        showErrors={showErrors}
                        required
                        helperText="Nombre descriptivo del producto"
                    />
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <ValidationField
                            label="Código Interno"
                            name="code"
                            value={form.code}
                            onChange={handleChange}
                            onBlur={() => handleBlur('code')}
                            errors={validationErrors}
                            touched={touchedFields.has('code')}
                            showErrors={showErrors}
                            required
                            disabled={true}
                            helperText="Código generado automáticamente"
                        />
                        {!initial && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Button
                                    onClick={handleGenerateCode}
                                    disabled={isGeneratingCode || !form.name.trim() || !form.brand.trim() || !form.category.trim()}
                                    variant="outlined"
                                    size="small"
                                    startIcon={isGeneratingCode ? <CircularProgress size={16} /> : <AutoFixHighIcon />}
                                    sx={{
                                        color: "#FFD700",
                                        borderColor: "#FFD700",
                                        fontSize: "0.75rem",
                                        py: 0.5,
                                        px: 1.5,
                                        minWidth: "auto",
                                        transition: "all 0.2s ease",
                                        '&:hover': {
                                            backgroundColor: "#FFD70022",
                                            borderColor: "#FFD700",
                                            transform: "translateY(-1px)"
                                        },
                                        '&:disabled': {
                                            color: "#666666",
                                            borderColor: "#666666"
                                        }
                                    }}
                                >
                                    {isGeneratingCode ? "Generando..." : "Generar Código"}
                                </Button>
                                {form.code && (
                                    <Tooltip title="Código generado" placement="top">
                                        <Chip
                                            label={form.code}
                                            size="small"
                                            sx={{
                                                backgroundColor: "#2E7D32",
                                                color: "#FFFFFF",
                                                fontSize: "0.7rem",
                                                maxWidth: "120px",
                                                transition: "all 0.2s ease",
                                                '& .MuiChip-label': {
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap"
                                                }
                                            }}
                                        />
                                    </Tooltip>
                                )}
                            </Box>
                        )}
                    </Box>
                </Box>

                {/* Segunda fila - Marca y Categoría */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                    <ValidationField
                        label="Marca"
                        name="brand"
                        value={form.brand}
                        onChange={handleChange}
                        onBlur={() => handleBlur('brand')}
                        errors={validationErrors}
                        touched={touchedFields.has('brand')}
                        showErrors={showErrors}
                        fieldType="select"
                        required
                        helperText="Marca del fabricante"
                    >
                        <MenuItem value="" disabled sx={{ color: "#888888" }}>Selecciona una marca</MenuItem>
                        {marcas.map(m => <MenuItem key={m} value={m} sx={{ color: "#FFFFFF" }}>{m}</MenuItem>)}
                    </ValidationField>
                    <ValidationField
                        label="Categoría"
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        onBlur={() => handleBlur('category')}
                        errors={validationErrors}
                        touched={touchedFields.has('category')}
                        showErrors={showErrors}
                        fieldType="select"
                        required
                        helperText="Categoría del producto"
                    >
                        <MenuItem value="" disabled sx={{ color: "#888888" }}>Selecciona una categoría</MenuItem>
                        {categorias.map(c => <MenuItem key={c} value={c} sx={{ color: "#FFFFFF" }}>{c}</MenuItem>)}
                    </ValidationField>
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

                {/* Tercera fila - Stocks */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
                    <ValidationField
                        label="Stock Inicial"
                        name="stock"
                        value={form.stock || ''}
                        onChange={handleChange}
                        onBlur={() => handleBlur('stock')}
                        errors={validationErrors}
                        touched={touchedFields.has('stock')}
                        showErrors={showErrors}
                        fieldType="number"
                        required
                        inputProps={{ 
                            min: 0,
                            step: 1,
                            inputMode: 'numeric',
                            pattern: '[0-9]*'
                        }}
                        helperText="Cantidad inicial en inventario"
                    />
                    <ValidationField
                        label="Stock Mínimo"
                        name="stock_minimo"
                        value={form.stock_minimo || ''}
                        onChange={handleChange}
                        onBlur={() => handleBlur('stock_minimo')}
                        errors={validationErrors}
                        touched={touchedFields.has('stock_minimo')}
                        showErrors={showErrors}
                        fieldType="number"
                        required
                        inputProps={{ 
                            min: 0,
                            step: 1,
                            inputMode: 'numeric',
                            pattern: '[0-9]*'
                        }}
                        helperText="Cantidad mínima antes de alertar"
                    />
                    <ValidationField
                        label="Stock Máximo"
                        name="stock_maximo"
                        value={form.stock_maximo || ''}
                        onChange={handleChange}
                        onBlur={() => handleBlur('stock_maximo')}
                        errors={validationErrors}
                        touched={touchedFields.has('stock_maximo')}
                        showErrors={showErrors}
                        fieldType="number"
                        required
                        inputProps={{ 
                            min: 0,
                            step: 1,
                            inputMode: 'numeric',
                            pattern: '[0-9]*'
                        }}
                        helperText="Cantidad máxima antes de alertar"
                    />
                </Box>

                {/* Descripción */}
                <ValidationField
                    label="Descripción"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    onBlur={() => handleBlur('description')}
                    errors={validationErrors}
                    touched={touchedFields.has('description')}
                    showErrors={showErrors}
                    fieldType="textarea"
                    multiline
                    rows={4}
                    required={false}
                    helperText="Descripción detallada del producto (opcional pero recomendada)"
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
                            background: validationErrors.length > 0 ? "#666" : "#FFD700",
                            color: validationErrors.length > 0 ? "#ccc" : "#181818",
                            fontWeight: 700,
                            '&:hover': { 
                                background: validationErrors.length > 0 ? "#666" : "#FFD700cc" 
                            }
                        }}
                        disabled={validationErrors.length > 0}
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
            <>
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


            </>
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

    // Declarar las funciones en el scope principal:
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

        console.log("🔍 [INVENTARIO] Productos del store:", productos);
        productos.forEach((p, i) => {
            console.log(`[INVENTARIO] Producto #${i}:`, p);
        });

    // Modal para gestionar marcas y categorías (con switches de activación y color amarillo)
    function GestionarModal({ open, onClose, marcasActivas, setMarcasActivas, categoriasActivas, setCategoriasActivas, handleDeleteMarca, handleDeleteCategoria }: {
        open: boolean,
        onClose: () => void,
        marcasActivas: { [nombre: string]: boolean },
        setMarcasActivas: React.Dispatch<React.SetStateAction<{ [nombre: string]: boolean }>>,
        categoriasActivas: { [nombre: string]: boolean },
        setCategoriasActivas: React.Dispatch<React.SetStateAction<{ [nombre: string]: boolean }>>,
        handleDeleteMarca: (marca: string) => void,
        handleDeleteCategoria: (cat: string) => void,
    }) {
        const [nuevaMarca, setNuevaMarca] = useState("");
        const [nuevaCategoria, setNuevaCategoria] = useState("");
        const [buscaMarca, setBuscaMarca] = useState("");
        const [buscaCategoria, setBuscaCategoria] = useState("");
        // ... el resto igual, pero sin useState ni useEffect de activas
        return (
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{
                sx: {
                    bgcolor: '#181818',
                    borderRadius: 3,
                    border: 'none', // sin borde amarillo
                    boxShadow: 24,
                    p: 0
                }
            }}>
                <DialogTitle sx={{
                    bgcolor: '#232323',
                    color: '#FFD700',
                    borderBottom: 'none', // sin borde amarillo
                    fontWeight: 700,
                    fontSize: 20,
                    letterSpacing: 0.5,
                    px: 4,
                    py: 2.5
                }}>
                    Gestionar Marcas y Categorías
                </DialogTitle>
                <DialogContent sx={{ bgcolor: '#181818', color: '#fff', px: 4, py: 3 }}>
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: '#FFD700', fontWeight: 600, fontSize: 15, letterSpacing: 0.5 }}>Marcas actuales</Typography>
                        <TextField
                            placeholder="Buscar marca..."
                            value={buscaMarca}
                            onChange={e => setBuscaMarca(e.target.value)}
                            size="small"
                            sx={{ mb: 2, width: "100%", bgcolor: '#232323', borderRadius: 2,
                                input: { color: '#fff', fontWeight: 500 },
                                label: { color: '#FFD700' },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' }
                            }}
                            InputProps={{ style: { color: '#fff' } }}
                        />
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.2, mb: 2 }}>
                            {marcas.map(m => (
                                <Box
                                    key={m.nombre}
                                    sx={{
                                        bgcolor: '#232323',
                                        color: marcasActivas[m.nombre] ? '#FFD700' : '#888',
                                        px: 2,
                                        py: 0.5,
                                        borderRadius: 2,
                                        fontWeight: 600,
                                        display: "flex",
                                        alignItems: "center",
                                        position: "relative",
                                        boxShadow: 1,
                                        border: 'none',
                                        transition: "all 0.2s",
                                        opacity: marcasActivas[m.nombre] ? 1 : 0.5,
                                        '&:hover': { bgcolor: '#232323', color: '#FFD700' }
                                    }}
                                >
                                    {m.nombre}
                                    <Switch
                                        checked={marcasActivas[m.nombre] !== false}
                                        onChange={() => setMarcasActivas(prev => ({ ...prev, [m.nombre]: !prev[m.nombre] }))}
                                            size="small"
                                        sx={{ ml: 1, color: '#FFD700', '& .MuiSwitch-thumb': { bgcolor: '#FFD700' } }}
                                    />
                                </Box>
                            ))}
                        </Box>
                        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                            <TextField
                                label="Nueva marca"
                                value={nuevaMarca}
                                onChange={e => setNuevaMarca(e.target.value)}
                                size="small"
                                sx={{ bgcolor: '#232323', borderRadius: 2, input: { color: '#fff' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' } }}
                                InputProps={{ style: { color: '#fff' } }}
                            />
                            <Button
                              variant="contained"
                                sx={{ bgcolor: '#FFD700', color: '#232323', fontWeight: 700, borderRadius: 2, boxShadow: 0, '&:hover': { bgcolor: '#FFD700cc', color: '#232323' } }}
                                onClick={() => { if (nuevaMarca.trim()) { addMarca(nuevaMarca.trim()); setNuevaMarca(""); } }}
                          >
                              Agregar
                          </Button>
                        </Box>
                    </Box>
                    <Divider sx={{ bgcolor: '#333', mb: 4 }} />
                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: '#FFD700', fontWeight: 600, fontSize: 15, letterSpacing: 0.5 }}>Categorías actuales</Typography>
                        <TextField
                            placeholder="Buscar categoría..."
                            value={buscaCategoria}
                            onChange={e => setBuscaCategoria(e.target.value)}
                            size="small"
                            sx={{ mb: 2, width: "100%", bgcolor: '#232323', borderRadius: 2,
                                input: { color: '#fff', fontWeight: 500 },
                                label: { color: '#FFD700' },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' }
                            }}
                            InputProps={{ style: { color: '#fff' } }}
                        />
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.2, mb: 2 }}>
                            {categorias.map(c => (
                                <Box
                                    key={c.nombre}
                                    sx={{
                                        bgcolor: '#232323',
                                        color: categoriasActivas[c.nombre] ? '#FFD700' : '#888',
                                        px: 2,
                                        py: 0.5,
                                        borderRadius: 2,
                                        fontWeight: 600,
                                        display: "flex",
                                        alignItems: "center",
                                        position: "relative",
                                        boxShadow: 1,
                                        border: 'none',
                                        transition: "all 0.2s",
                                        opacity: categoriasActivas[c.nombre] ? 1 : 0.5,
                                        '&:hover': { bgcolor: '#232323', color: '#FFD700' }
                                    }}
                                >
                                    {c.nombre}
                                    <Switch
                                        checked={categoriasActivas[c.nombre] !== false}
                                        onChange={() => setCategoriasActivas(prev => ({ ...prev, [c.nombre]: !prev[c.nombre] }))}
                                        size="small"
                                        sx={{ ml: 1, color: '#FFD700', '& .MuiSwitch-thumb': { bgcolor: '#FFD700' } }}
                                    />
                                </Box>
                            ))}
                        </Box>
                        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                            <TextField
                                label="Nueva categoría"
                                value={nuevaCategoria}
                                onChange={e => setNuevaCategoria(e.target.value)}
                                size="small"
                                sx={{ bgcolor: '#232323', borderRadius: 2, input: { color: '#fff' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' } }}
                                InputProps={{ style: { color: '#fff' } }}
                            />
                            <Button
                              variant="contained"
                                sx={{ bgcolor: '#FFD700', color: '#232323', fontWeight: 700, borderRadius: 2, boxShadow: 0, '&:hover': { bgcolor: '#FFD700cc', color: '#232323' } }}
                                onClick={() => { if (nuevaCategoria.trim()) { addCategoria(nuevaCategoria.trim()); setNuevaCategoria(""); } }}
                          >
                              Agregar
                          </Button>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ bgcolor: '#181818', borderTop: 'none', p: 2, justifyContent: "flex-end" }}>
                    <Button onClick={onClose} variant="outlined" sx={{ color: '#FFD700', borderColor: '#FFD700', fontWeight: 700, borderRadius: 2, '&:hover': { bgcolor: '#232323', color: '#FFD700' } }}>Cerrar</Button>
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
        <Box sx={{ 
            overflowX: "auto",
            borderRadius: 3,
            border: "1px solid #333",
            bgcolor: "#1a1a1a"
        }}>
            <TableContainer sx={{ 
                bgcolor: "#1a1a1a", 
                borderRadius: 3,
                "& .MuiTable-root": {
                    borderCollapse: "separate",
                    borderSpacing: 0
                }
            }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ 
                            bgcolor: "#232323",
                            "& th": {
                                borderBottom: "2px solid #FFD700",
                                color: "#FFD700",
                                fontWeight: 700,
                                fontSize: "0.875rem",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                padding: "16px 12px",
                                position: "sticky",
                                top: 0,
                                zIndex: 10
                            }
                        }}>
                            <TableCell sx={{ width: 80, textAlign: "center" }}>
                                Imagen
                            </TableCell>
                            <TableCell sx={{ minWidth: 250 }}>
                                Producto
                            </TableCell>
                            <TableCell sx={{ width: 140, fontFamily: "monospace" }}>
                                Código
                            </TableCell>
                            <TableCell sx={{ width: 120 }}>
                                Marca
                            </TableCell>
                            <TableCell sx={{ width: 120 }}>
                                Categoría
                            </TableCell>
                            <TableCell sx={{ width: 100, textAlign: "center" }}>
                                Stock
                            </TableCell>
                            <TableCell sx={{ width: 80, textAlign: "center" }}>
                                Mín
                            </TableCell>
                            <TableCell sx={{ width: 80, textAlign: "center" }}>
                                Máx
                            </TableCell>
                            <TableCell sx={{ width: 120, textAlign: "center" }}>
                                Acciones
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedProducts.map((product, index) => (
                            <TableRow 
                                key={product.code + index}
                                sx={{ 
                                    bgcolor: selected.includes(product.code) ? "#333" : "transparent",
                                    borderBottom: "1px solid #333",
                                    transition: "all 0.2s ease",
                                    cursor: deleteMode ? "pointer" : "default",
                                    "&:hover": { 
                                        bgcolor: selected.includes(product.code) ? "#444" : "#2a2a2a",
                                        transform: "scale(1.01)",
                                        boxShadow: "0 4px 8px rgba(0,0,0,0.3)"
                                    },
                                    "&:last-child": {
                                        borderBottom: "none"
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
                                {/* Imagen */}
                                <TableCell sx={{ textAlign: "center", py: 2 }}>
                                    <Box sx={{ position: "relative", display: "inline-block", borderRadius: 2, overflow: "hidden", border: "2px solid #333", transition: "all 0.3s ease", "&:hover": { borderColor: "#FFD700", transform: "scale(1.1)" } }}>
                                        {typeof product.im === "string" && product.im ? (
                                            <img src={product.im} alt={product.name} style={{ width: 60, height: 60, objectFit: "cover", display: "block" }} />
                                        ) : product.im instanceof File ? (
                                            <img src={URL.createObjectURL(product.im)} alt={product.name} style={{ width: 60, height: 60, objectFit: "cover", display: "block" }} />
                                        ) : (
                                            (() => { const {icon, color} = getCategoryIcon(product.category); return (
                                                <Box sx={{ width: 60, height: 60, bgcolor: color, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</Box>
                                            ); })()
                                        )}
                                        {/* Indicador de estado */}
                                        <Box sx={{
                                            position: "absolute",
                                            top: 0,
                                            right: 0,
                                            width: 0,
                                            height: 0,
                                            borderStyle: "solid",
                                            borderWidth: "0 12px 12px 0",
                                            borderColor: product.stock === 0 ? "#f44336" : 
                                                        product.stock < product.stock_minimo ? "#ff9800" : 
                                                        product.stock > product.stock_maximo ? "#4caf50" : "#FFD700",
                                            borderRightColor: "transparent",
                                            borderBottomColor: "transparent"
                                        }} />
                                    </Box>
                                </TableCell>

                                {/* Información del producto */}
                                <TableCell sx={{ py: 2 }}>
                                    <Box>
                                        <Typography 
                                            variant="body1" 
                                            sx={{ 
                                                fontWeight: 600, 
                                                color: "#fff",
                                                mb: 0.5,
                                                fontSize: "0.95rem",
                                                lineHeight: 1.3
                                            }}
                                        >
                                            {product.name}
                                        </Typography>
                                        {product.description && (
                                            <Typography 
                                                variant="caption" 
                                                sx={{ 
                                                    color: "#aaa",
                                                    fontSize: "0.75rem",
                                                    lineHeight: 1.4,
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical",
                                                    overflow: "hidden"
                                                }}
                                            >
                                                {product.description}
                                            </Typography>
                                        )}
                                    </Box>
                                </TableCell>

                                {/* Código */}
                                <TableCell sx={{ 
                                    fontFamily: "monospace", 
                                    fontSize: "0.875rem",
                                    color: "#FFD700",
                                    fontWeight: 600
                                }}>
                                    {product.code}
                                </TableCell>

                                {/* Marca */}
                                <TableCell>
                                    <Chip
                                        label={product.brand}
                                        size="small"
                                        sx={{
                                            bgcolor: "#FFD700",
                                            color: "#232323",
                                            fontWeight: 600,
                                            fontSize: "0.75rem"
                                        }}
                                    />
                                </TableCell>

                                {/* Categoría */}
                                <TableCell>
                                    <Chip
                                        label={product.category}
                                        size="small"
                                        sx={{
                                            bgcolor: "#333",
                                            color: "#fff",
                                            fontWeight: 500,
                                            fontSize: "0.75rem"
                                        }}
                                    />
                                </TableCell>

                                {/* Stock actual */}
                                <TableCell sx={{ textAlign: "center" }}>
                                    <Box sx={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: 2,
                                        bgcolor: product.stock === 0 ? "rgba(244, 67, 54, 0.2)" : 
                                                product.stock < product.stock_minimo ? "rgba(255, 152, 0, 0.2)" : 
                                                product.stock > product.stock_maximo ? "rgba(76, 175, 80, 0.2)" : "rgba(255, 215, 0, 0.2)",
                                        border: `1px solid ${product.stock === 0 ? "#f44336" : 
                                                           product.stock < product.stock_minimo ? "#ff9800" : 
                                                           product.stock > product.stock_maximo ? "#4caf50" : "#FFD700"}`
                                    }}>
                                        <Box sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: "50%",
                                            bgcolor: product.stock === 0 ? "#f44336" : 
                                                    product.stock < product.stock_minimo ? "#ff9800" : 
                                                    product.stock > product.stock_maximo ? "#4caf50" : "#FFD700"
                                        }} />
                                        <Typography sx={{ 
                                            color: product.stock === 0 ? "#f44336" : 
                                                   product.stock < product.stock_minimo ? "#ff9800" : 
                                                   product.stock > product.stock_maximo ? "#4caf50" : "#FFD700",
                                            fontWeight: 700,
                                            fontSize: "0.875rem"
                                        }}>
                                            {product.stock}
                                        </Typography>
                                    </Box>
                                </TableCell>

                                {/* Stock mínimo */}
                                <TableCell sx={{ textAlign: "center" }}>
                                    <Typography sx={{ 
                                        color: "#FFD700", 
                                        fontWeight: 600,
                                        fontSize: "0.875rem"
                                    }}>
                                        {product.stock_minimo}
                                    </Typography>
                                </TableCell>

                                {/* Stock máximo */}
                                <TableCell sx={{ textAlign: "center" }}>
                                    <Typography sx={{ 
                                        color: "#FFD700", 
                                        fontWeight: 600,
                                        fontSize: "0.875rem"
                                    }}>
                                        {product.stock_maximo}
                                    </Typography>
                                </TableCell>

                                {/* Acciones */}
                                <TableCell sx={{ textAlign: "center" }}>
                                    <Box sx={{ 
                                        display: "flex", 
                                        gap: 1, 
                                        justifyContent: "center",
                                        alignItems: "center"
                                    }}>
                                        {!deleteMode ? (
                                            <>
                                                <Tooltip title="Ver detalles">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setProductoActual(product);
                                                            setModalDetailOpen(true);
                                                        }}
                                                        sx={{ 
                                                            color: "#FFD700",
                                                            bgcolor: "rgba(255, 215, 0, 0.1)",
                                                            "&:hover": {
                                                                bgcolor: "rgba(255, 215, 0, 0.2)"
                                                            }
                                                        }}
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
                                                        sx={{ 
                                                            color: "#4CAF50",
                                                            bgcolor: "rgba(76, 175, 80, 0.1)",
                                                            "&:hover": {
                                                                bgcolor: "rgba(76, 175, 80, 0.2)"
                                                            }
                                                        }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </>
                                        ) : (
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
    const StockAlerts = ({ productosVisibles }: { productosVisibles: ProductInt[] }) => {
        const lowStockProducts = productosVisibles.filter(p => p.stock < p.stock_minimo);
        const outOfStockProducts = productosVisibles.filter(p => p.stock === 0);
        
        if (lowStockProducts.length === 0) return null;

        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 1.5,
                    bgcolor: outOfStockProducts.length > 0 ? "#2d1a1a" : "#2d241a",
                    borderRadius: 2,
                    border: `1.5px solid ${outOfStockProducts.length > 0 ? "#f44336" : "#ff9800"}`,
                    mb: 2,
                    boxShadow: 2,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    '&:hover': {
                        bgcolor: outOfStockProducts.length > 0 ? '#4a1a1a' : '#4a3a1a',
                        boxShadow: 4,
                    },
                    minHeight: 56
                }}
                onClick={() => setAlertaFiltro('bajo')}
            >
                <WarningTwoToneIcon sx={{ color: outOfStockProducts.length > 0 ? "#f44336" : "#ff9800", fontSize: 32 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                            label={outOfStockProducts.length > 0 
                                ? `${outOfStockProducts.length} sin stock`
                                : `${lowStockProducts.length} bajo stock mínimo`}
                            sx={{
                                bgcolor: outOfStockProducts.length > 0 ? "#f44336" : "#ff9800",
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: 16,
                                px: 1.5
                            }}
                        />
                        <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>
                        {outOfStockProducts.length > 0 
                                ? "Productos agotados"
                                : "Productos bajo stock mínimo"}
                    </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: "#ccc", mt: 0.5, fontSize: 13 }}>
                        {outOfStockProducts.length > 0 
                            ? "Haz clic para ver solo los agotados"
                            : "Haz clic para ver solo los de stock bajo"}
                    </Typography>
                </Box>
            </Box>
        );
    };

    // Componente para alertas de stock alto
    const HighStockAlerts = ({ productosVisibles }: { productosVisibles: ProductInt[] }) => {
        const highStockProducts = productosVisibles.filter(p => p.stock > p.stock_maximo);
        
        if (highStockProducts.length === 0) return null;

        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 1.5,
                    bgcolor: "#1a2d1a",
                    borderRadius: 2,
                    border: `1.5px solid #4caf50`,
                    mb: 2,
                    boxShadow: 2,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    '&:hover': {
                        bgcolor: '#236e23',
                        boxShadow: 4,
                    },
                    minHeight: 56
                }}
                onClick={() => setAlertaFiltro('alto')}
            >
                <WarningTwoToneIcon sx={{ color: "#4caf50", fontSize: 32 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                            label={`${highStockProducts.length} sobre stock máximo`}
                            sx={{
                                bgcolor: "#4caf50",
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: 16,
                                px: 1.5
                            }}
                        />
                        <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>
                            Productos con exceso de stock
                    </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: "#ccc", mt: 0.5, fontSize: 13 }}>
                        Haz clic para ver solo los de stock alto
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
    // Ahora filtra productos según switches activos
    const productosParaMostrar = alertaFiltro === 'bajo'
        ? productos.filter((p: ProductInt) => p.stock < p.stock_minimo && marcasActivas[p.brand] !== false && categoriasActivas[p.category] !== false)
        : alertaFiltro === 'alto'
            ? productos.filter((p: ProductInt) => p.stock > p.stock_maximo && marcasActivas[p.brand] !== false && categoriasActivas[p.category] !== false)
            : filteredProducts.filter(p => marcasActivas[p.brand] !== false && categoriasActivas[p.category] !== false);
    // Mostrar advertencia si hay productos ocultos
    const productosOcultos = productos.filter(p => marcasActivas[p.brand] === false || categoriasActivas[p.category] === false);

    // PAGINACIÓN
    const [page, setPage] = useState(1);
    const itemsPerPage = 20;
    const totalPages = Math.ceil(productosParaMostrar.length / itemsPerPage);
    const paginatedProducts = productosParaMostrar.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    // FEEDBACK VISUAL
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });
    const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => setSnackbar({ open: true, message, severity });

    // Función para obtener ícono y color por categoría (mejorada con mapeo exacto y fallback)
    function getCategoryIcon(category?: string) {
        const cat = (category || '').toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").trim();
        // Mapeo exacto
        const exactMap: Record<string, { icon: React.ReactElement, color: string }> = {
            'martillo': { icon: <ConstructionIcon sx={{ fontSize: 44, color: '#fff' }} />, color: '#FF6B35' },
            'llave inglesa': { icon: <BuildIcon sx={{ fontSize: 44, color: '#fff' }} />, color: '#607D8B' },
            'herramientas': { icon: <Inventory2Icon sx={{ fontSize: 44, color: '#fff' }} />, color: '#FFA726' },
            'tornillos': { icon: <HardwareIcon sx={{ fontSize: 44, color: '#fff' }} />, color: '#90A4AE' },
            'clavos': { icon: <HardwareIcon sx={{ fontSize: 44, color: '#fff' }} />, color: '#B0BEC5' },
            'cinta metrica': { icon: <StraightenIcon sx={{ fontSize: 44, color: '#fff' }} />, color: '#FFD700' },
            'taladro': { icon: <BuildIcon sx={{ fontSize: 44, color: '#fff' }} />, color: '#4ECDC4' },
            'planchas': { icon: <LayersIcon sx={{ fontSize: 44, color: '#fff' }} />, color: '#95A5A6' },
            'electricidad': { icon: <BoltIcon sx={{ fontSize: 44, color: '#fff' }} />, color: '#FFE66D' },
            'plomeria': { icon: <PlumbingIcon sx={{ fontSize: 44, color: '#fff' }} />, color: '#45B7D1' },
            'construccion': { icon: <ConstructionIcon sx={{ fontSize: 44, color: '#fff' }} />, color: '#95A5A6' },
            'jardin': { icon: <YardIcon sx={{ fontSize: 44, color: '#fff' }} />, color: '#2ECC71' },
            'automotriz': { icon: <DirectionsCarIcon sx={{ fontSize: 44, color: '#fff' }} />, color: '#E74C3C' },
            'pintura': { icon: <FormatPaintIcon sx={{ fontSize: 44, color: '#fff' }} />, color: '#9B59B6' },
        };
        if (exactMap[cat]) return exactMap[cat];
        // Fallback por palabras clave
        if (cat.includes('herramienta')) return { icon: <BuildIcon sx={{ fontSize: 44, color: '#fff' }} />, color: '#FF6B35' };
        if (cat.includes('martillo')) return { icon: <ConstructionIcon sx={{ fontSize: 44, color: '#fff' }} />, color: '#FF6B35' };
        if (cat.includes('tornillo')) return { icon: <HardwareIcon sx={{ fontSize: 44, color: '#fff' }} />, color: '#90A4AE' };
        if (cat.includes('clavo')) return { icon: <HardwareIcon sx={{ fontSize: 44, color: '#fff' }} />, color: '#B0BEC5' };
        if (cat.includes('cinta metrica')) return { icon: <StraightenIcon sx={{ fontSize: 44, color: '#fff' }} />, color: '#FFD700' };
        if (cat.includes('taladro')) return { icon: <BuildIcon sx={{ fontSize: 44, color: '#fff' }} />, color: '#4ECDC4' };
        if (cat.includes('planchas')) return { icon: <LayersIcon sx={{ fontSize: 44, color: '#fff' }} />, color: '#95A5A6' };
        if (cat.includes('electricidad')) return { icon: <BoltIcon sx={{ fontSize: 44, color: '#fff' }} />, color: '#FFE66D' };
        if (cat.includes('plomeria')) return { icon: <PlumbingIcon sx={{ fontSize: 44, color: '#fff' }} />, color: '#45B7D1' };
        if (cat.includes('construccion')) return { icon: <ConstructionIcon sx={{ fontSize: 44, color: '#fff' }} />, color: '#95A5A6' };
        if (cat.includes('jardin')) return { icon: <YardIcon sx={{ fontSize: 44, color: '#fff' }} />, color: '#2ECC71' };
        if (cat.includes('automotriz')) return { icon: <DirectionsCarIcon sx={{ fontSize: 44, color: '#fff' }} />, color: '#E74C3C' };
        if (cat.includes('pintura')) return { icon: <FormatPaintIcon sx={{ fontSize: 44, color: '#fff' }} />, color: '#9B59B6' };
        // Default
        return { icon: <Inventory2Icon sx={{ fontSize: 44, color: '#fff' }} />, color: '#34495E' };
    }


    return (
        <Layout>
            <Box sx={{ maxWidth: 1200, margin: "0 auto", padding: 3 }}>
                <Paper elevation={3} sx={{ padding: 4, background: "#232323" }}>
                    <Typography variant="h4" sx={{ color: "#FFD700", mb: 2, fontWeight: 700 }}>
                        Inventario de Productos
                    </Typography>
                    {/* Alertas de productos ocultos, stock bajo y stock alto */}
                    {productosOcultos.length > 0 && (
                        <Alert severity="warning" sx={{ mb: 2, bgcolor: '#181818', color: '#FFD700', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                            {productosOcultos.length} producto(s) están ocultos porque su marca o categoría está desactivada.
                            <Button
                                variant="outlined"
                                size="small"
                                sx={{ ml: 3, color: '#FFD700', borderColor: '#FFD700', fontWeight: 700, borderRadius: 2, '&:hover': { bgcolor: '#232323', color: '#FFD700' } }}
                                onClick={() => {
                                    // Reactivar todas las marcas y categorías
                                    setMarcasActivas(prev => {
                                        const nuevo = { ...prev };
                                        Object.keys(nuevo).forEach(k => { nuevo[k] = true; });
                                        return nuevo;
                                    });
                                    setCategoriasActivas(prev => {
                                        const nuevo = { ...prev };
                                        Object.keys(nuevo).forEach(k => { nuevo[k] = true; });
                                        return nuevo;
                                    });
                                }}
                            >
                                Volver a mostrar todo
                            </Button>
                        </Alert>
                    )}
                    <StockAlerts productosVisibles={productosParaMostrar} />
                    <HighStockAlerts productosVisibles={productosParaMostrar} />
                    {/* Barra de acciones */}
                    <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center", flexWrap: "wrap" }}>
                        {/* Acciones principales */}
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
                            startIcon={<AutoFixHighIcon />}
                            variant="contained"
                            sx={{ bgcolor: "#4CAF50", color: "#fff", fontWeight: 600 }}
                            onClick={() => setModalReactivarOpen(true)}
                        >
                            Reactivar
                        </Button>
                        {/* Toggle de vista cards/tabla */}
                        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                            <Box sx={{ display: 'flex', gap: 1, bgcolor: '#232323', borderRadius: 2, p: 0.5, boxShadow: 1 }}>
                                <IconButton
                                    onClick={() => setViewMode('cards')}
                                    sx={{ 
                                        color: viewMode === 'cards' ? '#FFD700' : '#888',
                                        bgcolor: viewMode === 'cards' ? '#181818' : 'transparent',
                                        borderRadius: 2,
                                        border: viewMode === 'cards' ? '2px solid #FFD700' : '2px solid transparent',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <ViewModuleIcon />
                                </IconButton>
                                <IconButton
                                    onClick={() => setViewMode('table')}
                                    sx={{ 
                                        color: viewMode === 'table' ? '#FFD700' : '#888',
                                        bgcolor: viewMode === 'table' ? '#181818' : 'transparent',
                                        borderRadius: 2,
                                        border: viewMode === 'table' ? '2px solid #FFD700' : '2px solid transparent',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <ViewListIcon />
                                </IconButton>
                        </Box>
                        </Box>
                        {/* Acciones secundarias */}
                        <Button
                            variant="contained"
                            sx={{ bgcolor: "#FFD700", color: "#232323", fontWeight: 600 }}
                            onClick={() => setModalGestionOpen(true)}
                        >
                            Gestionar marcas/categorías
                        </Button>
                        <Button
                            startIcon={<TuneIcon />}
                            variant="contained"
                            sx={{ bgcolor: "#FFD700", color: "#232323", fontWeight: 600 }}
                            onClick={() => setDrawerOpen(true)}
                        >
                            Filtros avanzados
                        </Button>
                        {/* Buscador */}
                        <Box sx={{ display: "flex", alignItems: "center", bgcolor: "#fff", borderRadius: 2, px: 2, ml: 2 }}>
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
                                <Box sx={{ 
                                    display: "grid", 
                                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
                                    gap: 3, 
                                    justifyContent: "center",
                                    padding: 2
                                }}>
                                    {paginatedProducts.map((product, idx) => (
                                        <Card
                                            key={product.code + idx}
                                            sx={{
                                                bgcolor: "#1a1a1a",
                                                color: "#fff",
                                                cursor: deleteMode ? "pointer" : "default",
                                                border: selected.includes(product.code) ? "3px solid #FFD700" : "1px solid #333",
                                                borderRadius: 3,
                                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                                position: "relative",
                                                overflow: "hidden",
                                                "&:hover": {
                                                    transform: "translateY(-8px) scale(1.02)",
                                                    boxShadow: "0 12px 24px rgba(0,0,0,0.4)",
                                                    borderColor: "#FFD700",
                                                },
                                                "&::before": {
                                                    content: '""',
                                                    position: "absolute",
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    height: "4px",
                                                    background: product.stock === 0 ? "#f44336" : 
                                                               product.stock < product.stock_minimo ? "#ff9800" : 
                                                               product.stock > product.stock_maximo ? "#4caf50" : "#FFD700",
                                                    zIndex: 1
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
                                                        top: 12,
                                                        left: 12,
                                                        zIndex: 10,
                                                        color: "#FFD700",
                                                        '&.Mui-checked': {
                                                            color: "#FFD700",
                                                        },
                                                    }}
                                                />
                                            )}
                                            
                                            {/* Imagen del producto */}
                                            <Box sx={{ position: "relative", height: 200 }}>
                                                {typeof product.im === "string" && product.im ? (
                                                <CardMedia
                                                    component="img"
                                                        image={product.im}
                                                    alt={product.name}
                                                        sx={{ height: "100%", objectFit: "cover", transition: "transform 0.3s ease", "&:hover": { transform: "scale(1.05)" } }}
                                                    />
                                                ) : product.im instanceof File ? (
                                                    <CardMedia
                                                        component="img"
                                                        image={URL.createObjectURL(product.im)}
                                                        alt={product.name}
                                                        sx={{ height: "100%", objectFit: "cover", transition: "transform 0.3s ease", "&:hover": { transform: "scale(1.05)" } }}
                                                    />
                                                ) : (
                                                    (() => { const {icon, color} = getCategoryIcon(product.category); return (
                                                        <Box sx={{ width: '100%', height: 200, bgcolor: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</Box>
                                                    ); })()
                                                )}
                                            </Box>
                                                
                                                {/* Overlay con información rápida */}
                                                <Box sx={{
                                                    position: "absolute",
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    background: "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 50%, rgba(0,0,0,0.8) 100%)",
                                                    opacity: 0,
                                                    transition: "opacity 0.3s ease",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "space-between",
                                                    p: 2,
                                                    "&:hover": {
                                                        opacity: 1
                                                    }
                                                }}>
                                                    {/* Código del producto */}
                                                    <Chip
                                                        label={product.code}
                                                        size="small"
                                                        sx={{
                                                            alignSelf: "flex-start",
                                                            bgcolor: "rgba(0,0,0,0.8)",
                                                            color: "#FFD700",
                                                            fontWeight: 600,
                                                            fontSize: "0.7rem"
                                                        }}
                                                    />
                                                    
                                                    {/* Stock actual */}
                                                    <Box sx={{ alignSelf: "flex-end" }}>
                                                        <Chip
                                                            label={`${product.stock} unidades`}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: product.stock === 0 ? "#f44336" : 
                                                                        product.stock < product.stock_minimo ? "#ff9800" : 
                                                                        product.stock > product.stock_maximo ? "#4caf50" : "#2E7D32",
                                                                color: "#fff",
                                                                fontWeight: 700,
                                                                fontSize: "0.8rem"
                                                            }}
                                                        />
                                                </Box>
                                            </Box>
                                            
                                            {/* Contenido de la card */}
                                            <CardContent sx={{ p: 3 }}>
                                                {/* Nombre del producto */}
                                                <Typography 
                                                    variant="h6" 
                                                    component="div"
                                                    sx={{ 
                                                        fontSize: "1.1rem", 
                                                        color: "#fff", 
                                                        fontWeight: 700,
                                                        mb: 1,
                                                        lineHeight: 1.3,
                                                        height: "2.6rem",
                                                        overflow: "hidden",
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: "vertical"
                                                    }}
                                                >
                                                    {product.name}
                                                </Typography>
                                                
                                                {/* Marca y categoría */}
                                                <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                                                    <Chip
                                                        label={product.brand}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: "#FFD700",
                                                            color: "#232323",
                                                            fontWeight: 600,
                                                            fontSize: "0.75rem"
                                                        }}
                                                    />
                                                    <Chip
                                                        label={product.category}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: "#333",
                                                            color: "#fff",
                                                            fontWeight: 500,
                                                            fontSize: "0.75rem"
                                                        }}
                                                    />
                                                </Box>
                                                
                                                {/* Indicador de stock mejorado */}
                                                <Box sx={{ mb: 2 }}>
                                                    <StockIndicator stock={product.stock} stockMinimo={product.stock_minimo} />
                                                </Box>
                                                
                                                {/* Información adicional */}
                                                <Box sx={{ 
                                                    display: "flex", 
                                                    justifyContent: "space-between",
                                                    fontSize: "0.75rem",
                                                    color: "#888"
                                                }}>
                                                    <span>Mín: {product.stock_minimo}</span>
                                                    <span>Máx: {product.stock_maximo}</span>
                                                </Box>
                                                
                                                {/* Descripción truncada */}
                                                {product.description && (
                                                    <Typography 
                                                        variant="body2" 
                                                        sx={{ 
                                                            color: "#aaa", 
                                                            mt: 1,
                                                            fontSize: "0.8rem",
                                                            lineHeight: 1.4,
                                                            height: "2.8rem",
                                                            overflow: "hidden",
                                                            display: "-webkit-box",
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: "vertical"
                                                        }}
                                                    >
                                                        {product.description}
                                                    </Typography>
                                                )}
                                            </CardContent>
                                            
                                            {/* Botones de acción (solo en hover) */}
                                            {!deleteMode && (
                                                <Box sx={{
                                                    position: "absolute",
                                                    top: 12,
                                                    right: 12,
                                                    opacity: 0,
                                                    transition: "opacity 0.3s ease",
                                                    "&:hover": {
                                                        opacity: 1
                                                    }
                                                }}>
                                                    <IconButton
                                                        size="small"
                                                        sx={{
                                                            bgcolor: "rgba(0,0,0,0.8)",
                                                            color: "#FFD700",
                                                            "&:hover": {
                                                                bgcolor: "#FFD700",
                                                                color: "#232323"
                                                            }
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setProductoActual(product);
                                                            setModalDetailOpen(true);
                                                        }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            )}
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
                    productosActuales={productos}
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
                        productosActuales={productos}
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
            <GestionarModal
                open={modalGestionOpen}
                onClose={() => setModalGestionOpen(false)}
                marcasActivas={marcasActivas}
                setMarcasActivas={setMarcasActivas}
                categoriasActivas={categoriasActivas}
                setCategoriasActivas={setCategoriasActivas}
                handleDeleteMarca={handleDeleteMarca}
                handleDeleteCategoria={handleDeleteCategoria}
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
            {/* Modal para motivo de ajuste */}
            <MotivoAjusteModal
              open={modalMotivoOpen}
              productoAjuste={productoAjuste}
              onClose={() => setModalMotivoOpen(false)}
              onConfirm={handleConfirmarAjuste}
            />
            {/* Panel lateral de filtros avanzados */}
            <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <Box sx={{ width: 340, p: 3, bgcolor: "#181818", height: "100%", display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ color: "#FFD700", flex: 1, fontWeight: 700, letterSpacing: 1 }}>Filtros avanzados</Typography>
                        <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: '#FFD700', fontSize: 28 }}>
                            ×
                        </IconButton>
                    </Box>
                    <Divider sx={{ mb: 2, bgcolor: '#FFD700', height: 2 }} />
                    <TextField
                        label="Stock mínimo"
                        type="number"
                        value={filtrosAvanzados.stockMinimo}
                        onChange={e => setFiltrosAvanzados(f => ({ ...f, stockMinimo: e.target.value }))}
                        fullWidth
                        sx={{ mb: 2, 
                            '& .MuiInputBase-root': { bgcolor: '#232323', color: '#FFD700', borderRadius: 2 },
                            '& .MuiInputLabel-root': { color: '#FFD700' },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#FFD700' },
                        }}
                        inputProps={{ min: 0 }}
                    />
                    <TextField
                        label="Stock máximo"
                        type="number"
                        value={filtrosAvanzados.stockMaximo}
                        onChange={e => setFiltrosAvanzados(f => ({ ...f, stockMaximo: e.target.value }))}
                        fullWidth
                        sx={{ mb: 2, 
                            '& .MuiInputBase-root': { bgcolor: '#232323', color: '#FFD700', borderRadius: 2 },
                            '& .MuiInputLabel-root': { color: '#FFD700' },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#FFD700' },
                        }}
                        inputProps={{ min: 0 }}
                    />
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel sx={{ color: '#FFD700', bgcolor: '#232323', px: 0.5, borderRadius: 1 }}>Estado de stock</InputLabel>
                        <Select
                            value={filtrosAvanzados.stockStatus}
                            label="Estado de stock"
                            onChange={e => setFiltrosAvanzados(f => ({ ...f, stockStatus: e.target.value as any }))}
                            sx={{ color: '#FFD700', bgcolor: '#232323', borderRadius: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#FFD700' } }}
                        >
                            <MenuItem value="">Todos</MenuItem>
                            <MenuItem value="sin_stock">Sin stock</MenuItem>
                            <MenuItem value="bajo">Bajo</MenuItem>
                            <MenuItem value="normal">Normal</MenuItem>
                            <MenuItem value="alto">Alto</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel sx={{ color: '#FFD700', bgcolor: '#232323', px: 0.5, borderRadius: 1 }}>Ordenar por</InputLabel>
                        <Select
                            value={filtrosAvanzados.ordenarPor}
                            label="Ordenar por"
                            onChange={e => setFiltrosAvanzados(f => ({ ...f, ordenarPor: e.target.value as any }))}
                            sx={{ color: '#FFD700', bgcolor: '#232323', borderRadius: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#FFD700' } }}
                        >
                            <MenuItem value="stock">Stock</MenuItem>
                            <MenuItem value="nombre">Nombre</MenuItem>
                            <MenuItem value="marca">Marca</MenuItem>
                            <MenuItem value="categoria">Categoría</MenuItem>
                            <MenuItem value="codigo">Código</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel sx={{ color: '#FFD700', bgcolor: '#232323', px: 0.5, borderRadius: 1 }}>Orden</InputLabel>
                        <Select
                            value={filtrosAvanzados.orden}
                            label="Orden"
                            onChange={e => setFiltrosAvanzados(f => ({ ...f, orden: e.target.value as any }))}
                            sx={{ color: '#FFD700', bgcolor: '#232323', borderRadius: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#FFD700' } }}
                        >
                            <MenuItem value="asc">Ascendente</MenuItem>
                            <MenuItem value="desc">Descendente</MenuItem>
                        </Select>
                    </FormControl>
                    <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                        <Button
                            variant="contained"
                            sx={{ bgcolor: '#FFD700', color: '#232323', fontWeight: 700, flex: 1, boxShadow: 2, borderRadius: 2 }}
                            onClick={() => setDrawerOpen(false)}
                        >
                            Aplicar
                        </Button>
                        <Button
                            variant="outlined"
                            sx={{ borderColor: '#FFD700', color: '#FFD700', fontWeight: 700, flex: 1, borderRadius: 2 }}
                            onClick={() => setFiltrosAvanzados({ stockMinimo: '', stockMaximo: '', stockStatus: '', ordenarPor: 'stock', orden: 'desc' })}
                        >
                            Limpiar
                        </Button>
                    </Box>
                </Box>
            </Drawer>
            
            {/* Modal para reactivar productos desactivados */}
            <ReactivarProductosModal
                isOpen={modalReactivarOpen}
                onClose={() => setModalReactivarOpen(false)}
                onProductosReactivados={() => {
                    // Recargar productos después de reactivar
                    fetchProductos(ubicacionId);
                    setModalReactivarOpen(false);
                }}
            />
        </Layout>
    );
}

// Asegúrate de pasar props marcas y categorias a ProductForm y FiltroModal
// y que estos usen solo selects con los arrays recibidos.