import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  fetchRoutes,
  insertRoute,
  updateRouteStatus,
  updateRouteStart,
  deleteRoute,
  clearRoutes,
} from "../services/routeService";
import { fetchCostPerKm, saveCostPerKm } from "../services/settingsService";
import { useAuth } from "./AuthContext";

const AppContext = createContext(null);

const DEFAULT_SETTINGS = { costPerKm: 10 };

export function AppProvider({ children }) {
  const { user } = useAuth();
  const [routeHistory, setRouteHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Ref lets updateSettings always read the latest settings without
  // being recreated on every settings change (fixes stale closure)
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  /* ── Toast actions — defined FIRST so other callbacks can reference them ── */
  const showToast = useCallback((message, type = "success") => {
    const toastId = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id: toastId, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 3000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* ── Initial load (parallel) ───────────────────────────────────── */
  useEffect(() => {
    if (!user) {
      setRouteHistory([]);
      setSettings(DEFAULT_SETTINGS);
      setHistoryLoading(false);
      setSettingsLoading(false);
      return;
    }

    let cancelled = false;
    setHistoryLoading(true);
    setSettingsLoading(true);

    Promise.all([fetchRoutes(), fetchCostPerKm()]).then(([rows, costPerKm]) => {
      if (cancelled) return;

      const now = Date.now();
      const updatedRows = [...rows];

      updatedRows.forEach((r) => {
        if (r.status === "In Progress" && r.start_time && r.estimated_duration) {
          const startMs = new Date(r.start_time).getTime();
          const durationMs = r.estimated_duration * 60 * 1000;
          if (now - startMs >= durationMs) {
            r.status = "Completed";
            r.completed_time = new Date(startMs + durationMs).toISOString();
            updateRouteStatus(r.id, "Completed", { completed_time: r.completed_time });
          }
        }
      });

      setRouteHistory(updatedRows);
      setHistoryLoading(false);
      setSettings({ costPerKm });
      setSettingsLoading(false);
    });

    return () => { cancelled = true; };
  }, [user]);

  /* ── Auto-Complete Background Poller ───────────────────────────── */
  useEffect(() => {
    // Don't run the poller when nobody is logged in
    if (!user) return;

    const intervalId = setInterval(() => {
      setRouteHistory((currentRoutes) => {
        let hasChanges = false;
        const now = Date.now();

        const nextRoutes = currentRoutes.map((r) => {
          if (r.status === "In Progress" && r.start_time && r.estimated_duration) {
            const startMs = new Date(r.start_time).getTime();
            const durationMs = r.estimated_duration * 60 * 1000;

            if (now >= startMs + durationMs) {
              const completed_time = new Date(startMs + durationMs).toISOString();
              updateRouteStatus(r.id, "Completed", { completed_time });
              hasChanges = true;
              return { ...r, status: "Completed", completed_time };
            }
          }
          return r;
        });

        return hasChanges ? nextRoutes : currentRoutes;
      });
    }, 20000);

    return () => clearInterval(intervalId);
  }, [user]);

  /* ── Route history actions ─────────────────────────────────────── */
  const addRouteRecord = useCallback(async (record) => {
    const inserted = await insertRoute(record);
    if (inserted) {
      // Prepend the newly inserted row to avoid a redundant fetchRoutes() round-trip.
      // Supabase returns rows ordered newest-first, so prepending keeps the same order.
      setRouteHistory((prev) => [inserted, ...prev]);
    }
    return inserted;
  }, []);

  const deleteRouteById = useCallback(async (id) => {
    await deleteRoute(id);
    setRouteHistory((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const clearAllRoutes = useCallback(async () => {
    await clearRoutes();
    setRouteHistory([]);
  }, []);

  const updateRouteStatusById = useCallback(async (id, status, extraFields = {}) => {
    try {
      await updateRouteStatus(id, status, extraFields);
      setRouteHistory((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status, ...extraFields } : r))
      );
    } catch (err) {
      showToast(err.message || "Failed to update status", "error");
      throw err;
    }
  }, [showToast]);

  const startRouteDelivery = useCallback(async (id, startTime, estimatedDuration) => {
    try {
      await updateRouteStart(id, startTime, estimatedDuration);
      setRouteHistory((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: "In Progress", start_time: startTime, estimated_duration: estimatedDuration }
            : r
        )
      );
    } catch (err) {
      showToast(err.message || "Failed to start delivery", "error");
      throw err;
    }
  }, [showToast]);

  /* ── Settings actions ──────────────────────────────────────────── */
  const updateSettings = useCallback(async (partial) => {
    const next = { ...settingsRef.current, ...partial };
    setSettings(next);
    if (partial.costPerKm !== undefined) {
      await saveCostPerKm(partial.costPerKm);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Context value ─────────────────────────────────────────────── */
  const value = useMemo(
    () => ({
      routeHistory,
      historyLoading,
      addRouteRecord,
      deleteRouteById,
      clearAllRoutes,
      updateRouteStatusById,
      startRouteDelivery,
      settings,
      settingsLoading,
      updateSettings,
      toasts,
      showToast,
      dismissToast,
    }),
    [
      routeHistory,
      historyLoading,
      addRouteRecord,
      deleteRouteById,
      clearAllRoutes,
      updateRouteStatusById,
      startRouteDelivery,
      settings,
      settingsLoading,
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
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
