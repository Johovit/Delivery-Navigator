import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppContext } from "../context/AppContext";

export default function AdminRoute() {
    const { session, authLoading, isAdmin, roleLoading } = useAuth();
    const { settingsLoading } = useAppContext();

    if (authLoading || settingsLoading || roleLoading) {
        return (
            <div className="page dashboard-page">
                 <div className="empty-state compact">
                     <p>Verifying access...</p>
                 </div>
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/admin-login" replace />;
    }

    if (!roleLoading && !authLoading && !isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}
