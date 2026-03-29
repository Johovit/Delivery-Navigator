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
import PlanRoute from "./pages/PlanRoute";
import RouteHistory from "./pages/RouteHistory";
import Settings from "./pages/Settings";
import ToastContainer from "./components/ToastContainer";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminLogin from "./pages/AdminLogin";
import { AuthProvider } from "./context/AuthContext";

/* Layout wraps every authenticated page and owns the mobile-sidebar state */
function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  return (
    <div className="layout-shell">
      {/* Sidebar — always in the DOM; CSS drives desktop vs. mobile behaviour */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Semi-transparent overlay — visible only on mobile when drawer is open */}
      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <div className="layout-main">
        <Navbar onMenuClick={openSidebar} />
        <main className="layout-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>Delivery Navigator · Smart routing across Tamil Nadu</span>
          <span className="footer-tagline">
            Designed for Tamil Nadu logistics and delivery operations
          </span>
        </footer>
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
            
            <Route path="/" element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="plan" element={<PlanRoute />} />
                <Route path="history" element={<RouteHistory />} />
                
                <Route element={<AdminRoute />}>
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Route>
            </Route>
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
