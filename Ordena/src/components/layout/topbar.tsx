import React, { useState } from "react";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export default function Topbar() {
    const [sucursal, setSucursal] = useState("Bodega Central");

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
            {/* Perfil de usuario y selector de sucursal */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <select
                    value={sucursal}
                    onChange={e => setSucursal(e.target.value)}
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
                    <option value="Bodega Central">Bodega Central</option>
                    {/* Aquí puedes agregar más sucursales en el futuro */}
                </select>

                <AccountCircleIcon style={{ color: "#FFD700", fontSize: 32 }} />
                <span style={{ color: "#FFD700", fontWeight: 500 }}>admin</span>
                
            </div>
        </header>
    );
}