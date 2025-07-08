import { create } from "zustand";
import { getNotificacionesUsuario, marcarLeida, eliminarNotificacion } from "../services/notificationService";

export interface NotificacionUsuario {
  id_ntf_us: number;
  usuario: number;
  notificacion: {
    id_ntf: number;
    nombre_ntf: string;
    descripcion: string;
    tipo: "info" | "warning" | "error" | "success";
    link?: string;
    fecha_hora_ntd: string;
  };
  leida: boolean;
  eliminada: boolean;
  fecha_recibida: string;
}

interface NotificationState {
  notificaciones: NotificacionUsuario[];
  loading: boolean;
  fetchNotificaciones: () => Promise<void>;
  marcarComoLeida: (id_ntf_us: number) => Promise<void>;
  eliminarNotificacion: (id_ntf_us: number) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notificaciones: [],
  loading: false,
  fetchNotificaciones: async () => {
    set({ loading: true });
    const data = await getNotificacionesUsuario();
    // Ajusta según la estructura real de la respuesta:
    const notificacionesArr = Array.isArray(data) ? data : (data.results || []);
    set({ notificaciones: notificacionesArr, loading: false });
  },
  marcarComoLeida: async (id_ntf_us: number) => {
    await marcarLeida(id_ntf_us);
    await get().fetchNotificaciones();
  },
  eliminarNotificacion: async (id_ntf_us: number) => {
    await eliminarNotificacion(id_ntf_us);
    await get().fetchNotificaciones();
  },
}));