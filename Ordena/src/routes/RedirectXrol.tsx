import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { roleRoutes } from "./rolRoutes";

interface RedirectxrolProps {
    user: { rol: string };
    module: string;
}

export default function Redirectxrol({ user, module }: RedirectxrolProps) {
    const navigate = useNavigate();

    useEffect(() => {
        const ruta = roleRoutes[user.rol]?.[module];
        if (ruta) {
            navigate(ruta, { replace: true });
        } else {
            // Si no hay ruta definida, redirige a inicio o error
            navigate("/", { replace: true });
        }
    }, [user, module, navigate]);

    return null;
}