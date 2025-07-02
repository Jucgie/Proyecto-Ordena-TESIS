import api from "./api";

export const historialService ={
    getPedidos: async(params = {})=>{
        const response = await api.get('/pedidos/', { params });
        return response.data;
    },
    getPedidosRecientes: async (params = {}) => {
        const response = await api.get('/pedidos_recientes/', { params });
        return response.data;
    },
    getMovimientosInventario: async (filtros = {}) => {
        // filtros: { bodega, sucursal, producto, usuario, fecha_inicio, fecha_fin, tipo_movimiento, cantidad_min, cantidad_max, limit, offset }
        const params = new URLSearchParams();
        Object.entries(filtros).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value.toString());
            }
        });
        const response = await api.get(`/movimientos-inventario/?${params.toString()}`);
        return response.data; // Ahora retorna { movimientos, estadisticas, filtros_aplicados }
    }
}

export const HistProductService ={
    getProducts:async()=>{
            const response = await api.get('/productos/');
            return response.data;
    }
}