import { create } from "zustand";
import { persist } from "zustand/middleware";
import { productoService } from '../services/productoService';

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

// Helper para mapear la respuesta del backend al estado del frontend
const mapBackendToFrontend = (p: any): ProductInt => {
    console.log("🔍 DEBUG - mapBackendToFrontend - Producto original:", p);
    const mapeado = {
        id_prodc: p.id_prodc,
        name: p.nombre_prodc,
        code: p.codigo_interno,
        brand: p.marca_nombre || p.marca_fk,
        category: p.categoria_nombre || p.categoria_fk,
        description: p.descripcion_prodc,
        stock: p.stock ?? 0,
        stock_minimo: p.stock_minimo ?? 5,
        stock_maximo: p.stock_maximo ?? 100,
        im: null, // La imagen se maneja localmente
    };
    console.log("🔍 DEBUG - mapBackendToFrontend - Producto mapeado:", mapeado);
    return mapeado;
};

interface InventariosState {
    inventarios: { [ubicacionId: string]: ProductInt[] };
    marcas: { [ubicacionId: string]: { id: number; nombre: string }[] };
    categorias: { [ubicacionId: string]: { id: number; nombre: string }[] };
    addProducto: (ubicacionId: string, producto: ProductInt) => Promise<void>;
    updateProducto: (ubicacionId: string, producto: ProductInt) => Promise<void>;
    desactivarProductos: (ubicacionId: string, ids: string[]) => Promise<void>;
    addMarca: (ubicacionId: string, marca: string) => Promise<void>;
    deleteMarca: (ubicacionId: string, marcaId: number) => Promise<void>;
    addCategoria: (ubicacionId: string, categoria: string) => Promise<void>;
    deleteCategoria: (ubicacionId: string, categoriaId: number) => Promise<void>;
    fetchProductos: (ubicacionId: string) => Promise<void>;
    fetchMarcas: (ubicacionId: string) => Promise<void>;
    fetchCategorias: (ubicacionId: string) => Promise<void>;
}

export const useInventariosStore = create<InventariosState>()(
    persist(
        (set, get) => ({
            inventarios: {},
            marcas: {},
            categorias: {},

            fetchProductos: async (ubicacionId: string) => {
                console.log("🔍 DEBUG - Store - fetchProductos llamado con ubicacionId:", ubicacionId);
                try {
                    const productos = await productoService.getProductosActivos(ubicacionId);
                    console.log("🔍 DEBUG - Store - Respuesta del backend:", productos);
                    // Usamos el helper para mapear
                    const productosMapeados = productos.map(mapBackendToFrontend);
                    console.log("🔍 DEBUG - Store - Productos mapeados:", productosMapeados);
                    set(state => ({
                        inventarios: {
                            ...state.inventarios,
                            [ubicacionId]: productosMapeados
                        }
                    }));
                    console.log("🔍 DEBUG - Store - Estado actualizado para ubicacionId:", ubicacionId);
                } catch (error) {
                    console.error('Error fetching productos:', error);
                }
            },

            fetchMarcas: async (ubicacionId: string) => {
                try {
                    const marcas = await productoService.getMarcas();
                    const marcasMapeadas = marcas.map((m: any) => ({
                        id: m.id_mprod,
                        nombre: m.nombre_mprod
                    }));
                    set(state => ({
                        marcas: {
                            ...state.marcas,
                            [ubicacionId]: marcasMapeadas
                        }
                    }));
                } catch (error) {
                }
            },

            fetchCategorias: async (ubicacionId: string) => {
                try {
                    const categorias = await productoService.getCategorias();
                    const categoriasMapeadas = categorias.map((c: any) => ({
                        id: c.id,
                        nombre: c.nombre
                    }));
                    set(state => ({
                        categorias: {
                            ...state.categorias,
                            [ubicacionId]: categoriasMapeadas
                        }
                    }));
                } catch (error) {
                    console.error('Error fetching categorias:', error);
                }
            },

            addProducto: async (ubicacionId: string, producto: ProductInt) => {
                try {
                    const nuevoProductoBackend = await productoService.createProducto(producto, ubicacionId);
                    const nuevoProductoFrontend = mapBackendToFrontend(nuevoProductoBackend);
                    set(state => ({
                        inventarios: {
                            ...state.inventarios,
                            [ubicacionId]: [...(state.inventarios[ubicacionId] || []), nuevoProductoFrontend],
                        },
                    }));
                } catch (error) {
                    console.error('Error adding producto:', error);
                }
            },

            updateProducto: async (ubicacionId: string, producto: ProductInt) => {
                try {
                    if (producto.id_prodc) {
                        const productoActualizadoBackend = await productoService.updateProducto(producto.id_prodc.toString(), producto, ubicacionId);
                        const productoActualizadoFrontend = mapBackendToFrontend(productoActualizadoBackend);
                        set(state => ({
                            inventarios: {
                                ...state.inventarios,
                                [ubicacionId]: (state.inventarios[ubicacionId] || []).map(p =>
                                    p.id_prodc === productoActualizadoFrontend.id_prodc ? productoActualizadoFrontend : p
                                ),
                            },
                        }));
                    }
                } catch (error) {
                    console.error('Error updating producto:', error);
                }
            },

            desactivarProductos: async (ubicacionId: string, ids: string[]) => {
                try {
                    if (ids.length > 0) {
                        await Promise.all(ids.map(id => productoService.desactivarProducto(id)));
                    }
                    // Una vez desactivados en el backend, los quitamos del estado local.
                    set(state => ({
                        inventarios: {
                            ...state.inventarios,
                            [ubicacionId]: (state.inventarios[ubicacionId] || []).filter(p =>
                                !ids.includes(p.id_prodc?.toString() || '')
                            ),
                        },
                    }));
                } catch (error) {
                    console.error('Error desactivando productos:', error);
                    // Si hay un error, refrescamos desde el servidor para garantizar consistencia.
                    await get().fetchProductos(ubicacionId);
                }
            },

            addMarca: async (ubicacionId: string, marca: string) => {
                try {
                    await productoService.addMarca(marca);
                    await get().fetchMarcas(ubicacionId);
                } catch (error) {
                    console.error('Error adding marca:', error);
                }
            },

            deleteMarca: async (ubicacionId: string, marcaId: number) => {
                try {
                    await productoService.deleteMarca(marcaId.toString());
                    await get().fetchMarcas(ubicacionId);
                } catch (error) {
                    console.error('Error deleting marca:', error);
                }
            },

            addCategoria: async (ubicacionId: string, categoria: string) => {
                try {
                    await productoService.addCategoria(categoria);
                    await get().fetchCategorias(ubicacionId);
                } catch (error) {
                    console.error('Error adding categoria:', error);
                }
            },

            deleteCategoria: async (ubicacionId: string, categoriaId: number) => {
                try {
                    await productoService.deleteCategoria(categoriaId.toString());
                    await get().fetchCategorias(ubicacionId);
                } catch (error) {
                    console.error('Error deleting categoria:', error);
                }
            },
        }),
        { name: "inventarios-storage" }
    )
);