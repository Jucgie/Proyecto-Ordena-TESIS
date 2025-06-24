import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useBodegaStore } from '../store/useBodegaStore';

export const useVistaSync = () => {
    const usuario = useAuthStore(state => state.usuario);
    const { vista, setVista } = useBodegaStore();
    const hasInitialized = useRef(false);

    useEffect(() => {
        if (usuario && !hasInitialized.current) {
            // Determinar el tipo de usuario basado en sus propiedades
            const tipoUsuario = usuario.tipo || (usuario.bodega ? "bodega" : (usuario.sucursal ? "sucursal" : "desconocido"));
            
            
            // Solo corregir la vista si no coincide y no se ha inicializado antes
            if (tipoUsuario === "bodega" && vista !== "bodega") {
                setVista("bodega");
                hasInitialized.current = true;
            } else if (tipoUsuario === "sucursal" && vista !== "sucursal") {
                setVista("sucursal");
                hasInitialized.current = true;
            } else {
                hasInitialized.current = true;
            }
        }
    }, [usuario]); // Solo depende de usuario, no de vista ni setVista
}; 