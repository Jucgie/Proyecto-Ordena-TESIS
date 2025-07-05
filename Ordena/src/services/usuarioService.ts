import api from './api';
import type { CreateUsuarioData, Usuario } from '../store/useUsuarioStore';

export const usuarioService = {
  getUsuarios: async () => {
    // Traer todos los usuarios de todas las páginas
    let url = '/usuarios/';
    let allResults: any[] = [];
    while (url) {
      const response = await api.get(url);
      const data = response.data;
      if (Array.isArray(data)) {
        allResults = data;
        break;
      }
      allResults = allResults.concat(data.results || []);
      if (data.next) {
        let nextUrl = data.next;
        // Si es absoluta, extrae solo la parte después de /api
        if (nextUrl.startsWith('http')) {
          const idx = nextUrl.indexOf('/api/');
          nextUrl = idx !== -1 ? nextUrl.substring(idx) : nextUrl;
        }
        // Si axios ya tiene baseURL /api, quita el prefijo /api si lo tiene
        if (nextUrl.startsWith('/api/')) {
          nextUrl = nextUrl.replace(/^\/api\//, '');
        }
        url = nextUrl;
      } else {
        url = null;
      }
    }
    return allResults;
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