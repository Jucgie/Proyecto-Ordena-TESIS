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
        
        const marcasArray = Array.isArray(marcas.data) ? marcas.data : (marcas.data.results || []);
        const categoriasArray = Array.isArray(categorias.data) ? categorias.data : (categorias.data.results || []);
        
        const marcaObj = marcasArray.find((m: any) => m.nombre_mprod === producto.brand);
        const categoriaObj = categoriasArray.find((c: any) => c.nombre === producto.category);
        
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
        } else if (ubicacionId) {
            data.bodega_fk = null;
            data.sucursal_fk = parseInt(ubicacionId);
        } else {
            data.bodega_fk = null;
            data.sucursal_fk = null;
        }

        const response = await api.post('/productos/', data);
        return response.data;
    },

    updateProducto: async (id: string, producto: ProductInt, ubicacionId?: string, motivo?: string) => {
        const marcas = await api.get('/marcas/');
        const categorias = await api.get('/categorias/');
        
        const marcasArray = Array.isArray(marcas.data) ? marcas.data : (marcas.data.results || []);
        const categoriasArray = Array.isArray(categorias.data) ? categorias.data : (categorias.data.results || []);
        
        const marcaObj = marcasArray.find((m: any) => m.nombre_mprod === producto.brand);
        const categoriaObj = categoriasArray.find((c: any) => c.nombre === producto.category);
        
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
    
        if (motivo) {
            data.motivo = motivo;
            console.log("🔍 DEBUG - Service - Agregando motivo al data:", motivo);
        } else {
            console.log("🔍 DEBUG - Service - No se recibió motivo");
        }
        
        console.log("🔍 DEBUG - Service - Data completo a enviar:", data);
    
        // Si el ubicacionId es "bodega_central", usar bodega_fk, sino sucursal_fk
        if (ubicacionId === "bodega_central") {
            data.bodega_fk = 2;
            data.sucursal_fk = null;
        } else {
            data.bodega_fk = null;
            data.sucursal_fk = ubicacionId ? parseInt(ubicacionId) : null;
        }
    
        // Si hay motivo, usar el endpoint específico para actualizar stock con movimiento
        if (motivo) {
            const stockData = {
                stock_write: producto.stock,
                motivo: motivo
            };
            console.log("🔍 DEBUG - Service - Usando endpoint específico para actualizar stock con movimiento");
            const response = await api.post(`/productos/${id}/actualizar-stock/`, stockData);
            return response.data;
        } else {
            // Si no hay motivo, usar el endpoint normal de actualización
            console.log("🔍 DEBUG - Service - Usando endpoint normal de actualización");
            const response = await api.put(`/productos/${id}/`, data);
            return response.data;
        }
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

    // ===== FUNCIONES PARA PRODUCTOS DESACTIVADOS =====
    
    // Obtener productos desactivados
    getProductosDesactivados: async (ubicacionId?: string, search?: string) => {
        const params = new URLSearchParams();
        
        if (ubicacionId === "bodega_central") {
            params.append('bodega_id', '2');
        } else if (ubicacionId) {
            params.append('sucursal_id', ubicacionId);
        }
        
        if (search) {
            params.append('search', search);
        }
        
        const response = await api.get('/productos-desactivados/', { params });
        return response.data;
    },

    // Reactivar múltiples productos
    reactivarProductos: async (productoIds: string[]) => {
        const response = await api.post('/reactivar-productos/', {
            producto_ids: productoIds
        });
        return response.data;
    },

    // Reactivar un producto individual
    reactivarProductoIndividual: async (productoId: string) => {
        const response = await api.post(`/reactivar-producto/${productoId}/`);
        return response.data;
    },

    // Nueva función para obtener el historial completo de un producto
    getHistorialProducto: async ({ productoId, sucursalId, bodegaId }: { productoId: string, sucursalId?: string | number, bodegaId?: string | number }) => {
        console.log("🔍 DEBUG - Service - getHistorialProducto llamado con:", { productoId, sucursalId, bodegaId });
        let url = `/productos/${productoId}/historial/`;
        const params = new URLSearchParams();
        if (bodegaId) {
            params.append('bodega_id', String(bodegaId));
        } else if (sucursalId) {
            params.append('sucursal_id', String(sucursalId));
        }
        if ([...params].length > 0) {
            url += `?${params.toString()}`;
        }
        const response = await api.get(url);
        console.log("🔍 DEBUG - Service - Respuesta del historial:", response.data);
        return response.data;
    },

    // Nueva función para obtener productos con movimientos recientes
    getProductosConMovimientosRecientes: async (ubicacionId?: string, dias: number = 7, limit: number = 20) => {
        console.log("🔍 DEBUG - Service - getProductosConMovimientosRecientes llamado");
        const params = new URLSearchParams();
        params.append('dias', dias.toString());
        params.append('limit', limit.toString());
        
        if (ubicacionId === "bodega_central") {
            params.append('bodega_id', '2');
        } else if (ubicacionId) {
            params.append('sucursal_id', ubicacionId);
        }
        
        const response = await api.get('/productos-con-movimientos-recientes/', { params });
        console.log("🔍 DEBUG - Service - Respuesta productos con movimientos:", response.data);
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
    },

    // Generar código automático
    generarCodigoAutomatico: async (data: {
        nombre: string;
        marca: string;
        categoria: string;
        modelo?: string;
        ubicacion_id: string;
        es_bodega: boolean;
    }) => {
        const response = await api.post('/generar-codigo-automatico/', data);
        return response.data;
    }
};