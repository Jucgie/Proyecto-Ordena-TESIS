import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PedidosBodega from "../pages/Pedidos/PedidosBodega";
import PedidosSucursal from "../pages/Pedidos/PedidosSucursal";
import Historial from "../pages/Historial";

import SolicitudesSucursal from "../pages/Solicitudes/SolicitudesSucursal";
import SolicitudesBodega from "../pages/Solicitudes/SolicitudesBodega"; // crea este archivo si no existe
//import HistorialSucursal from "../pages/Historial/HistorialSucursal"; // crea este archivo si no existe
import Redirectxrol from "./RedirectXrol";
import { useBodegaStore } from "../store/useBodegaStore";
// Simulación de usuario autenticado



export default function AppRoutes() {
    const { vista } = useBodegaStore();
    return (

        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/pedidos" replace />} />
                {/* Rutas para las solicitudes */}
                <Route path="/solicitudes" element={vista === "bodega" ? <SolicitudesBodega /> : <SolicitudesSucursal />} />

                {/* Rutas para los pedidos */}
                <Route path="/pedidos" element={vista === "bodega" ? <PedidosBodega /> : <PedidosSucursal />} />

                {/* Rutas para el historial */}
                {/* <Route path="/historial" element={<Redirectxrol user={user} module="historial" />}  />
                <Route path="/historial/bodega" element={<Historial />} /> */}
                {/* <Route path="/historial/sucursal" element={<HistorialSucursal />} /> */}
                {/* Ruta para no encontrados */}
                <Route path="*" element={<Navigate to="/pedidos" replace />} />
                
            </Routes>
        </BrowserRouter>
    );
}