import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const usuario = useAuthStore(state => state.usuario);
    
    if (!usuario) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};