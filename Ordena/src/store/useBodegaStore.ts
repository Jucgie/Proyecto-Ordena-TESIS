import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useBodegaStore = create(
  persist(
    (set) => ({
      vista: "bodega", // valor inicial
      setVista: (vista: "bodega" | "sucursal") => set({ vista }),
      solicitudes: [],
      pedidos: [],
      transferencias: 0,
      solicitudesTransferidas: [],
      setSolicitudes: (solicitudes: any[]) => set({ solicitudes }),
      setPedidos: (pedidos: any[]) => set({ pedidos }),
      setTransferencias: (cantidad) => set({ transferencias: cantidad }),
      addPedido: (pedido: any) => set((state: any) => ({ pedidos: [...state.pedidos, pedido] })),
      updateSolicitud: (id: number, cambios: any) =>
        set((state: any) => ({
          solicitudes: state.solicitudes.map((s: any) =>
            s.id === id ? { ...s, ...cambios } : s
          ),
        })),
      addSolicitudesTransferidas: (solis) => set((state) => ({
        solicitudesTransferidas: [...state.solicitudesTransferidas, ...solis]
      })),
      clearSolicitudesTransferidas: () => set({ solicitudesTransferidas: [] }),
      removeSolicitudTransferida: (id) => set((state) => ({
        solicitudesTransferidas: state.solicitudesTransferidas.filter((s) => s.id !== id)
      })),
      addSolicitud: (solicitud: any) => set((state: any) => ({
        solicitudes: [...state.solicitudes, solicitud]
      })),
      updatePedido: (id: number, cambios: any) =>
        set((state: any) => ({
          pedidos: state.pedidos.map((p: any) =>
            p.id === id ? { ...p, ...cambios } : p
          ),
        })),
    }),
    {
      name: "bodega-storage", // nombre de la clave en localStorage
    }
  )
);