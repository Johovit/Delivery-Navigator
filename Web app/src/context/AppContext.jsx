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
  fetchOrders,
  insertOrder,
  updateOrderStatus,
  deleteOrder,
  clearOrders,
} from "../services/orderService";
import { fetchCostPerKm, saveCostPerKm } from "../services/settingsService";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabaseClient";

const AppContext = createContext(null);

const DEFAULT_SETTINGS = { costPerKm: 10 };

export function AppProvider({ children }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
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
      setOrders([]);
      setSettings(DEFAULT_SETTINGS);
      setOrdersLoading(false);
      setSettingsLoading(false);
      return;
    }

    let cancelled = false;
    setOrdersLoading(true);
    setSettingsLoading(true);

    Promise.all([fetchOrders(), fetchCostPerKm()]).then(([rows, costPerKm]) => {
      if (cancelled) return;

      const updatedRows = runLifecycleCheck([...rows]);

      setOrders(updatedRows);
      setOrdersLoading(false);
      setSettings({ costPerKm });
      setSettingsLoading(false);
    });

    const settingsChannel = supabase.channel("app_settings_watcher")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "app_settings" },
        (payload) => {
          if (payload.new?.cost_per_km !== undefined) {
            setSettings({ costPerKm: Number(payload.new.cost_per_km) });
          }
        }
      )
      .subscribe();

    // Realtime orders updates for current user
    const ordersChannel = supabase
      .channel(`orders_watcher_${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const next = payload.new;
          const old = payload.old;
          setOrders((prev) => {
            if (payload.eventType === "INSERT") {
              return [normalizeOrder(next), ...prev];
            }
            if (payload.eventType === "UPDATE") {
              return prev.map((o) => (o.id === next.id ? normalizeOrder({ ...o, ...next }) : o));
            }
            if (payload.eventType === "DELETE") {
              return prev.filter((o) => o.id !== old.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    // ── Auto-lifecycle check ──────────────────────────────────────
    // Runs on load, then every 30 seconds.
    // planned → in_progress when pickup_time <= now
    // in_progress → completed when delivery_time <= now
    const runLifecycleCheck = (currentOrders) => {
      const now = Date.now();
      currentOrders.forEach((r) => {
        if (r.status === "planned" && r.pickup_time) {
          const pickupMs = new Date(r.pickup_time).getTime();
          if (now >= pickupMs) {
            // Calculate new delivery_time based on estimated duration
            const durationMins = r.estimated_duration_minutes || 30;
            const deliveryTime = new Date(now + durationMins * 60 * 1000).toISOString();
            r.status = "in_progress";
            r.pickup_time = new Date(now).toISOString();
            r.delivery_time = deliveryTime;
            updateOrderStatus(r.id, "in_progress", {
              pickup_time: r.pickup_time,
              delivery_time: deliveryTime,
            });
          }
        }
        if (r.status === "in_progress" && r.delivery_time) {
          const deliveryMs = new Date(r.delivery_time).getTime();
          if (now >= deliveryMs) {
            r.status = "completed";
            updateOrderStatus(r.id, "completed");
          }
        }
      });
      return [...currentOrders];
    };

    return () => {
      cancelled = true;
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [user]);

  // ── Periodic lifecycle check every 30s ───────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders((prev) => {
        const now = Date.now();
        let changed = false;
        const updated = prev.map((r) => {
          const copy = { ...r };
          if (copy.status === "planned" && copy.pickup_time) {
            if (now >= new Date(copy.pickup_time).getTime()) {
              const durationMins = copy.estimated_duration_minutes || 30;
              const deliveryTime = new Date(now + durationMins * 60 * 1000).toISOString();
              copy.status = "in_progress";
              copy.pickup_time = new Date(now).toISOString();
              copy.delivery_time = deliveryTime;
              updateOrderStatus(copy.id, "in_progress", { pickup_time: copy.pickup_time, delivery_time: deliveryTime });
              changed = true;
            }
          }
          if (copy.status === "in_progress" && copy.delivery_time) {
            if (now >= new Date(copy.delivery_time).getTime()) {
              copy.status = "completed";
              updateOrderStatus(copy.id, "completed");
              changed = true;
            }
          }
          return copy;
        });
        return changed ? updated : prev;
      });
    }, 30000); // every 30 seconds
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Route history actions ─────────────────────────────────────── */
  const addOrder = useCallback(async (record) => {
    const inserted = await insertOrder(record);
    if (inserted) {
      setOrders((prev) => [inserted, ...prev]);
    } else {
      throw new Error("Database insertion failed. Have you configured RLS or tables properly?");
    }
    return inserted;
  }, []);

  const deleteOrderById = useCallback(async (id) => {
    await deleteOrder(id);
    setOrders((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const clearAllOrders = useCallback(async () => {
    await clearOrders();
    setOrders([]);
  }, []);

  const updateOrderStatusById = useCallback(async (id, status, extraFields = {}) => {
    try {
      await updateOrderStatus(id, status, extraFields);
      setOrders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status, ...extraFields } : r))
      );
    } catch (err) {
      showToast(err.message || "Failed to update status", "error");
      throw err;
    }
  }, [showToast]);

  const startOrderDelivery = useCallback(async (id, estimatedDurationMinutes) => {
    try {
      const startTime = new Date().toISOString();
      // Use the stored estimated_duration_minutes from the order, fallback to 30 min
      const durationMins = estimatedDurationMinutes || 30;
      const deliveryTime = new Date(Date.now() + durationMins * 60 * 1000).toISOString();

      await updateOrderStatus(id, "in_progress", {
        pickup_time: startTime,
        delivery_time: deliveryTime,
      });
      setOrders((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: "in_progress", pickup_time: startTime, delivery_time: deliveryTime }
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
      orders,
      ordersLoading,
      addOrder,
      deleteOrderById,
      clearAllOrders,
      updateOrderStatusById,
      startOrderDelivery,
      settings,
      settingsLoading,
      updateSettings,
      toasts,
      showToast,
      dismissToast,
    }),
    [
      orders,
      ordersLoading,
      addOrder,
      deleteOrderById,
      clearAllOrders,
      updateOrderStatusById,
      startOrderDelivery,
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

function safeParseGeometry(geometry) {
  if (!geometry) return null;
  if (Array.isArray(geometry)) return geometry;
  try {
    return JSON.parse(geometry);
  } catch {
    return null;
  }
}

function normalizeOrder(order) {
  if (!order) return order;
  return {
    ...order,
    geometry: safeParseGeometry(order.geometry),
  };
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
