import { create } from "zustand";
import { getNotificaciones, marcarLeida } from "../services/notificationService";

export interface Notificacion {
  id_ntf: number;
  nombre_ntf: string;
  descripcion: string;
  tipo: "info" | "warning" | "error" | "success";
  leida: boolean;
  link?: string;
  fecha_hora_ntd: string;
}

interface NotificationState {
  notificaciones: Notificacion[];
  loading: boolean;
  fetchNotificaciones: () => Promise<void>;
  marcarComoLeida: (id: number) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notificaciones: [],
  loading: false,
  fetchNotificaciones: async () => {
    set({ loading: true });
    const data = await getNotificaciones();
    const notificacionesArr = data.results || data;
    set({ notificaciones: notificacionesArr, loading: false });
  },
  marcarComoLeida: async (id: number) => {
    await marcarLeida(id);
    // Refresca la lista
    await get().fetchNotificaciones();
  },
}));