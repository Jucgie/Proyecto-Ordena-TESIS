import { create } from "zustand";
import { persist } from "zustand/middleware";
import { productoService } from '../services/productoService';

export interface ProductInt {
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
    marcas: { [ubicacionId: string]: string[] };
    categorias: { [ubicacionId: string]: string[] };
    addProducto: (ubicacionId: string, producto: ProductInt) => Promise<void>;
    updateProducto: (ubicacionId: string, producto: ProductInt) => Promise<void>;
    deleteProductos: (ubicacionId: string, codes: string[]) => Promise<void>;
    addMarca: (ubicacionId: string, marca: string) => Promise<void>;
    deleteMarca: (ubicacionId: string, marca: string) => Promise<void>;
    addCategoria: (ubicacionId: string, categoria: string) => Promise<void>;
    deleteCategoria: (ubicacionId: string, categoria: string) => Promise<void>;
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
                    const productos = await productoService.getProductos(ubicacionId);
                    set(state => ({
                        inventarios: {
                            ...state.inventarios,
                            [ubicacionId]: productos.map((p: any) => ({
                                name: p.nombre_prodc,
                                code: p.codigo_interno,
                                brand: p.marca_fk,
                                category: p.categoria_fk,
                                description: p.descripcion_prodc,
                                stock: 0,
                                im: null
                            }))
                        }
                    }));
                } catch (error) {
                    console.error('Error fetching productos:', error);
                }
            },

            fetchMarcas: async (ubicacionId: string) => {
                try {
                    const marcas = await productoService.getMarcas();
                    set(state => ({
                        marcas: {
                            ...state.marcas,
                            [ubicacionId]: marcas.map((m: any) => m.nombre_mprod)
                        }
                    }));
                } catch (error) {
                    console.error('Error fetching marcas:', error);
                }
            },

            fetchCategorias: async (ubicacionId: string) => {
                try {
                    const categorias = await productoService.getCategorias();
                    set(state => ({
                        categorias: {
                            ...state.categorias,
                            [ubicacionId]: categorias.map((c: any) => c.nombre)
                        }
                    }));
                } catch (error) {
                    console.error('Error fetching categorias:', error);
                }
            },

            addProducto: async (ubicacionId: string, producto: ProductInt) => {
                try {
                    await productoService.createProducto(producto, ubicacionId);
                    await get().fetchProductos(ubicacionId);
                } catch (error) {
                    console.error('Error adding producto:', error);
                }
            },

            updateProducto: async (ubicacionId: string, producto: ProductInt) => {
                try {
                    await productoService.updateProducto(producto.code, producto);
                    await get().fetchProductos(ubicacionId);
                } catch (error) {
                    console.error('Error updating producto:', error);
                }
            },

            deleteProductos: async (ubicacionId: string, codes: string[]) => {
                try {
                    await Promise.all(codes.map(code => 
                        productoService.deleteProducto(code)
                    ));
                    await get().fetchProductos(ubicacionId);
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

            deleteMarca: async (ubicacionId: string, marca: string) => {
                try {
                    await productoService.deleteMarca(marca);
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

            deleteCategoria: async (ubicacionId: string, categoria: string) => {
                try {
                    await productoService.deleteCategoria(categoria);
                    await get().fetchCategorias(ubicacionId);
                } catch (error) {
                    console.error('Error deleting categoria:', error);
                }
            },
        }),
        { name: "inventarios-storage" }
    )
);