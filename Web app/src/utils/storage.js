const ROUTE_HISTORY_KEY = "delivery_navigator_route_history";
const SETTINGS_KEY = "delivery_navigator_settings";

export function loadRouteHistory() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ROUTE_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRouteHistory(history) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ROUTE_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
}

const DEFAULT_SETTINGS = {
  costPerKm: 10,
};

export function loadSettings() {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...(parsed && typeof parsed === "object" ? parsed : {}),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}
