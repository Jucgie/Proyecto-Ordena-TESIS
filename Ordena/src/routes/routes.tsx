import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import PedidosBodega from "../pages/Pedidos/PedidosBodega";
import PedidosSucursal from "../pages/Pedidos/PedidosSucursal";
import Historial from "../pages/Historial";
import Informes from "../pages/Historial/informes";
import SolicitudesSucursal from "../pages/Solicitudes/SolicitudesSucursal";
import SolicitudesBodega from "../pages/Solicitudes/SolicitudesBodega";
import { useBodegaStore } from "../store/useBodegaStore";
import { InicioS } from "../pages/IniciarSesion/IniciarSesion";
import Inventario from "../pages/inventario/inventario";
import Proveedores from "../pages/proveedores/proveedores";
import Empleados from "../pages/Empleados/empleados";
import {Dashboard} from "../pages/dashboard/Dashboard";
import EmpleadosBodega from "../pages/Empleados/empleadosBodega";

export default function AppRoutes() {
    const { vista } = useBodegaStore();
    
    console.log('AppRoutes - Vista actual:', vista);
    
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

                <Route path="/informes" element={
                    <ProtectedRoute>
                        <Informes />
                    </ProtectedRoute>
                } />

                <Route path="/proveedores" element={
                    <ProtectedRoute>
                        <Proveedores />
                    </ProtectedRoute>
                } />

                <Route path="/empleados" element={
                    <ProtectedRoute>
                       {vista === "bodega"? <EmpleadosBodega /> : <Empleados />}
                    </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } />

                {/* Ruta de fallback */}
                <Route path="*" element={<Navigate to="/pedidos" replace />} />
            </Routes>
        </BrowserRouter>
    );
}