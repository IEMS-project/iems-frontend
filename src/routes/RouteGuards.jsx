import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext.jsx";
import { getStoredTokens } from "@/lib/api";

export function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}

export function AdminRoute({ children }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const tokens = getStoredTokens();
    const roles = tokens?.userInfo?.roles || [];
    const isIamAdmin = Array.isArray(roles) && roles.includes("ADMIN");

    if (!isIamAdmin) {
        return <Navigate to="/permission-denied" replace />;
    }

    return children;
}
