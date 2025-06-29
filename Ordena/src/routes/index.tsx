import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Pedidos from "../pages/Pedidos";
import Historial from "../pages/Historial";
import { InicioS } from "../pages/IniciarSesion/IniciarSesion";
import { Dashboard } from "../pages/dashboard/Dashboard";
import QRScannerPage from "../pages/QRScannerPage";
import QRGeneratorPage from "../pages/QRGeneratorPage";

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<InicioS/>}/>
                <Route path="/" element={<Navigate to="/pedidos" replace />} />
                <Route path="/pedidos" element={<Pedidos />} />
                <Route path="/historial" element={<Historial />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/qr-scanner" element={<QRScannerPage />} />
                <Route path="/qr-generator" element={<QRGeneratorPage />} />
                
                {/* Rutas adicionales */}
                {/* Puedes agregar más rutas aquí según sea necesario */}
                {/* Otras rutas */}
                {/* Puedes agregar más rutas aquí según sea necesario */}
                {/* Ruta para no encontrados */}
                <Route path="*" element={<Navigate to="/pedidos" replace />} />
            </Routes>
        </BrowserRouter>
    );
}