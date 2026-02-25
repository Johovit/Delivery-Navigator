/* Color variants for stat card icons */
const ICON_VARIANTS = ["", "accent", "success", "warning", "error"];

function StatCard({ label, value, icon, helper, colorIdx = 0 }) {
  const iconClass = `stat-card-icon ${ICON_VARIANTS[colorIdx % ICON_VARIANTS.length]}`;

  return (
    <div className="stat-card">
      <div className={iconClass}>{icon}</div>
      <div className="stat-card-main">
        <span className="stat-card-label">{label}</span>
        <span className="stat-card-value">{value}</span>
        {helper && <span className="stat-card-helper">{helper}</span>}
      </div>
    </div>
  );
}

export default StatCard;
