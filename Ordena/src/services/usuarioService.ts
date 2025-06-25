import api from './api';
import type { CreateUsuarioData } from '../store/useUsuarioStore';

export const usuarioService = {
  getUsuarios: async () => {
    const response = await api.get('/usuarios/');
    return response.data;
  },
  getUsuario: async (id: string) => {
    const response = await api.get(`/usuarios/${id}/`);
    return response.data;
  },
  createUsuario: async (usuario: any) => {
    const response = await api.post('/usuarios/', usuario);
    return response.data;
  },
  updateUsuario: async (id: string, cambios: Partial<CreateUsuarioData>) => {
    // Si el campo de contraseña está vacío, se elimina para no enviar
    // una contraseña vacía al backend. El backend interpretará la ausencia
    // de este campo como "no cambiar la contraseña".
    if (cambios.contrasena === '') {
      delete cambios.contrasena;
    }
    //se usa api.patch para enviar solo los campos cambiados
    const response = await api.patch(`/usuarios/${id}/`, cambios);
    return response.data;
  },
  deleteUsuario: async (id: string) => {
    await api.delete(`/usuarios/${id}/`);
  },
  getTransportistasPorBodega: async (bodegaId: string) => {
    const response = await api.get(`/usuarios/transportistas-bodega/${bodegaId}/`);
    return response.data;
  }
}; 