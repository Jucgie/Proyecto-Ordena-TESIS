import api from './api';
import type { CreateUsuarioData, Usuario } from '../store/useUsuarioStore';

export const usuarioService = {
  getUsuarios: async () => {
    const response = await api.get('/usuarios/');
    return response.data;
  },
  getUsuario: async (id: string) => {
    const response = await api.get(`/usuarios/${id}/`);
    return response.data;
  },
  createUsuario: async (usuario: CreateUsuarioData) => {
    const response = await api.post('/usuarios/', usuario);
    return response.data;
  },
  updateUsuario: async (id: string, usuario: Partial<Usuario>) => {
    const response = await api.patch(`/usuarios/${id}/`, usuario);
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