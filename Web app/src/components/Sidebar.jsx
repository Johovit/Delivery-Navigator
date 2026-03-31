import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logOut } from "../services/authService";

const userNavItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/create-order", label: "Create Order" },
  { to: "/track-orders", label: "Track Orders" },
  { to: "/messages", label: "Support" },
  { to: "/settings", label: "Settings" },
];

const adminNavItems = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/orders", label: "All Orders" },
  { to: "/admin/inbox", label: "Inbox" },
  { to: "/settings", label: "Settings" },
];

function Sidebar({ isOpen = false, onClose = () => {} }) {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = isAdmin ? adminNavItems : userNavItems;

  const handleLogout = async () => {
    try {
      await logOut();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const asideClass = [
    "nav-sidebar",
    collapsed ? "collapsed" : "",
    isOpen ? "mobile-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside className={asideClass} aria-label="Main navigation">
      {/* Header / Logo */}
      <div className="nav-sidebar-header">
        <div className="nav-logo">
          <img src="/logo.svg" alt="Delivery Navigator logo" className="nav-logo-img" />
          <div className="nav-logo-text">
            <h1>Delivery Nav</h1>
            <p className="nav-subtitle">Tamil Nadu Routes</p>
            {isAdmin && (
              <span style={{
                fontSize: "9px", background: "var(--color-error)",
                padding: "2px 6px", borderRadius: "10px", marginTop: "4px",
                display: "inline-block", fontWeight: "bold", color: "white"
              }}>ADMIN</span>
            )}
          </div>
        </div>

        <div className="nav-sidebar-header-actions">
          <button
            className="nav-collapse-btn desktop-only"
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className={`nav-collapse-arrow${collapsed ? " rotated" : ""}`}>‹</span>
          </button>

          <button
            className="nav-collapse-btn mobile-only"
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            title="Close menu"
          >
            Close
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="nav-links">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            title={collapsed ? item.label : undefined}
            onClick={onClose}
          >
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer with user info + logout */}
      <div className="nav-sidebar-footer">
        {!collapsed && (
          <>
            {user && (
              <div className="sidebar-user-info">
                <span className="sidebar-user-avatar-sm">
                  {(user.email?.split("@")[0] || "U").charAt(0).toUpperCase()}
                </span>
                <div style={{ minWidth: 0 }}>
                  <p className="sidebar-user-name">{user.email?.split("@")[0] || "User"}</p>
                  <p className="sidebar-user-email" title={user.email}>{user.email}</p>
                </div>
              </div>
            )}
            <button
              type="button"
              className="sidebar-logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
