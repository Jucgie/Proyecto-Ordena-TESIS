import React from 'react';

interface EstadoBadgeProps {
    estado: string;
    tipo?: 'solicitud' | 'pedido';
}

const EstadoBadge: React.FC<EstadoBadgeProps> = ({ estado, tipo = 'solicitud' }) => {
    const getBadgeStyle = (estado: string, tipo: string) => {
        const baseStyle = {
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: 600,
            color: "#fff",
            textTransform: "capitalize" as const
        };

        if (tipo === 'solicitud') {
            switch (estado.toLowerCase()) {
                case 'aprobada':
                    return { ...baseStyle, backgroundColor: "#4CAF50" };
                case 'denegada':
                    return { ...baseStyle, backgroundColor: "#FF4D4F" };
                case 'pendiente':
                default:
                    return { ...baseStyle, backgroundColor: "#FFD700", color: "#121212" };
            }
        } else if (tipo === 'pedido') {
            switch (estado.toLowerCase()) {
                case 'en camino':
                    return { ...baseStyle, backgroundColor: "#2196F3" };
                case 'entregado':
                case 'completado':
                    return { ...baseStyle, backgroundColor: "#4CAF50" };
                case 'pendiente':
                    return { ...baseStyle, backgroundColor: "#FF9800" };
                default:
                    return { ...baseStyle, backgroundColor: "#757575" };
            }
        }

        return { ...baseStyle, backgroundColor: "#757575" };
    };

    return (
        <span style={getBadgeStyle(estado, tipo)}>
            {estado || (tipo === 'solicitud' ? 'Pendiente' : 'Pendiente')}
        </span>
    );
};

export default EstadoBadge; 