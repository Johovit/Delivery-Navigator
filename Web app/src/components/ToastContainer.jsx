import { useAppContext } from "../context/AppContext";

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
          <span className="toast-message">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
