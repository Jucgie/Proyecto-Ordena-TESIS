import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useProveedoresStore = create(
  persist(
    (set) => ({
      proveedores: [],
      addIngresoProveedor: (proveedor: any, ingreso: any) =>
        set((state: any) => {
          // Busca si ya existe el proveedor
          const idx = state.proveedores.findIndex((p: any) => p.rut === proveedor.rut);
          if (idx !== -1) {
            // Si existe, agrega el ingreso al historial
            const updated = [...state.proveedores];
            updated[idx].ingresos.push(ingreso);
            return { proveedores: updated };
          }
          // Si no existe, crea el proveedor con historial
          return {
            proveedores: [
              ...state.proveedores,
              { ...proveedor, ingresos: [ingreso] }
            ]
          };
        }),
    }),
    { name: "proveedores-storage" }
  )
);