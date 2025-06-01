import { Link, useLocation } from "react-router-dom";
import DonutSmallIcon from '@mui/icons-material/DonutSmall';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ManageHistoryIcon from '@mui/icons-material/ManageHistory';
import OrdenaLogo from "../../assets/ordena.svg";

const links = [
    { to: "/dashboard", icon: DonutSmallIcon, label: "Dashboard" },
    { to: "/inventario", icon: AssignmentIcon, label: "Inventario" },
    { to: "/pedidos", icon: LocalShippingIcon, label: "Pedidos" },
    { to: "/empleados", icon: PeopleAltIcon, label: "Empleados" },
    { to: "/historial", icon: ManageHistoryIcon, label: "Historial y Reportes" },
];

export default function Sidebar() {
    const location = useLocation();

    return (
        <aside style={{ width: "200px",
                        height: "100vh",
                        position: "fixed",
                        left: 0,
                        top: 0,
                        background: "#121212",
                        zIndex: 200,
                        padding: "1rem"}}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "32px" }}>
                <img src={OrdenaLogo} alt="Logo" style={{ width: "40px", height: "40px", marginRight: "10px" }} />
                <h2 style={{ color: "#FFFFFF", fontSize: "24px", margin: 0 }}>Ordena</h2>
            </div>
            <nav>
                <ul style={{ listStyle: "none", padding: 0 }}>
                    {links.map(link => {
                        const isActive = location.pathname === link.to;
                        const Icon = link.icon;
                        return (
                            <li
                                key={link.to}
                                style={{
                                    marginBottom: "32px",
                                    background: isActive ? "rgba(255, 215, 0, 0.12)" : "transparent",
                                    position: "relative",
                                    borderRadius: "8px",
                                    minHeight: "40px",
                                    display: "flex",
                                    alignItems: "center"
                                }}
                            >
                                {isActive && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            height: "60%",
                                            width: "5px",
                                            background: "#FFD700",
                                            borderRadius: "4px"
                                        }}
                                    />
                                )}
                                <Link
                                    to={link.to}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        color: isActive ? "#FFD700" : "#8A8A8A",
                                        textDecoration: "none",
                                        gap: "12px",
                                        width: "100%",
                                        padding: "10px 16px 10px 20px",
                                        zIndex: 1
                                    }}
                                >
                                    <Icon style={{ color: isActive ? "#FFD700" : "#8A8A8A" }} />
                                    {link.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
}