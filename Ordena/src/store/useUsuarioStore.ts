import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useUsuariosStore = create(
  persist(
    (set) => ({
      usuarios: [],
      setUsuarios: (usuarios: any[]) => set({ usuarios }),
      updateUsuario: (id: string, cambios: any) =>
        set((state: any) => ({
          usuarios: state.usuarios.map((u: any) =>
            u.id === id ? { ...u, ...cambios } : u
          ),
        })),
      addUsuario: (usuario: any) =>
        set((state: any) => ({
          usuarios: [...state.usuarios, usuario],
        })),
      removeUsuario: (id: string) =>
        set((state: any) => ({
          usuarios: state.usuarios.filter((u: any) => u.id !== id),
        })),
    }),
    { name: "usuarios-storage" }
  )
);