import { supabase } from "../lib/supabaseClient";

const DEFAULT_COST_PER_KM = 10;

/** Fetch the global costPerKm */
export async function fetchCostPerKm() {
    const { data, error } = await supabase
        .from("app_settings")
        .select("cost_per_km")
        .eq("id", 1)
        .single();

    if (error && error.code !== "PGRST116") {
        console.error("Supabase: failed to fetch global costPerKm", error);
        return DEFAULT_COST_PER_KM;
    }
    const parsed = Number(data?.cost_per_km);
    return isNaN(parsed) ? DEFAULT_COST_PER_KM : parsed;
}

/** Persist the global costPerKm (admin only) */
export async function saveCostPerKm(value) {
    const { error } = await supabase
        .from("app_settings")
        .upsert({
            id: 1,
            cost_per_km: value,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

    if (error) {
        console.error("Supabase: failed to update global costPerKm", error);
    }
}
