import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logOut } from "../services/authService";
import UserAvatar from "./UserAvatar";

const titles = {
  "/dashboard": {
    title: "Dashboard Overview",
    sub: "Your delivery operations at a glance",
  },
  "/plan": {
    title: "Plan Route",
    sub: "Find the best route between Tamil Nadu cities",
  },
  "/history": {
    title: "Route History",
    sub: "Browse your previously planned deliveries",
  },
  "/settings": {
    title: "Settings",
    sub: "Customize your Delivery Navigator",
  },
};

/**
 * Top navigation bar.
 *
 * Props
 *   onMenuClick {fn} – called when the hamburger button is pressed (mobile).
 */
function Navbar({ onMenuClick = () => { } }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await logOut();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const page = titles[location.pathname] ?? {
    title: "Delivery Navigator",
    sub: "Smart routing across Tamil Nadu",
  };

  return (
    <header className="top-navbar">
      {/* Hamburger — only visible on mobile (< 768 px), opens the sidebar drawer */}
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

      <div className="top-navbar-right" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button
          type="button"
          className="accent-btn"
          onClick={() => navigate("/plan")}
        >
          🧭 <span className="hide-on-mobile">Plan Route</span>
        </button>

        {user && (
          <div className="navbar-user-actions" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="v-divider" style={{ width: "1px", height: "30px", background: "var(--border)", opacity: 0.6 }}></div>
            
            {/* The new UserAvatar component placed exactly between the divider and Logout */}
            <UserAvatar email={user.email} />
            
            <button
              type="button"
              className="secondary-btn logout-nav-btn"
              onClick={handleLogout}
              title="Logout"
              style={{ padding: "8px 14px", gap: "6px" }}
            >
              🔓 <span className="hide-on-mobile">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
