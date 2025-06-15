import { create } from "zustand";
import { persist } from "zustand/middleware";

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
    addProducto: (ubicacionId: string, producto: ProductInt) => void;
    updateProducto: (ubicacionId: string, producto: ProductInt) => void;
    deleteProductos: (ubicacionId: string, codes: string[]) => void;
    addMarca: (ubicacionId: string, marca: string) => void;
    deleteMarca: (ubicacionId: string, marca: string) => void;
    addCategoria: (ubicacionId: string, categoria: string) => void;
    deleteCategoria: (ubicacionId: string, categoria: string) => void;
}

export const useInventariosStore = create<InventariosState>()(
    persist(
        (set, get) => ({
            inventarios: {},
            marcas: {},
            categorias: {},
            addProducto: (ubicacionId, producto) =>
                set(state => {
                const inventario = state.inventarios[ubicacionId] || [];
                const idx = inventario.findIndex(p => p.code === producto.code);
                if (idx !== -1) {
                    // Sumar stock si ya existe
                    const actualizado = [...inventario];
                    actualizado[idx] = {
                        ...actualizado[idx],
                        stock: actualizado[idx].stock + producto.stock
                    };
                    return {
                        inventarios: {
                            ...state.inventarios,
                            [ubicacionId]: actualizado
                        }
                    };
                } else {
                    // Agregar nuevo producto
                    return {
                        inventarios: {
                            ...state.inventarios,
                            [ubicacionId]: [...inventario, producto]
                        }
                    };
                }
            }),
            updateProducto: (ubicacionId, productoActualizado) =>
                set(state => ({
                    inventarios: {
                        ...state.inventarios,
                        [ubicacionId]: (state.inventarios[ubicacionId] || []).map(p =>
                            p.code === productoActualizado.code ? productoActualizado : p
                        )
                    }
                })),
            deleteProductos: (ubicacionId, codes) =>
                set(state => ({
                    inventarios: {
                        ...state.inventarios,
                        [ubicacionId]: (state.inventarios[ubicacionId] || []).filter(p => !codes.includes(p.code))
                    }
                })),
            addMarca: (ubicacionId, marca) => set(state => ({
                marcas: {
                ...state.marcas,
                [ubicacionId]: [...(state.marcas[ubicacionId] || []), marca]
                }
            })),
            deleteMarca: (ubicacionId, marca) => set(state => ({
                marcas: {
                ...state.marcas,
                [ubicacionId]: (state.marcas[ubicacionId] || []).filter(m => m !== marca)
                }
            })),
            addCategoria: (ubicacionId, categoria) => set(state => ({
                categorias: {
                ...state.categorias,
                [ubicacionId]: [...(state.categorias[ubicacionId] || []), categoria]
                }
            })),
            deleteCategoria: (ubicacionId, categoria) => set(state => ({
                categorias: {
                ...state.categorias,
                [ubicacionId]: (state.categorias[ubicacionId] || []).filter(c => c !== categoria)
                }
            })),
        }),
        { name: "inventarios-storage" }
    )
);