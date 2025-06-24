import { create } from "zustand";

interface PedidoSucursal {
    id: number;
    fecha_creacion: string;
    estado: string;
    detalles?: any[];
    total?: number;
}

interface PedidosSucursalState {
    pedidos: PedidoSucursal[];
    loading: boolean;
    addPedido: (pedido: PedidoSucursal) => void;
    clearPedidos: () => void;
    setPedidos: (pedidos: PedidoSucursal[]) => void;
    setLoading: (loading: boolean) => void;
}

export const usePedidosSucursalStore = create<PedidosSucursalState>((set) => ({
    pedidos: [],
    loading: false,
    addPedido: (pedido) => set((state) => ({ 
        pedidos: [...state.pedidos, pedido] 
    })),
    clearPedidos: () => set({ pedidos: [] }),
    setPedidos: (pedidos) => set({ pedidos }),
    setLoading: (loading) => set({ loading }),
})); 