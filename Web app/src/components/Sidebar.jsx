import { useState } from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/plan", label: "Plan Route", icon: "🧭" },
  { to: "/history", label: "Route History", icon: "📜" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

/**
 * Sidebar
 *
 * Desktop (>= 768 px):
 *   - Always visible, sits in normal document flow.
 *   - Collapsible (expanded ↔ minimised) via the ‹ toggle button.
 *
 * Mobile (< 768 px):
 *   - position: fixed, full-height drawer.
 *   - Hidden by default (transform: translateX(-100%)).
 *   - Slides in when `isOpen` is true.
 *   - Closes via: overlay click (parent), nav-item click, or the ✕ close button.
 *
 * Props
 *   isOpen  {boolean} – controlled by Layout (mobile only)
 *   onClose {fn}      – called when the drawer should close   (mobile only)
 */
function Sidebar({ isOpen = false, onClose = () => { } }) {
  /* Desktop-only collapse state */
  const [collapsed, setCollapsed] = useState(false);

  /* Build the class string for the <aside> element:
     - "collapsed"   = desktop minimised state
     - "mobile-open" = mobile drawer is open (JS-controlled) */
  const asideClass = [
    "nav-sidebar",
    collapsed ? "collapsed" : "",
    isOpen ? "mobile-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside className={asideClass} aria-label="Main navigation">
      {/* ── Header / Logo ── */}
      <div className="nav-sidebar-header">
        <div className="nav-logo">
          <img
            src="/logo.svg"
            alt="Delivery Navigator logo"
            className="nav-logo-img"
          />
          {/* Always in DOM — CSS fades & slides it */}
          <div className="nav-logo-text">
            <h1>Delivery Nav</h1>
            <p className="nav-subtitle">Tamil Nadu Routes</p>
          </div>
        </div>

        <div className="nav-sidebar-header-actions">
          {/* Desktop collapse toggle */}
          <button
            className="nav-collapse-btn desktop-only"
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className={`nav-collapse-arrow${collapsed ? " rotated" : ""}`}>
              ‹
            </span>
          </button>

          {/* Mobile close button — visible only on mobile */}
          <button
            className="nav-collapse-btn mobile-only"
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            title="Close menu"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Navigation Links ── */}
      <nav className="nav-links">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `nav-link${isActive ? " active" : ""}`
            }
            title={collapsed ? item.label : undefined}
            /* Close mobile drawer when a link is tapped */
            onClick={onClose}
          >
            <span className="nav-icon">{item.icon}</span>
            {/* Always in DOM — CSS fades out when collapsed */}
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── Footer branding ── */}
      <div className="nav-sidebar-footer">Tamil Nadu Logistics © 2026</div>
    </aside>
  );
}

export default Sidebar;
