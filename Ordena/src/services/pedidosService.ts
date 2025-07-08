import api from "./api";

export const pedidosService = {
    // Obtener historial de estados de un pedido
    getHistorialEstados: async (pedidoId: number|string) => {
        const response = await api.get(`/pedidos/${pedidoId}/historial-estado/`);
        return response.data.results || [];
    },
    // Puedes agregar aquí otros métodos relacionados a pedidos
};
