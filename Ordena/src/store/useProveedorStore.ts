import { create } from "zustand";
import { persist } from "zustand/middleware";
import { proveedoresService } from "../services/api";

interface Proveedor {
  id_provd?: number;
  nombres_provd: string;
  direccion_provd: string;
  correo: string;
  razon_social: string;
  rut_empresa: string;
  ingresos?: any[];
}

interface Ingreso {
  fecha: string;
  productos: any[];
  documentos: {
    numRem: string;
    numGuiaDespacho: string;
    archivoGuia?: string;
  };
  observaciones: string;
}

interface ProveedoresState {
  proveedores: Proveedor[];
  loading: boolean;
  error: string | null;
  
  // Acciones
  fetchDashbProveedores: () => Promise<void>;
  fetchProveedores: () => Promise<void>;
  addIngresoProveedor: (proveedor: any, ingreso: Ingreso) => Promise<void>;
  createProveedor: (proveedorData: any) => Promise<void>;
  updateProveedor: (id: number, data: any) => Promise<void>;
  deleteProveedor: (id: number) => Promise<void>;
  clearError: () => void;
}

export const useProveedoresStore = create<ProveedoresState>()(
  persist(
    (set, get) => ({
      proveedores: [],
      loading: false,
      error: null,
      
        fetchDashbProveedores: async () => {
        set({ loading: true, error: null });
        try {
          // Esta función solo trae la lista de proveedores, sin el historial. Es mucho más rápida.
          const proveedores = await proveedoresService.getProveedores();
          set({ proveedores: proveedores, loading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.error || "Error al cargar proveedores", 
            loading: false 
          });
        }
      },

      fetchProveedores: async () => {
        set({ loading: true, error: null });
        try {
          const proveedores = await proveedoresService.getProveedores();
          
          // Cargar historial de ingresos para cada proveedor
          const proveedoresConHistorial = await Promise.all(
            proveedores.map(async (proveedor: any) => {
              try {
                const historialData = await proveedoresService.getHistorialIngresos(proveedor.id_provd);
                return {
                  ...proveedor,
                  ingresos: historialData.historiales || []
                };
              } catch (error) {
                console.warn(`No se pudo cargar historial para proveedor ${proveedor.id_provd}:`, error);
                return {
                  ...proveedor,
                  ingresos: []
                };
              }
            })
          );
          
          set({ proveedores: proveedoresConHistorial, loading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.error || "Error al cargar proveedores", 
            loading: false 
          });
        }
      },

      addIngresoProveedor: async (proveedor: any, ingreso: Ingreso) => {
        set({ loading: true, error: null });
        try {
          console.log('🔍 DEBUG - addIngresoProveedor llamado con:', { proveedor, ingreso });
          
          // Limpiar el RUT para la búsqueda
          const rutLimpio = proveedor.rut.replace(/[.-]/g, '').replace(/[kK]$/, '');
          console.log('🔍 DEBUG - RUT limpio:', rutLimpio);
          
          // Primero, crear o actualizar el proveedor en la base de datos
          const proveedorData = {
            nombres_provd: proveedor.nombre,
            direccion_provd: proveedor.contacto || 'Sin dirección',  // Usar 'contacto' que contiene la dirección
            correo: proveedor.email || proveedor.correo || 'sin@email.com',
            razon_social: proveedor.nombre,
            rut_empresa: rutLimpio
          };

          console.log('🔍 DEBUG - Datos del proveedor a enviar:', proveedorData);

          try {
            const resultado = await proveedoresService.crearOActualizar(proveedorData);
            console.log('🔍 DEBUG - Resultado de crear/actualizar proveedor:', resultado);
            
            // Actualizar el store local
            set((state) => {
              console.log('🔍 DEBUG - Estado actual del store:', state.proveedores);
              
              const idx = state.proveedores.findIndex((p: any) => 
                p.rut_empresa.toString() === rutLimpio || 
                p.rut_empresa.toString() === proveedor.rut.replace(/[.-]/g, '').replace(/[kK]$/, '')
              );
              
              console.log('🔍 DEBUG - Índice encontrado:', idx);
              
              if (idx !== -1) {
                // Si existe, agrega el ingreso al historial
                const updated = [...state.proveedores];
                if (!updated[idx].ingresos) {
                  updated[idx].ingresos = [];
                }
                updated[idx].ingresos.unshift(ingreso); // Agregar al inicio para que aparezca primero
                console.log('🔍 DEBUG - Proveedor actualizado con nuevo ingreso:', updated[idx]);
                return { proveedores: updated, loading: false };
              } else {
                // Si no existe, crea el proveedor con historial
                const nuevoProveedor = { ...resultado.proveedor, ingresos: [ingreso] };
                console.log('🔍 DEBUG - Nuevo proveedor creado:', nuevoProveedor);
                return {
                  proveedores: [
                    ...state.proveedores,
                    nuevoProveedor
                  ],
                  loading: false
                };
              }
            });
          } catch (error: any) {
            // Si el error es porque el proveedor ya tiene pedidos, usar el proveedor existente
            if (error.response?.status === 400 && error.response?.data?.proveedor_existente) {
              console.log('🔍 DEBUG - Proveedor existente con pedidos, usando datos existentes:', error.response.data.proveedor_existente);
              
              const proveedorExistente = error.response.data.proveedor_existente;
              
              set((state) => {
                const idx = state.proveedores.findIndex((p: any) => 
                  p.id_provd === proveedorExistente.id
                );
                
                if (idx !== -1) {
                  // Si existe en el store, agregar el ingreso al historial
                  const updated = [...state.proveedores];
                  if (!updated[idx].ingresos) {
                    updated[idx].ingresos = [];
                  }
                  updated[idx].ingresos.unshift(ingreso);
                  console.log('🔍 DEBUG - Ingreso agregado a proveedor existente en store');
                  return { proveedores: updated, loading: false };
                } else {
                  // Si no existe en el store, agregarlo con el ingreso
                  const nuevoProveedor = { 
                    ...proveedorExistente, 
                    id_provd: proveedorExistente.id,
                    nombres_provd: proveedorExistente.nombre_empresa,
                    direccion_provd: proveedorExistente.direccion,
                    correo: proveedorExistente.email,
                    ingresos: [ingreso] 
                  };
                  console.log('🔍 DEBUG - Nuevo proveedor agregado al store con ingreso');
                  return {
                    proveedores: [
                      ...state.proveedores,
                      nuevoProveedor
                    ],
                    loading: false
                  };
                }
              });
              
              // No propagar el error, ya que es el comportamiento esperado
              return;
            } else {
              // Si es otro tipo de error, propagarlo
              throw error;
            }
          }
        } catch (error: any) {
          console.error('❌ Error en addIngresoProveedor:', error);
          set({ 
            error: error.response?.data?.error || "Error al agregar ingreso", 
            loading: false 
          });
        }
      },

      createProveedor: async (proveedorData: any) => {
        set({ loading: true, error: null });
        try {
          const nuevoProveedor = await proveedoresService.createProveedor(proveedorData);
          set((state) => ({
            proveedores: [...state.proveedores, nuevoProveedor],
            loading: false
          }));
        } catch (error: any) {
          set({ 
            error: error.response?.data?.error || "Error al crear proveedor", 
            loading: false 
          });
        }
      },

      updateProveedor: async (id: number, data: any) => {
        set({ loading: true, error: null });
        try {
          const proveedorActualizado = await proveedoresService.updateProveedor(id.toString(), data);
          set((state) => ({
            proveedores: state.proveedores.map(p => 
              p.id_provd === id ? proveedorActualizado : p
            ),
            loading: false
          }));
        } catch (error: any) {
          set({ 
            error: error.response?.data?.error || "Error al actualizar proveedor", 
            loading: false 
          });
        }
      },

      deleteProveedor: async (id: number) => {
        set({ loading: true, error: null });
        try {
          await proveedoresService.deleteProveedor(id.toString());
          set((state) => ({
            proveedores: state.proveedores.filter(p => p.id_provd !== id),
            loading: false
          }));
        } catch (error: any) {
          set({ 
            error: error.response?.data?.error || "Error al eliminar proveedor", 
            loading: false 
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    { 
      name: "proveedores-storage",
      partialize: (state) => ({ proveedores: state.proveedores }) // Solo persistir proveedores, no loading ni error
    }
  )
);