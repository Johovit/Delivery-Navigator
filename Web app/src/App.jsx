import "./App.css";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { useState, useCallback } from "react";
import { AppProvider } from "./context/AppContext";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import CreateOrder from "./pages/CreateOrder";
import TrackOrders from "./pages/TrackOrders";
import UserMessages from "./pages/UserMessages";
import Settings from "./pages/Settings";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminInbox from "./pages/admin/AdminInbox";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ToastContainer from "./components/ToastContainer";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import UserRoute from "./components/UserRoute";
import AdminLogin from "./pages/AdminLogin";
import { AuthProvider, useAuth } from "./context/AuthContext";

function RootRedirect() {
  const { isAdmin, authLoading, roleLoading } = useAuth();
  if (authLoading || roleLoading) return null;
  return <Navigate to={isAdmin ? "admin/dashboard" : "dashboard"} replace />;
}

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  return (
    <div className="layout-shell">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} aria-hidden="true" />
      )}
      <div className="layout-main">
        <Navbar onMenuClick={openSidebar} />
        <main className="layout-content">
          <Outlet />
        </main>
        <ToastContainer />
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/admin-login" element={<AdminLogin />} />

            {/* All authenticated routes share the Layout shell */}
            <Route path="/" element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route index element={<RootRedirect />} />

                {/* User routes */}
                <Route element={<UserRoute />}>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="create-order" element={<CreateOrder />} />
                  <Route path="messages" element={<UserMessages />} />
                </Route>

                {/* Admin-only routes */}
                <Route element={<AdminRoute />}>
                  <Route path="admin/dashboard" element={<AdminDashboard />} />
                  <Route path="admin/orders" element={<AdminOrders />} />
                  <Route path="admin/inbox" element={<AdminInbox />} />
                </Route>

                {/* Shared routes (accessible by both user and admin) */}
                <Route path="track-orders" element={<TrackOrders />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>

            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
