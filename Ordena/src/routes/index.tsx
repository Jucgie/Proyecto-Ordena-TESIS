import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Pedidos from "../pages/Pedidos";
import Historial from "../pages/Historial";

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/pedidos" replace />} />
                <Route path="/pedidos" element={<Pedidos />} />
                <Route path="/historial" element={<Historial />} />
                {/* Ruta para no encontrados */}
                <Route path="*" element={<Navigate to="/pedidos" replace />} />
            </Routes>
        </BrowserRouter>
    );
}