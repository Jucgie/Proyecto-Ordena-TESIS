import { create } from "zustand";
import { persist } from "zustand/middleware";

import { usuarioService } from "../services/usuarioService";


// Define la estructura de un objeto de usuario (como viene de la API)
export interface Usuario {
  id_us: string;
  rut: string;
  nombre: string;
  correo: string;
  rol: string; // El nombre del rol
  rol_fk: number; // El ID del rol
  sucursal_fk?: number;
  bodeg_fk?: number;
  is_active:boolean;
}

// Define los datos necesarios para crear/actualizar un usuario
export interface CreateUsuarioData {
  rut: string;
  nombre: string;
  correo: string;
  contrasena: string;
  rol_fk: number;
  sucursal_fk?: number;
  bodeg_fk?: number;
}

// Define la estructura completa del estado y sus acciones
interface UsuarioState {
  usuarios: Usuario[];
  loading: boolean;
  error: string | null;
  fetchUsuarios: () => Promise<void>;
  addUsuario: (usuarioData: CreateUsuarioData) => Promise<void>;
  updateUsuario: (id: string, cambios: Partial<Usuario>) => Promise<void>;
  removeUsuario: (id: string) => Promise<void>;
}


export const useUsuariosStore = create<UsuarioState>()(
  persist(
    (set) => ({
      usuarios: [],
      loading: false,
      error: null,
      fetchUsuarios: async () => {
        set({ loading: true, error: null });
        try {
          const data = await usuarioService.getUsuarios();
          set({ usuarios: data, loading: false });
        } catch (error) {
          set({ error: "Error al obtener usuarios", loading: false });
        }
      },
      //Para añadir un usuario
      addUsuario: async (usuarioData) => {
        // Aquí llamarías a usuarioService.createUsuario(usuarioData)
        // y luego actualizas el estado con la respuesta
        console.log("Añadiendo usuario:", usuarioData);
        set({ loading: true, error: null });
        try {
          // 1. Llama al servicio para crear el usuario en el backend
          const nuevoUsuario = await usuarioService.createUsuario(usuarioData);
          // 2. Si tiene éxito, agrega el nuevo usuario al estado local
          set((state) => ({
            usuarios: [...state.usuarios, nuevoUsuario],
            loading: false,
          }));
        } catch (error) {
          set({ error: "Error al añadir el empleado", loading: false });
        }
      },

      //Para actualizar un usuario
      updateUsuario: async (id, cambios) => {
        console.log(`Actualizando usuario ${id} con:`, cambios);
        set({ loading: true, error: null });
        try {
          const usuarioActualizado = await usuarioService.updateUsuario(id, cambios);
          set((state) => ({
            usuarios: state.usuarios.map((u) =>
              u.id_us === id ? { ...u, ...usuarioActualizado } : u
            ),
            loading: false,
          }));
        } catch (error) {
          console.error("Error al actualizar el usuario:", error);
          set({ error: "Error al actualizar el empleado", loading: false });
        }
      },

      //Para eliminar un usuario
      removeUsuario: async (id) => {
        set({ loading: true, error: null });
        try {
          // 1. Llama al servicio para eliminar el usuario en el backend
          await usuarioService.deleteUsuario(id);
          // 2. Si tiene éxito, elimina el usuario del estado local
          set((state) => ({
            usuarios: state.usuarios.filter((u) => u.id_us !== id),
            loading: false,
          }));
        } catch (error) {
          set({ error: "Error al eliminar el empleado", loading: false });
        }
      },
    }),
    { name: "usuarios-storage" }
  )
);


/* export const useUsuariosStore = create(
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
); */