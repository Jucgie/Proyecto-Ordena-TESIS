import { Link, useLocation } from "react-router-dom";
import DonutSmallIcon from '@mui/icons-material/DonutSmall';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ManageHistoryIcon from '@mui/icons-material/ManageHistory';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import DescriptionIcon from '@mui/icons-material/Description';
import OrdenaLogo from "../../assets/ordena.svg";
import { useAuthStore } from "../../store/useAuthStore";


export default function Sidebar() {
    const location = useLocation();
    const usuario = useAuthStore(state => state.usuario);

    const links = [
        { to: "/dashboard", icon: DonutSmallIcon, label: "Dashboard" },
        { to: "/inventario", icon: AssignmentIcon, label: "Inventario" },
        { to: "/pedidos", icon: LocalShippingIcon, label: "Pedidos" },
        ...(usuario?.rol === "supervisor"
            ? [{ to: "/empleados", icon: PeopleAltIcon, label: "Empleados" }]
            : []),
        { to: "/historial", icon: ManageHistoryIcon, label: "Historial y Reportes" },
        { to: "/solicitudes", icon: AssignmentIcon, label: "Solicitudes" },
        { to: "/informes", icon: DescriptionIcon, label: "Informes" },
        ...(usuario?.bodega
            ? [{ to: "/proveedores", icon: AssignmentIndIcon, label: "Proveedores" }]
            : []),
    ];
    
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
                <div style={{position:'relative'}}>
                    <h2 style={{ color: "#FFFFFF", fontSize: "24px", margin: 0}}>Ordena
                    </h2>
                    
                    <p style={{position:'absolute',
                        top:'-5px', right:'-45px',fontSize:'11px',margin:0,color:'#1a1a1a',
                        fontWeight:'bold',
                        background:'#ffd700',
                        padding:'1px 5px',
                        borderRadius:'6px'}}
                        >
                        {usuario?.tipo
                            ?(usuario.tipo.charAt(0).toUpperCase()+usuario.tipo.slice(1))
                            : ''
                        }

                           </p>
                </div>
            </div>
            <nav>
                <ul style={{ listStyle: "none", padding: 0 }}>
                    {links.map(link => {
                        const isActive = location.pathname.startsWith(link.to);
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