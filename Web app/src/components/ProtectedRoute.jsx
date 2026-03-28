import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppContext } from "../context/AppContext";

export default function ProtectedRoute() {
    const { session, authLoading } = useAuth();
    const { settingsLoading } = useAppContext();

    if (authLoading || settingsLoading) {
        return (
            <div className="page dashboard-page">
                 <div className="empty-state compact">
                     <span className="empty-icon">⏳</span>
                     <p>Loading user settings...</p>
                 </div>
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
