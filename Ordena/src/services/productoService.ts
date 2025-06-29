import api from './api';
import type{ ProductInt } from '../store/useProductoStore';

export const productoService = {
    // Productos
    getProductos: async (ubicacionId?: string) => {
        console.log("🔍 DEBUG - Service - getProductos llamado con ubicacionId:", ubicacionId);
        const params = new URLSearchParams();
        
        // Si el ubicacionId es "bodega_central", filtrar por bodega
        if (ubicacionId === "bodega_central") {
            params.append('bodega_id', '2'); // ID de la bodega central (según el cambio que hiciste)
            console.log("🔍 DEBUG - Service - Filtrando por bodega_id: 2");
        } else if (ubicacionId) {
            params.append('sucursal_id', ubicacionId);
            console.log("🔍 DEBUG - Service - Filtrando por sucursal_id:", ubicacionId);
        }
        
        console.log("🔍 DEBUG - Service - Parámetros finales:", params.toString());
        const response = await api.get('/productos/', { params });
        console.log("🔍 DEBUG - Service - Respuesta del backend:", response.data);
        return response.data;
    },

    // Nueva función para obtener solo productos activos
    getProductosActivos: async (ubicacionId?: string) => {
        console.log("🔍 DEBUG - Service - getProductosActivos llamado con ubicacionId:", ubicacionId);
        const params = new URLSearchParams();
        
        // Agregar parámetro para filtrar solo productos activos
        params.append('activo', 'true');
        
        // Si el ubicacionId es "bodega_central", filtrar por bodega
        if (ubicacionId === "bodega_central") {
            params.append('bodega_id', '2');
            console.log("🔍 DEBUG - Service - Filtrando por bodega_id: 2");
        } else if (ubicacionId) {
            params.append('sucursal_id', ubicacionId);
            console.log("🔍 DEBUG - Service - Filtrando por sucursal_id:", ubicacionId);
        }
        
        console.log("🔍 DEBUG - Service - Parámetros finales:", params.toString());
        const response = await api.get('/productos/', { params });
        console.log("🔍 DEBUG - Service - Respuesta del backend:", response.data);
        return response.data;
    },

    createProducto: async (producto: ProductInt, ubicacionId?: string) => {
        
        // Buscar los IDs de marca y categoría por nombre
        const marcas = await api.get('/marcas/');
        const categorias = await api.get('/categorias/');
        
        const marcaObj = marcas.data.find((m: any) => m.nombre_mprod === producto.brand);
        const categoriaObj = categorias.data.find((c: any) => c.nombre === producto.category);
        
        if (!marcaObj || !categoriaObj) {
            throw new Error('Marca o categoría no encontrada');
        }

        // Determinar si es bodega o sucursal basado en el ID
        const data: any = {
            nombre_prodc: producto.name,
            codigo_interno: producto.code,
            descripcion_prodc: producto.description,
            marca_fk: marcaObj.id_mprod,
            categoria_fk: categoriaObj.id,
            stock_write: producto.stock || 0,
            stock_minimo_write: producto.stock_minimo || 5,
            stock_maximo_write: producto.stock_maximo || 100,
        };

        // Si el ubicacionId es "bodega_central", usar bodega_fk, sino sucursal_fk
        if (ubicacionId === "bodega_central") {
            data.bodega_fk = 2; // ID de la bodega central (según el cambio que hiciste)
            data.sucursal_fk = null;
        } else {
            data.bodega_fk = null;
            data.sucursal_fk = parseInt(ubicacionId);
        }

        const response = await api.post('/productos/', data);
        return response.data;
    },

    updateProducto: async (id: string, producto: ProductInt, ubicacionId?: string) => {
        const marcas = await api.get('/marcas/');
        const categorias = await api.get('/categorias/');
        
        const marcaObj = marcas.data.find((m: any) => m.nombre_mprod === producto.brand);
        const categoriaObj = categorias.data.find((c: any) => c.nombre === producto.category);
        
        if (!marcaObj || !categoriaObj) {
            throw new Error('Marca o categoría no encontrada');
        }
    
        const data: any = {
            nombre_prodc: producto.name,
            codigo_interno: producto.code,
            descripcion_prodc: producto.description,
            marca_fk: marcaObj.id_mprod,
            categoria_fk: categoriaObj.id,
            stock_write: producto.stock,
            stock_minimo_write: producto.stock_minimo,
            stock_maximo_write: producto.stock_maximo,
        };
    
        // Si el ubicacionId es "bodega_central", usar bodega_fk, sino sucursal_fk
        if (ubicacionId === "bodega_central") {
            data.bodega_fk = 2;
            data.sucursal_fk = null;
        } else {
            data.bodega_fk = null;
            data.sucursal_fk = ubicacionId ? parseInt(ubicacionId) : null;
        }
    

        const response = await api.put(`/productos/${id}/`, data);
        return response.data;
    },

    // Cambio de eliminar a desactivar
    desactivarProducto: async (id: string) => {
        // Ahora usamos el endpoint DELETE que en el backend desactiva el producto
        await api.delete(`/productos/${id}/`);
    },

    // Función para reactivar un producto (si es necesario en el futuro)
    reactivarProducto: async (id: string) => {
        const response = await api.patch(`/productos/${id}/`, { activo: true });
        return response.data;
    },

    // Marcas
    getMarcas: async () => {
        const response = await api.get('/marcas/');
        return response.data;
    },

    addMarca: async (nombre: string) => {
        const response = await api.post('/marcas/', { 
            nombre_mprod: nombre,
            descripcion_mprod: `Descripción de ${nombre}`
        });
        return response.data;
    },

    deleteMarca: async (id: string) => {
        await api.delete(`/marcas/${id}/`);
    },

    // Categorías
    getCategorias: async () => {
        const response = await api.get('/categorias/');
        return response.data;
    },

    addCategoria: async (nombre: string) => {
        const response = await api.post('/categorias/', { 
            nombre: nombre,
            descripcion: `Descripción de ${nombre}`
        });
        return response.data;
    },

    deleteCategoria: async (id: string) => {
        await api.delete(`/categorias/${id}/`);
    }
};