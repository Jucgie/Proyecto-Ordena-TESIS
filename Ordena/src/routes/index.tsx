import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Pedidos from "../pages/Pedidos";
import Historial from "../pages/Historial";
import { InicioS } from "../pages/IniciarSesion/IniciarSesion";
import { Inventario } from "../pages/inventario/inventario";

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<InicioS/>}/>
                <Route path="/" element={<Navigate to="/pedidos" replace />} />
                <Route path="/pedidos" element={<Pedidos />} />
                <Route path="/historial" element={<Historial />} />
                <Route path="/inventario" element={<Inventario />} />
                {/* Otras rutas */}
                {/* Puedes agregar más rutas aquí según sea necesario */}
                {/* Ruta para no encontrados */}
                <Route path="*" element={<Navigate to="/pedidos" replace />} />
            </Routes>
        </BrowserRouter>
    );
}