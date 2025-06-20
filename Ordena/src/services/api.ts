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
    console.log('Token en interceptor:', token); // Para depuración
    
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
        const response = await api.put(`/solicitudes/${id}/`, data);
        return response.data;
    },

    // Eliminar solicitud
    deleteSolicitud: async (id: string) => {
        await api.delete(`/solicitudes/${id}/`);
    }
};

export default api;