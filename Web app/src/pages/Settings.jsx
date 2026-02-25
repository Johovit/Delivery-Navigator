import { useState } from "react";
import { useAppContext } from "../context/AppContext";

function Settings() {
  const { settings, updateSettings, showToast } = useAppContext();
  const [costPerKm, setCostPerKm] = useState(settings.costPerKm);

  const handleSave = (e) => {
    e.preventDefault();
    const parsedCost = Number(costPerKm) || 0;
    updateSettings({ costPerKm: parsedCost });
    showToast("Settings saved", "success");
  };

  return (
    <div className="page">
      {/* Page header */}
      <div className="page-header-row">
        <div>
          <h3>Settings</h3>
          <p className="page-sub">Customize your Delivery Navigator experience.</p>
        </div>
      </div>

      <form className="settings-form" onSubmit={handleSave}>
        <p className="settings-section-title">Preferences</p>

        {/* Cost per KM */}
        <div className="settings-group">
          <label className="settings-label">
            <span>Cost per KM (₹)</span>
            <span className="settings-helper">
              Used to estimate delivery cost for each planned route.
            </span>
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={costPerKm}
            onChange={(e) => setCostPerKm(e.target.value)}
            className="settings-input"
            aria-label="Cost per kilometer"
          />
        </div>

        <button type="submit" className="primary-btn settings-save-btn">
          ✓ Save Settings
        </button>
      </form>
    </div>
  );
}

export default Settings;
