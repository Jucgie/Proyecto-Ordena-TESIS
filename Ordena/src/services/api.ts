import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para agregar el token a las peticiones
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`; // Cambiar de JWT a Bearer
    }
    return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Solicitudes
export const solicitudesService = {
    // Crear solicitud
    createSolicitud: async (solicitudData: any) => {
        const response = await api.post('/solicitudes/', solicitudData);
        return response.data;
    },

    // Obtener solicitudes
    getSolicitudes: async (params?: { bodega_id?: string; sucursal_id?: string; estado?: string }) => {
        // Filtrar el parámetro estado ya que no existe en el backend
        const { estado, ...paramsBackend } = params || {};
        const response = await api.get('/solicitudes/', { params: paramsBackend });
        return response.data;
    },

    // Obtener solicitud por ID
    getSolicitud: async (id: string) => {
        const response = await api.get(`/solicitudes/${id}/`);
        return response.data;
    },

    // Actualizar solicitud (aprobar/denegar)
    updateSolicitud: async (id: string, data: any) => {
        const response = await api.patch(`/solicitudes/${id}/`, data);
        return response.data;
    },

    // Eliminar solicitud
    deleteSolicitud: async (id: string) => {
        await api.delete(`/solicitudes/${id}/`);
    },

    // Archivar solicitudes
    archivarSolicitudes: async (ids: number[]) => {
        const response = await api.post('/solicitudes/archivar-solicitudes/', { ids });
        return response.data;
    }
};

// Informes
export const informesService = {
    // Crear informe
    createInforme: async (informeData: any) => {
        const response = await api.post('/informes/', informeData);
        return response.data;
    },

    // Obtener informes
    getInformes: async (params?: { modulo_origen?: string; usuario_fk?: string }) => {
        const response = await api.get('/informes/', { params });
        return response.data;
    },

    // Obtener informe por ID
    getInforme: async (id: string) => {
        const response = await api.get(`/informes/${id}/`);
        return response.data;
    },

    // Actualizar informe
    updateInforme: async (id: string, data: any) => {
        const response = await api.put(`/informes/${id}/`, data);
        return response.data;
    },

    // Eliminar informe
    deleteInforme: async (id: string) => {
        await api.delete(`/informes/${id}/`);
    },

    // Limpiar informes huérfanos
    limpiarHuerfanos: async () => {
        const response = await api.post('/informes/limpiar_huérfanos/');
        return response.data;
    }
};

// Pedidos
export const pedidosService = {
    // Crear pedido
    createPedido: async (pedidoData: any) => {
        const response = await api.post('/pedidos/', pedidoData);
        return response.data;
    },

    // Obtener pedidos
    getPedidos: async (params?: { bodega_id?: string; sucursal_id?: string; estado?: string }) => {
        const response = await api.get('/pedidos/', { params });
        return response.data;
    },

    // Obtener pedido por ID
    getPedido: async (id: string) => {
        const response = await api.get(`/pedidos/${id}/`);
        return response.data;
    },

    // Actualizar pedido
    updatePedido: async (id: string, data: any) => {
        const response = await api.patch(`/pedidos/${id}/`, data);
        return response.data;
    },

    // Eliminar pedido
    deletePedido: async (id: string) => {
        await api.delete(`/pedidos/${id}/`);
    },

    // Crear pedido desde solicitud
    crearDesdeSolicitud: async (data: { solicitud_id: number; personal_entrega_id: number; descripcion?: string }) => {
        const response = await api.post('/pedidos/crear-desde-solicitud/', data);
        return response.data;
    },

    // Confirmar recepción de pedido
    confirmarRecepcion: async (id: string) => {
        const response = await api.post(`/pedidos/${id}/confirmar-recepcion/`);
        return response.data;
    }
};

// Personal de Entrega
export const personalEntregaService = {
    // Obtener personal de entrega
    getPersonalEntrega: async (params?: { bodega_id?: string }) => {
        const response = await api.get('/personal-entrega/', { params });
        return response.data;
    },

    // Obtener personal de entrega por ID
    getPersonalEntregaById: async (id: string) => {
        const response = await api.get(`/personal-entrega/${id}/`);
        return response.data;
    },

    // Crear personal de entrega desde usuario
    crearDesdeUsuario: async (data: { usuario_id: number; patente: string; descripcion?: string }) => {
        const response = await api.post('/personal-entrega/crear-desde-usuario/', data);
        return response.data;
    },

    // Actualizar personal de entrega
    updatePersonalEntrega: async (id: string, data: any) => {
        const response = await api.patch(`/personal-entrega/${id}/`, data);
        return response.data;
    },

    // Eliminar personal de entrega
    deletePersonalEntrega: async (id: string) => {
        await api.delete(`/personal-entrega/${id}/`);
    }
};

// Extracción de productos desde PDF
export const extraerProductosDesdePDFBackend = async (archivo: File): Promise<any[]> => {
    const formData = new FormData();
    formData.append('archivo', archivo);
    const response = await api.post('/extraer-productos-pdf/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data.productos;
};

export default api;