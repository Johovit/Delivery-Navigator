import { useLocation, useNavigate } from "react-router-dom";

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

      <div className="top-navbar-right">
        <button
          type="button"
          className="accent-btn"
          onClick={() => navigate("/plan")}
        >
          🧭 Plan Route
        </button>
      </div>
    </header>
  );
}

export default Navbar;
