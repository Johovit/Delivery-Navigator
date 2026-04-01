import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  LayoutDashboard, 
  PlusCircle, 
  Truck, 
  LifeBuoy, 
  Settings, 
  ListOrdered, 
  Inbox, 
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";

const userNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/create-order", label: "Create Order", icon: PlusCircle },
  { to: "/track-orders", label: "Track Orders", icon: Truck },
  { to: "/messages", label: "Support", icon: LifeBuoy },
  { to: "/settings", label: "Settings", icon: Settings },
];

const adminNavItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/orders", label: "All Orders", icon: ListOrdered },
  { to: "/admin/inbox", label: "Inbox", icon: Inbox },
  { to: "/settings", label: "Settings", icon: Settings },
];

function Sidebar({ isOpen = false, onClose = () => {} }) {
  const { isAdmin } = useAuth();

  // Initialize with localStorage value if present, else false
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    return saved === "true";
  });

  // Keep localStorage perfectly synced with state, but only when user manually toggles
  const handleToggle = () => {
    const newVal = !collapsed;
    setCollapsed(newVal);
    localStorage.setItem("sidebar_collapsed", newVal);
  };

  // Robust responsive fallback handler
  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        if (width > 1024) {
          // Desktop: read their true preference
          const saved = localStorage.getItem("sidebar_collapsed");
          setCollapsed(saved === "true");
        } else {
          // Tablet & Mobile: drawer layout handles itself perfectly when expanded (collapsed=false)
          setCollapsed(false);
        }
      }, 100);
    };
    
    // Check purely on mount so it's correct from the start
    handleResize();
    
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const navItems = isAdmin ? adminNavItems : userNavItems;

  const asideClass = [
    "nav-sidebar",
    collapsed ? "collapsed" : "",
    isOpen ? "mobile-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? "open" : ""}`} 
        onClick={onClose}
        aria-hidden="true" 
      />
      <aside className={asideClass} aria-label="Main navigation">
        {/* Floating Desktop Toggle */}
        <button
          className="nav-collapse-btn desktop-only"
          type="button"
          onClick={handleToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Header / Logo */}
        <div className="nav-sidebar-header">
          <div className="nav-logo">
            <img src="/logo.svg" alt="Delivery Navigator logo" className="nav-logo-img" />
            <div className="nav-logo-text">
              <h1>Delivery Nav</h1>
              <p className="nav-subtitle">Tamil Nadu Routes</p>
              {isAdmin && (
                <span className="admin-badge">ADMIN</span>
              )}
            </div>
          </div>

          <button
            className="nav-close-btn mobile-only"
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            title="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                onClick={onClose}
              >
                <div className="nav-icon-container">
                  <Icon size={20} className="nav-icon" />
                </div>
                <span className="nav-label">{item.label}</span>
                
                {/* Custom Tooltip */}
                <div className="nav-tooltip">{item.label}</div>
              </NavLink>
            );
          })}
        </nav>


      </aside>
    </>
  );
}

export default Sidebar;
