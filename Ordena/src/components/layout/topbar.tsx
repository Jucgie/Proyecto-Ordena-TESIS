import React, { useState } from "react";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useBodegaStore } from "../../store/useBodegaStore";
import { useAuthStore } from "../../store/useAuthStore";
import { BODEGA_CENTRAL } from "../../constants/ubicaciones";
import { SUCURSALES } from "../../constants/ubicaciones"; // Asegúrate de tener este array con tus sucursales


export default function Topbar() {
    const { vista, setVista } = useBodegaStore();
    const usuario = useAuthStore(state => state.usuario);
    const logout = useAuthStore(state => state.logout);
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        window.location.href = "/login";
    };

        // Obtener nombre de la ubicación
    let ubicacionNombre = "";
    if (usuario?.tipo === "bodega") {
        ubicacionNombre = BODEGA_CENTRAL.nombre;
    } else if (usuario?.tipo === "sucursal" && usuario.sucursalId) {
        const sucursal = SUCURSALES.find(s => s.id === usuario.sucursalId);
        ubicacionNombre = sucursal ? sucursal.nombre : "Sucursal desconocida";
    }
    return (
        <header
            style={{
                width: "calc(100% - 200px)",
                height: "64px",
                background: "#1a1a1a",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                padding: "0 2rem",
                boxSizing: "border-box",
                borderBottom: "1px solid #232323",
                position: "fixed",
                left: "200px",
                top: 0,
                zIndex: 100,
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", position: "relative" }}>
                <select
                    value={vista}
                    onChange={e => setVista(e.target.value as "bodega" | "sucursal")}
                    style={{
                        background: "#232323",
                        color: "#FFD700",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 16px",
                        fontSize: "16px",
                        outline: "none",
                        fontWeight: 500,
                    }}
                >
                    <option value="bodega">Bodega</option>
                    <option value="sucursal">Sucursal</option>
                </select>

                <AccountCircleIcon style={{ color: "#FFD700", fontSize: 32 }} />
                <span
                    style={{ color: "#FFD700", fontWeight: 500, cursor: "pointer", userSelect: "none" }}
                    onClick={() => setMenuOpen(v => !v)}
                >
                    {usuario?.nombre || "Usuario"}
                </span>
                {menuOpen && (
                    <div
                        style={{
                            position: "absolute",
                            top: "48px",
                            right: 0,
                            background: "#232323",
                            border: "1px solid #FFD700",
                            borderRadius: "8px",
                            minWidth: "180px",
                            zIndex: 200,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                        }}
                        onMouseLeave={() => setMenuOpen(false)}
                    >
                        <div style={{ padding: "12px 16px", color: "#FFD700", borderBottom: "1px solid #FFD700" }}>
                            Rol: <b>{usuario?.rol ? usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1) : "Sin rol"}</b>
                            <br />
                            Ubicación: <b>{ubicacionNombre || "No asignada"}</b>
                        </div>
                        <div
                            style={{
                                padding: "12px 16px",
                                color: "#FFD700",
                                cursor: "pointer",
                                textAlign: "left"
                            }}
                            onClick={handleLogout}
                        >
                            Cerrar sesión
                    </div>
                </div>
                )}
            </div>
        </header>
    );
}