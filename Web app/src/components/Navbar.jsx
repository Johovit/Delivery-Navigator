import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UserAvatar from "./UserAvatar";

const titles = {
  "/dashboard": { title: "Dashboard", sub: "Your delivery operations at a glance" },
  "/create-order": { title: "Create Order", sub: "Send anything, anywhere from your doorstep" },
  "/track-orders": { title: "Track Orders", sub: "Browse your current and history orders" },
  "/messages": { title: "My Queries", sub: "Chat with our support team" },
  "/admin/orders": { title: "All Orders", sub: "Manage all delivery orders" },
  "/admin/inbox": { title: "Inbox", sub: "Respond to user queries" },
  "/settings": { title: "Settings", sub: "Customize your Delivery Navigator" },
};

function Navbar({ onMenuClick = () => {} }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const page = titles[location.pathname] ?? {
    title: "Delivery Navigator",
    sub: "Smart routing across Tamil Nadu",
  };

  return (
    <header className="top-navbar">
      <button
        type="button"
        className="mobile-menu-btn"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        title="Open menu"
      >
        ☰
      </button>

      <div className="top-navbar-left">
        <h2>{page.title}</h2>
        <span className="top-navbar-sub">{page.sub}</span>
      </div>

      <div className="top-navbar-right">
        {/* Render quick-action buttons based on role */}
        {!isAdmin && (
          <>
            <button
              type="button"
              className="accent-btn"
              onClick={() => navigate("/create-order")}
            >
              📦 <span className="hide-on-mobile">Create Order</span>
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate("/track-orders")}
              style={{ marginLeft: "8px" }}
            >
              🚚 <span className="hide-on-mobile">Track Orders</span>
            </button>
          </>
        )}

        {isAdmin && (
          <button
            type="button"
            className="accent-btn"
            onClick={() => navigate("/admin/orders")}
          >
            📋 <span className="hide-on-mobile">Manage Orders</span>
          </button>
        )}

        {user && (
          <div className="navbar-user-actions">
            <div className="v-divider" />
            {isAdmin && (
              <span style={{
                fontSize: "11px", fontWeight: "bold", color: "var(--color-error)",
                border: "1px solid var(--color-error)", padding: "2px 6px",
                borderRadius: "12px", background: "var(--color-error-pale)"
              }}>Admin</span>
            )}
            <UserAvatar email={user.email} />
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
