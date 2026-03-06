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
  deleteRoute,
  clearRoutes,
} from "../services/routeService";
import { fetchCostPerKm, saveCostPerKm } from "../services/settingsService";

const AppContext = createContext(null);

const DEFAULT_SETTINGS = { costPerKm: 10 };

export function AppProvider({ children }) {
  const [routeHistory, setRouteHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Ref lets updateSettings always read the latest settings without
  // being recreated on every settings change (fixes stale closure / re-render cascade)
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  /* ── Initial load (parallel) ───────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchRoutes(), fetchCostPerKm()]).then(([rows, costPerKm]) => {
      if (cancelled) return;
      setRouteHistory(rows);
      setHistoryLoading(false);
      setSettings({ costPerKm });
      setSettingsLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  /* ── Route history actions ─────────────────────────────────────── */
  const addRouteRecord = useCallback(async (record) => {
    await insertRoute(record);
    const rows = await fetchRoutes();
    setRouteHistory(rows);
  }, []);

  const deleteRouteById = useCallback(async (id) => {
    await deleteRoute(id);
    setRouteHistory((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const clearAllRoutes = useCallback(async () => {
    await clearRoutes();
    setRouteHistory([]);
  }, []);

  /* ── Settings actions ──────────────────────────────────────────── */
  // Deps array is empty — reads settings via ref to avoid stale closure
  const updateSettings = useCallback(async (partial) => {
    const next = { ...settingsRef.current, ...partial };
    setSettings(next); // optimistic update
    if (partial.costPerKm !== undefined) {
      await saveCostPerKm(partial.costPerKm);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Toast actions ─────────────────────────────────────────────── */
  const showToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* ── Context value ─────────────────────────────────────────────── */
  const value = useMemo(
    () => ({
      routeHistory,
      historyLoading,
      addRouteRecord,
      deleteRouteById,
      clearAllRoutes,
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
