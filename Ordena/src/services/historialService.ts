import api from "./api";

export const historialService ={
    getPedidos: async()=>{
        const response = await api.get('/pedidos/');
        return response.data;
    },

    getSolicitudes: async()=>{
        const response = await api.get('/solicitudes/');
        return response.data;   
    },
    getBodegas: async () => {
    const response = await api.get('/bodegas/'); // Asegúrate que la URL es correcta
    return response.data;
    },
    
}

export const HistProductService ={
    getProducts:async()=>{
            const response = await api.get('/productos/');
            return response.data;
    }
}