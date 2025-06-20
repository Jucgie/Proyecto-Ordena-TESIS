import { create } from "zustand";
import { persist } from "zustand/middleware";
import { solicitudesService } from "../services/api";

interface Solicitud {
    id_solc: number;
    fecha_creacion: string;
    observacion: string;
    estado: 'pendiente' | 'aprobada' | 'denegada';
    fecha_aprobacion?: string;
    fk_sucursal: number;
    sucursal_nombre: string;
    fk_bodega: number;
    bodega_nombre: string;
    usuarios_fk: number;
    usuario_nombre: string;
    aprobador?: number;
    aprobador_nombre?: string;
    productos: Array<{
        id_solc_prod: number;
        cantidad: number;
        producto_fk: number;
        producto_nombre: string;
        producto_codigo: string;
    }>;
}

interface BodegaState {
    vista: "bodega" | "sucursal";
    solicitudes: Solicitud[];
    pedidos: any[];
    transferencias: number;
    solicitudesTransferidas: any[];
    
    // Funciones de vista
    setVista: (vista: "bodega" | "sucursal") => void;
    
    // Funciones de solicitudes
    fetchSolicitudes: (params?: { bodega_id?: string; sucursal_id?: string; estado?: string }) => Promise<void>;
    createSolicitud: (solicitudData: any) => Promise<void>;
    updateSolicitud: (id: number, cambios: any) => Promise<void>;
    deleteSolicitud: (id: number) => Promise<void>;
    addSolicitud: (solicitud: Solicitud) => void;
    clearSolicitudes: () => void;
    
    // Funciones de pedidos
    addPedido: (pedido: any) => void;
    updatePedido: (id: number, cambios: any) => void;
    clearPedidos: () => void;
    
    // Funciones de transferencias
    setTransferencias: (cantidad: number) => void;
    addSolicitudesTransferidas: (solis: any[]) => void;
    clearSolicitudesTransferidas: () => void;
    removeSolicitudTransferida: (id: number) => void;
}

export const useBodegaStore = create<BodegaState>()(
  persist(
    (set, get) => ({
      vista: "bodega",
      solicitudes: [],
      pedidos: [],
      transferencias: 0,
      solicitudesTransferidas: [],
      
      // Funciones de vista
      setVista: (vista: "bodega" | "sucursal") => set({ vista }),
      
      // Funciones de solicitudes con backend
      fetchSolicitudes: async (params) => {
        try {
          // Filtrar el parámetro estado ya que no existe en el backend
          const { estado, ...paramsBackend } = params || {};
          const solicitudes = await solicitudesService.getSolicitudes(paramsBackend);
          set({ solicitudes });
        } catch (error) {
          console.error('Error fetching solicitudes:', error);
        }
      },
      
      createSolicitud: async (solicitudData) => {
        try {
          const nuevaSolicitud = await solicitudesService.createSolicitud(solicitudData);
          set(state => ({
            solicitudes: [...state.solicitudes, nuevaSolicitud]
          }));
        } catch (error) {
          console.error('Error creating solicitud:', error);
          throw error;
        }
      },
      
      updateSolicitud: async (id: number, cambios: any) => {
        try {
          // Filtrar solo los campos que existen en el backend
          const { estado, ...camposBackend } = cambios;
          
          // Si hay campos para el backend, actualizarlos
          if (Object.keys(camposBackend).length > 0) {
            const solicitudActualizada = await solicitudesService.updateSolicitud(id.toString(), camposBackend);
            set(state => ({
              solicitudes: state.solicitudes.map(s =>
                s.id_solc === id ? solicitudActualizada : s
              )
            }));
          }
          
          // Si hay cambios de estado, manejarlos solo en el frontend
          if (estado) {
            set(state => ({
              solicitudes: state.solicitudes.map(s =>
                s.id_solc === id ? { ...s, estado } : s
              )
            }));
          }
        } catch (error) {
          console.error('Error updating solicitud:', error);
          throw error;
        }
      },
      
      deleteSolicitud: async (id: number) => {
        try {
          await solicitudesService.deleteSolicitud(id.toString());
          set(state => ({
            solicitudes: state.solicitudes.filter(s => s.id_solc !== id)
          }));
        } catch (error) {
          console.error('Error deleting solicitud:', error);
          throw error;
        }
      },
      
      addSolicitud: (solicitud: Solicitud) => set(state => ({
        solicitudes: [...state.solicitudes, solicitud]
      })),
      
      clearSolicitudes: () => set({ solicitudes: [] }),
      
      // Funciones de pedidos
      addPedido: (pedido: any) => set(state => ({ 
        pedidos: [...state.pedidos, pedido] 
      })),
      
      updatePedido: (id: number, cambios: any) => set(state => ({
        pedidos: state.pedidos.map(p =>
          p.id === id ? { ...p, ...cambios } : p
        )
      })),
      
      clearPedidos: () => set({ pedidos: [] }),
      
      // Funciones de transferencias
      setTransferencias: (cantidad: number) => set({ transferencias: cantidad }),
      
      addSolicitudesTransferidas: (solis: any[]) => set(state => ({
        solicitudesTransferidas: [...state.solicitudesTransferidas, ...solis]
      })),
      
      clearSolicitudesTransferidas: () => set({ solicitudesTransferidas: [] }),
      
      removeSolicitudTransferida: (id: number) => set(state => ({
        solicitudesTransferidas: state.solicitudesTransferidas.filter(s => s.id !== id)
      })),
    }),
    {
      name: "bodega-storage",
    }
  )
);