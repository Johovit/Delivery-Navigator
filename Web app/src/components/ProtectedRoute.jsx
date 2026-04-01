import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppContext } from "../context/AppContext";
import { Loader } from "lucide-react";

export default function ProtectedRoute() {
    const { session, authLoading, roleLoading } = useAuth();
    const { settingsLoading } = useAppContext();

    if (authLoading || settingsLoading || roleLoading) {
        return (
            <div className="page dashboard-page" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                 <div className="empty-state compact" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent' }}>
                     <Loader className="spin" size={24} color="var(--color-primary-mid)" />
                     <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading...</p>
                 </div>
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
