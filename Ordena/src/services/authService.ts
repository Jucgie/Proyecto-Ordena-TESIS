import api from './api';

export const authService = {
    async login(correo: string, contrasena: string) {
        const response = await api.post('/auth/login/', {
            correo,
            contrasena
        });
        return response.data;
    },

    async register(userData: {
        nombre: string;
        correo: string;
        contrasena: string;
        rut: string;
        rol: string;
        bodega?: string;
        sucursal?: number; // Cambiado a number
    }) {
        try {
            const response = await api.post('/auth/register/', userData);
            return response.data;
        } catch (error: any) {
            console.error('Error en el registro:', error.response?.data);
            throw error;
        }
    }
};