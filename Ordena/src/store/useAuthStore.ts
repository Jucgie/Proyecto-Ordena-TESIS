import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Usuario {
    id: number;
    nombre: string;
    correo: string;
    rol: string;
    sucursalId?: string;
    sucursal?: number;
    bodega?: string;
}

interface AuthState {
    usuario: Usuario | null;
    token: string | null;
    setUsuario: (usuario: Usuario, token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            usuario: null,
            token: null,
            setUsuario: (usuario: any, token: string) => set({ usuario, token }),
            logout: () => set({ usuario: null, token: null }),
        }),
        {
            name: "auth-storage",
        }
    )
);