import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      usuario: null,
      setUsuario: (usuario: any) => set({ usuario }),
      logout: () => set({ usuario: null }),
    }),
    {
      name: "auth-storage", // clave en localStorage
    }
  )
);