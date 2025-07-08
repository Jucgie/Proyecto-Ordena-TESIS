import api from "./api";

export const historialService ={
    registrarHistorialPedido: async (pedido: any) => {
        const response = await api.post('/historial-pedidos/', pedido);
        return response.data;
    },
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
    },
    getSolicitudes: async()=>{
        const response = await api.get('/solicitudes/');
        return response.data;   
    },
    getBodegas: async () => {
        const response = await api.get('/bodegas/'); // Asegúrate que la URL es correcta
        return response.data;
    },
    getHistorialPedidosDetallado: async (filtros = {}) => {
        const params = new URLSearchParams();
        Object.entries(filtros).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value.toString());
            }
        });
        const response = await api.get(`/historial-pedidos/?${params.toString()}`);
        return response.data;
    },
}

export const HistProductService ={
    getProducts:async()=>{
            const response = await api.get('/productos/');
            return response.data;
    }
}