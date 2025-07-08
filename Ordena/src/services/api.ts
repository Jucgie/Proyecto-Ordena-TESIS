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
    getSolicitudes: async (params?: { bodega_id?: string; sucursal_id?: string; estado?: string; limit?: number; offset?: number }) => {
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
    },

    getHistorialEstado: async (pedidoId: string | number) => {
        const response = await api.get(`/pedidos/${pedidoId}/historial-estado/`);
        return response.data;
    },

    // Crear ingreso de bodega
    crearIngresoBodega: async (data: {
        fecha: string;
        num_guia_despacho?: string;
        observaciones?: string;
        productos: Array<{
            nombre: string;
            cantidad: number;
            marca: string;
            categoria: string;
            modelo?: string;
        }>;
        proveedor: {
            nombre: string;
            rut: string;
            contacto?: string;
            telefono?: string;
            email?: string;
        };
        bodega_id: string;
    }) => {
        const response = await api.post('/pedidos/crear-ingreso-bodega/', data);
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
    crearDesdeUsuario: async (data: { usuario_id: number; descripcion?: string }) => {
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
export const extraerProductosDesdePDFBackend = async (archivo: File): Promise<any> => {
    const formData = new FormData();
    formData.append('archivo', archivo);
    const response = await api.post('/extraer-productos-pdf/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data; // Devolver toda la respuesta, no solo productos
};

// Proveedores
export const proveedoresService = {
    // Obtener todos los proveedores
    getProveedores: async () => {
        const response = await api.get('/proveedores/');
        return response.data;
    },

    // Obtener proveedor por ID
    getProveedor: async (id: string) => {
        const response = await api.get(`/proveedores/${id}/`);
        return response.data;
    },

    // Crear proveedor
    createProveedor: async (proveedorData: any) => {
        const response = await api.post('/proveedores/', proveedorData);
        return response.data;
    },

    // Actualizar proveedor
    updateProveedor: async (id: string, data: any) => {
        const response = await api.patch(`/proveedores/${id}/`, data);
        return response.data;
    },

    // Eliminar proveedor
    deleteProveedor: async (id: string) => {
        await api.delete(`/proveedores/${id}/`);
    },

    // Crear o actualizar proveedor (usando el endpoint especial)
    crearOActualizar: async (proveedorData: any) => {
        const response = await api.post('/proveedores/crear-o-actualizar/', proveedorData);
        return response.data;
    },

    // Obtener historial de ingresos de un proveedor
    getHistorialIngresos: async (proveedorId: string) => {
        const response = await api.get(`/proveedores/${proveedorId}/historial-ingresos/`);
        return response.data;
    }
};

// Obtener producto por código único
export const getProductoCodigoUnico = async (codigo: string) => {
    const response = await api.get(`/producto-codigo-unico/${codigo}/`);
    return response.data;
};

// Buscar productos similares
export const buscarProductosSimilares = async (data: {
    nombre: string;
    marca?: string;
    categoria?: string;
    bodega_id?: string;
    codigo_interno?: string;
}) => {
    const response = await api.post('/buscar-productos-similares/', data);
    return response.data;
};

export const buscarProductosSimilaresSucursal = async (data: {
    nombre: string;
    sucursal_id: string;
    codigo_interno?: string;
    marca?: string;
    categoria?: string;
}) => {
    const response = await api.post('/buscar-productos-similares-sucursal/', data);
    return response.data;
};

export default api;