import { useAppContext } from "../context/AppContext";

/* Icon per toast type */
const ICONS = {
  success: "✅",
  info: "ℹ️",
  error: "❌",
  warning: "⚠️",
};

function ToastContainer() {
  const { toasts, dismissToast } = useAppContext();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type || "success"}`}
          onClick={() => dismissToast(toast.id)}
          role="alert"
          aria-live="polite"
        >
          <span className="toast-icon">{ICONS[toast.type] || ICONS.success}</span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
