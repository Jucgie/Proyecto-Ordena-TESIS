import api from './api';

export const usuarioService = {
  getUsuarios: async () => {
    const response = await api.get('/usuarios/');
    return response.data;
  }
}; 