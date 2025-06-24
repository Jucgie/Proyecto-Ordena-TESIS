import api from "./api";

export const historialService ={
    getPedidos: async()=>{
        const response = await api.get('/pedidos/');
        return response.data;
    }
}

export const HistProductService ={
    getProducts:async()=>{
            const response = await api.get('/productos/');
            return response.data;
    }
}