import api from './api';
import type{ ProductInt } from '../store/useProductoStore';

export const productoService = {
    // Productos
    getProductos: async (bodegaId?: string, sucursalId?: string) => {
        const params = new URLSearchParams();
        if (bodegaId) params.append('bodega_id', bodegaId);
        if (sucursalId) params.append('sucursal_id', sucursalId);
        
        const response = await api.get('/productos/', { params });
        return response.data;
    },

    createProducto: async (producto: ProductInt, bodegaId?: string, sucursalId?: string) => {
        const data = {
            nombre_prodc: producto.name,
            codigo_interno: producto.code,
            descripcion_prodc: producto.description,
            marca_fk: producto.brand,
            categoria_fk: producto.category,
            bodega_fk: bodegaId,
            sucursal_fk: sucursalId
        };
        const response = await api.post('/productos/', data);
        return response.data;
    },

    updateProducto: async (id: string, producto: ProductInt) => {
        const data = {
            nombre_prodc: producto.name,
            descripcion_prodc: producto.description,
            marca_fk: producto.brand,
            categoria_fk: producto.category
        };
        const response = await api.put(`/productos/${id}/`, data);
        return response.data;
    },

    deleteProducto: async (id: string) => {
        await api.delete(`/productos/${id}/`);
    },

    // Marcas
    getMarcas: async () => {
        const response = await api.get('/productos/marcas/');
        return response.data;
    },

    addMarca: async (nombre: string) => {
        const response = await api.post('/productos/agregar_marca/', { nombre });
        return response.data;
    },

    deleteMarca: async (id: string) => {
        await api.delete(`/productos/eliminar_marca/?id_mprod=${id}`);
    },

    // Categorías
    getCategorias: async () => {
        const response = await api.get('/productos/categorias/');
        return response.data;
    },

    addCategoria: async (nombre: string) => {
        const response = await api.post('/productos/agregar_categoria/', { nombre });
        return response.data;
    },

    deleteCategoria: async (id: string) => {
        await api.delete(`/productos/eliminar_categoria/?id=${id}`);
    }
};