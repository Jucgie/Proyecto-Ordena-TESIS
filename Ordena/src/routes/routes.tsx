import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import PedidosBodega from "../pages/Pedidos/PedidosBodega";
import PedidosSucursal from "../pages/Pedidos/PedidosSucursal";
import Historial from "../pages/Historial";
import SolicitudesSucursal from "../pages/Solicitudes/SolicitudesSucursal";
import SolicitudesBodega from "../pages/Solicitudes/SolicitudesBodega";
import { useBodegaStore } from "../store/useBodegaStore";
import { InicioS } from "../pages/IniciarSesion/IniciarSesion";
import Inventario from "../pages/inventario/inventario";
import Proveedores from "../pages/proveedores/proveedores";
import Empleados from "../pages/Empleados/empleados";

export default function AppRoutes() {
    const { vista } = useBodegaStore();
    
    return (
        <BrowserRouter>
            <Routes>
                {/* Ruta pública */}
                <Route path="/login" element={<InicioS />} />

                {/* Rutas protegidas */}
                <Route path="/" element={
                    <ProtectedRoute>
                        <Navigate to="/pedidos" replace />
                    </ProtectedRoute>
                } />

                <Route path="/pedidos" element={
                    <ProtectedRoute>
                        {vista === "bodega" ? <PedidosBodega /> : <PedidosSucursal />}
                    </ProtectedRoute>
                } />

                <Route path="/solicitudes" element={
                    <ProtectedRoute>
                        {vista === "bodega" ? <SolicitudesBodega /> : <SolicitudesSucursal />}
                    </ProtectedRoute>
                } />

                <Route path="/inventario" element={
                    <ProtectedRoute>
                        <Inventario />
                    </ProtectedRoute>
                } />

                <Route path="/historial" element={
                    <ProtectedRoute>
                        <Historial />
                    </ProtectedRoute>
                } />

                <Route path="/proveedores" element={
                    <ProtectedRoute>
                        <Proveedores />
                    </ProtectedRoute>
                } />

                <Route path="/empleados" element={
                    <ProtectedRoute>
                        <Empleados />
                    </ProtectedRoute>
                } />

                {/* Ruta para no encontrados - redirige a pedidos */}
                <Route path="*" element={
                    <ProtectedRoute>
                        <Navigate to="/pedidos" replace />
                    </ProtectedRoute>
                } />
            </Routes>
        </BrowserRouter>
    );
}