import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  loadRouteHistory,
  saveRouteHistory,
  loadSettings,
  saveSettings,
} from "../utils/storage";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [routeHistory, setRouteHistory] = useState(() => loadRouteHistory());
  const [settings, setSettings] = useState(() => loadSettings());
  const [toasts, setToasts] = useState([]);

  /* ── Route history actions ─────────────────────────────────────── */

  const addRouteRecord = useCallback((record) => {
    setRouteHistory((prev) => {
      const next = [...prev, record];
      saveRouteHistory(next);
      return next;
    });
  }, []); // no external deps — uses functional updater form

  const deleteRouteById = useCallback((id) => {
    setRouteHistory((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveRouteHistory(next);
      return next;
    });
  }, []);

  const clearAllRoutes = useCallback(() => {
    setRouteHistory([]);
    saveRouteHistory([]);
  }, []);

  /* ── Settings actions ──────────────────────────────────────────── */

  const updateSettings = useCallback((partial) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  /* ── Toast actions ─────────────────────────────────────────────── */

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    // auto-dismiss after 3 s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* ── Context value ─────────────────────────────────────────────── */
  /*
   * All callback refs are stable (useCallback with [] deps), so useMemo
   * only re-runs when the actual data (routeHistory / settings / toasts)
   * changes — preventing unnecessary re-renders of every consumer.
   */
  const value = useMemo(
    () => ({
      routeHistory,
      addRouteRecord,
      deleteRouteById,
      clearAllRoutes,
      settings,
      updateSettings,
      toasts,
      showToast,
      dismissToast,
    }),
    [
      routeHistory,
      addRouteRecord,
      deleteRouteById,
      clearAllRoutes,
      settings,
      updateSettings,
      toasts,
      showToast,
      dismissToast,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return ctx;
}
