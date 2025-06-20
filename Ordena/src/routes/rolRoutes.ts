export const roleRoutes: Record<string, Record<string, string>> = {
    bodega: {
        pedidos: "/pedidos/bodega",
        historial: "/historial/bodega",
        solicitudes: "/solicitudes/bodega",
    },
    sucursal: {
        pedidos: "/pedidos/sucursal",
        historial: "/historial/sucursal",
        solicitudes: "/solicitudes/sucursal",
    },
    // Agregaremos más roles y módulos en el futuro
};