import { create } from "zustand";
import { persist } from "zustand/middleware";
import { solicitudesService } from "../services/api";
import { historialService } from "../services/historialService";

interface Solicitud {
    id_solc: number;
    fecha_creacion: string;
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

export interface Bodega{
  id: number;
  bodega_nombre:string;
  direccion:string;
  rut:string;
}

interface BodegaState {
    vista: "bodega" | "sucursal";
    solicitudes: Solicitud[];
    bodegas: Bodega[];
    pedidos: any[];
    transferencias: number;
    solicitudesTransferidas: any[];
    paginaActual: number;
    totalSolicitudes: number;
    
    // Funciones de vista
    setVista: (vista: "bodega" | "sucursal") => void;
    
    // Funciones de solicitudes
    fetchSolicitudes: (params?: { bodega_id?: string; sucursal_id?: string; estado?: string; limit?: number; offset?: number }) => Promise<void>;
    createSolicitud: (solicitudData: any) => Promise<void>;
    updateSolicitud: (id: number, cambios: any) => Promise<void>;
    deleteSolicitud: (id: number) => Promise<void>;
    addSolicitud: (solicitud: Solicitud) => void;
    clearSolicitudes: () => void;
    fetchBodegas: () => Promise<void>;
    
    // Funciones de pedidos
    addPedido: (pedido: any) => void;
    updatePedido: (id: number, cambios: any) => void;
    clearPedidos: () => void;
    
    // Funciones de transferencias
    setTransferencias: (cantidad: number) => void;
    addSolicitudesTransferidas: (solis: any[]) => void;
    clearSolicitudesTransferidas: () => void;
    removeSolicitudTransferida: (id: number) => void;
    clearTransferidasInvalidas: () => void;
}

export const useBodegaStore = create<BodegaState>()(
  persist(
    (set, get) => ({
      vista: "bodega",
      solicitudes: [],
      bodegas: [],
      pedidos: [],
      transferencias: 0,
      solicitudesTransferidas: [],
      paginaActual: 1,
      totalSolicitudes: 0,
      
      // Funciones de vista
      setVista: (vista: "bodega" | "sucursal") => set({ vista }),
      
      // Funciones de solicitudes con backend
      fetchSolicitudes: async (params) => {
        try {
          const { estado, ...paramsBackend } = params || {};
          // Por defecto limit 20
          const limit = paramsBackend.limit ?? 20;
          const offset = paramsBackend.offset ?? 0;
          const response = await solicitudesService.getSolicitudes({ ...paramsBackend, limit, offset });
          // Si el backend retorna un array, asumimos que no hay total, si retorna objeto, buscamos total
          if (Array.isArray(response)) {
            set({ solicitudes: response });
          } else {
            set({ solicitudes: response.results || response, totalSolicitudes: response.count || 0 });
          }
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
          // Enviar todos los cambios, incluyendo 'estado', al backend
          const solicitudActualizada = await solicitudesService.updateSolicitud(id.toString(), cambios);
          set(state => ({
            solicitudes: state.solicitudes.map(s =>
              s.id_solc === id ? solicitudActualizada : s
            )
          }));
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
      fetchBodegas: async () => {
        try {
          // Asumimos que tu servicio tiene un método para obtener las bodegas
          const bodegasData = await historialService.getBodegas();
          // Adaptación para aceptar array o paginación tipo DRF
          const bodegasArray = Array.isArray(bodegasData)
            ? bodegasData
            : bodegasData.results || [];
          // Mapeamos por si los nombres de la API no coinciden exactamente con la interfaz
          const bodegasMapeadas = bodegasArray.map((b: any) => ({
            id: b.id || b.id_bdg, // Acepta 'id' o 'id_bdg' del backend
            bodega_nombre: b.bodega_nombre || b.nombre_bdg, // Acepta ambos nombres
            direccion: b.direccion,
            rut: b.rut,
          }));
          set({ bodegas: bodegasMapeadas });
        } catch (error) {
          console.error('Error fetching bodegas:', error);
        }
      },


      clearSolicitudes: () => set({ solicitudes: [] }),
      
      // Funciones de pedidos
      addPedido: (pedido: any) => {
        set(state => ({ 
          pedidos: [...state.pedidos, pedido] 
        }));
        // Registrar en historial de pedidos
        try {
          // Por cada producto del pedido, registra en historial
          if (Array.isArray(pedido.productos)) {
            pedido.productos.forEach((prod: any) => {
              console.log("Registrando historial:", {
                pedidos_fk: pedido.id,
                producto_fk: prod.id || prod.id_prodc,
                prod
              });
              historialService.registrarHistorialPedido({
                pedidos_fk: pedido.id,
                producto_fk: prod.id,
              });
            });
          }
        } catch (error) {
          console.error('Error registrando en historial de pedidos:', error);
        }
      },
      
      updatePedido: (id: number, cambios: any) => set(state => ({
        pedidos: state.pedidos.map(p =>
          p.id === id ? { ...p, ...cambios } : p
        )
      })),
      
      clearPedidos: () => set({ pedidos: [] }),
      
      // Funciones de transferencias
      setTransferencias: (cantidad: number) => set({ transferencias: cantidad }),
      
      addSolicitudesTransferidas: (solis: any[]) => set({
        solicitudesTransferidas: solis
      }),
      
      clearSolicitudesTransferidas: () => set({ solicitudesTransferidas: [] }),
      
      removeSolicitudTransferida: (id: number) => set(state => ({
        solicitudesTransferidas: state.solicitudesTransferidas.filter(s => s.id !== id)
      })),
      
      clearTransferidasInvalidas: () => set(state => {
        const seen = new Set();
        return {
          solicitudesTransferidas: state.solicitudesTransferidas.filter(s => {
            // ID válido y no repetido
            if (!s.id || Number(s.id) <= 0 || seen.has(s.id)) return false;
            seen.add(s.id);
            // Productos válidos
            return Array.isArray(s.productos) && s.productos.length > 0;
          })
        };
      }),
    }),
    {
      name: "bodega-storage",
      // SOLO persistir la vista y las solicitudes transferidas
      // NO persistir pedidos, solicitudes ni transferencias
      partialize: (state) => ({ 
        vista: state.vista,
        solicitudesTransferidas: state.solicitudesTransferidas
      }),
    }
  )
);