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
    im: File | string | null;
}

interface InventariosState {
    inventarios: { [ubicacionId: string]: ProductInt[] };
    marcas: { [ubicacionId: string]: { id: number; nombre: string }[] };
    categorias: { [ubicacionId: string]: { id: number; nombre: string }[] };
    addProducto: (ubicacionId: string, producto: ProductInt) => Promise<void>;
    updateProducto: (ubicacionId: string, producto: ProductInt) => Promise<void>;
    deleteProductos: (ubicacionId: string, ids: string[]) => Promise<void>;
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
                try {
                    console.log('DEBUG - fetchProductos llamado con ubicacionId:', ubicacionId);
                    const productos = await productoService.getProductos(ubicacionId);
                    console.log('DEBUG - Productos recibidos del servicio:', productos);
                    const productosMapeados = productos.map((p: any) => ({
                        id_prodc: p.id_prodc,
                        name: p.nombre_prodc,
                        code: p.codigo_interno,
                        brand: p.marca_nombre || p.marca_fk,
                        category: p.categoria_nombre || p.categoria_fk,
                        description: p.descripcion_prodc,
                        stock: p.stock ?? 0,
                        im: null
                    }));
                    console.log('DEBUG - Productos mapeados:', productosMapeados);
                    set(state => ({
                        inventarios: {
                            ...state.inventarios,
                            [ubicacionId]: productosMapeados
                        }
                    }));
                    console.log('DEBUG - Estado actualizado para ubicacionId:', ubicacionId);
                } catch (error) {
                    console.error('Error fetching productos:', error);
                }
            },

            fetchMarcas: async (ubicacionId: string) => {
                try {
                    console.log('DEBUG - fetchMarcas llamado con ubicacionId:', ubicacionId);
                    const marcas = await productoService.getMarcas();
                    console.log('DEBUG - Marcas recibidas del servicio:', marcas);
                    const marcasMapeadas = marcas.map((m: any) => ({
                        id: m.id_mprod,
                        nombre: m.nombre_mprod
                    }));
                    console.log('DEBUG - Marcas mapeadas:', marcasMapeadas);
                    set(state => ({
                        marcas: {
                            ...state.marcas,
                            [ubicacionId]: marcasMapeadas
                        }
                    }));
                    console.log('DEBUG - Estado de marcas actualizado para ubicacionId:', ubicacionId);
                } catch (error) {
                    console.error('Error fetching marcas:', error);
                }
            },

            fetchCategorias: async (ubicacionId: string) => {
                try {
                    console.log('DEBUG - fetchCategorias llamado con ubicacionId:', ubicacionId);
                    const categorias = await productoService.getCategorias();
                    console.log('DEBUG - Categorías recibidas del servicio:', categorias);
                    const categoriasMapeadas = categorias.map((c: any) => ({
                        id: c.id,
                        nombre: c.nombre
                    }));
                    console.log('DEBUG - Categorías mapeadas:', categoriasMapeadas);
                    set(state => ({
                        categorias: {
                            ...state.categorias,
                            [ubicacionId]: categoriasMapeadas
                        }
                    }));
                    console.log('DEBUG - Estado de categorías actualizado para ubicacionId:', ubicacionId);
                } catch (error) {
                    console.error('Error fetching categorias:', error);
                }
            },

            addProducto: async (ubicacionId: string, producto: ProductInt) => {
                try {
                    const productoConStock = { ...producto, stock: producto.stock ?? 0 };
                    await productoService.createProducto(productoConStock, ubicacionId);
                    await get().fetchProductos(ubicacionId);
                    set(state => ({
                        inventarios: {
                            ...state.inventarios,
                            [ubicacionId]: [
                                ...(state.inventarios[ubicacionId] || []),
                                productoConStock
                            ]
                        }
                    }));
                } catch (error) {
                    console.error('Error adding producto:', error);
                }
            },

            updateProducto: async (ubicacionId: string, producto: ProductInt) => {
                try {
                    if (producto.id_prodc) {
                        await productoService.updateProducto(producto.id_prodc.toString(), producto, ubicacionId);
                        await get().fetchProductos(ubicacionId);

                        set(state => ({
                            inventarios: {
                                ...state.inventarios,
                                [ubicacionId]: (state.inventarios[ubicacionId] || []).map(p =>
                                    p.id_prodc === producto.id_prodc ? { ...p, ...producto } : p
                                )
                            }
                        }));
                    }
                } catch (error) {
                    console.error('Error updating producto:', error);
                }
            },

            deleteProductos: async (ubicacionId: string, ids: string[]) => {
                try {
                    await Promise.all(ids.map(id => productoService.deleteProducto(id)));
                    await get().fetchProductos(ubicacionId);

                    set(state => ({
                        inventarios: {
                            ...state.inventarios,
                            [ubicacionId]: (state.inventarios[ubicacionId] || []).filter(p =>
                                !ids.includes(p.id_prodc?.toString() || '')
                            )
                        }
                    }));
                } catch (error) {
                    console.error('Error deleting productos:', error);
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