import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { logOut } from "../services/authService";

function Settings() {
  const { settings, updateSettings, showToast } = useAppContext();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [costPerKm, setCostPerKm] = useState(settings.costPerKm);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    const parsedCost = Number(costPerKm) || 0;
    await updateSettings({ costPerKm: parsedCost });
    showToast("Settings saved", "success");
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logOut();
      navigate("/login", { replace: true });
    } catch (err) {
      showToast(err.message || "Logout failed", "error");
      setIsLoggingOut(false);
    }
  };

  // Username derived from email
  const username = user?.email?.split("@")[0] || "User";

  return (
    <div className="page settings-page">
      {/* Logout confirmation dialog */}
      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon" aria-hidden="true">!</div>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out of Delivery Navigator?</p>
            <div className="confirm-actions">
              <button
                className="secondary-btn"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
              >
                Cancel
              </button>
              <button
                className="logout-btn"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Logging out…" : "Yes, Logout"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h3>Settings</h3>
          <p className="page-sub">Manage your account and preferences</p>
        </div>
        {isAdmin && (
          <span className="admin-badge-pill">Admin</span>
        )}
      </div>

      {/* Profile Card */}
      <div className="settings-card">
        <div className="settings-card-header">
          <h4>Account</h4>
        </div>
        <div className="settings-profile-row">
          <div className="settings-avatar">
            {username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="settings-username">{username}</p>
            <p className="settings-email">{user?.email}</p>
            <span className={`settings-role-chip ${isAdmin ? "admin" : "user"}`}>
              {isAdmin ? "Administrator" : "Customer"}
            </span>
          </div>
        </div>
      </div>

      {/* Admin-only: Cost Per KM */}
      {isAdmin && (
        <div className="settings-card">
          <div className="settings-card-header">
            <h4>Pricing Configuration</h4>
          </div>
          <form onSubmit={handleSave}>
            <div className="settings-group">
              <label className="settings-label">
                <span>Cost per KM (₹)</span>
                <span className="settings-helper">
                  Applied to all new delivery orders for cost estimation.
                </span>
              </label>
              <div className="settings-input-row">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={costPerKm}
                  onChange={(e) => setCostPerKm(e.target.value)}
                  className="settings-input"
                  aria-label="Cost per kilometer"
                />
                <button type="submit" className="primary-btn settings-save-btn">
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      )}



      {/* Logout Card */}
      <div className="settings-card settings-card--danger">
        <div className="settings-card-header">
          <h4>Session</h4>
        </div>
        <p className="settings-logout-desc">
          You are signed in as <strong>{user?.email}</strong>.
          Logging out will clear your session and redirect you to the login page.
        </p>
        <button
          className="logout-btn logout-btn--full"
          onClick={() => setShowLogoutConfirm(true)}
          disabled={isLoggingOut}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Settings;
