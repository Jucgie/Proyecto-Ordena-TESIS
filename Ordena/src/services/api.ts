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
        // Cambiamos el formato del token
        config.headers.Authorization = `JWT ${token}`;
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

export default api;